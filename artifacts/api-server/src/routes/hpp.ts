import { Router, type IRouter } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { successResponse } from "../lib/responses/success-response.js";

const router: IRouter = Router();

type ComponentShape = { totalCost: number; category: string };

function computeHppStats(batch: {
  outputUnits: number;
  targetMargin: number;
  components: ComponentShape[];
}) {
  const totalCost = batch.components.reduce((sum, c) => sum + c.totalCost, 0);
  const hppPerUnit = batch.outputUnits > 0 ? Math.round(totalCost / batch.outputUnits) : 0;
  const suggestedPrice = Math.round(hppPerUnit * (1 + batch.targetMargin));
  const byCategory: Record<string, number> = {};
  for (const c of batch.components) {
    byCategory[c.category] = (byCategory[c.category] ?? 0) + c.totalCost;
  }
  return { totalCost, hppPerUnit, suggestedPrice, byCategory };
}

router.get("/hpp/summary", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const batch = await prisma.hppBatch.findFirst({
      where: { businessId: businessContext.businessId },
      orderBy: { batchDate: "desc" },
      include: {
        components: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!batch) {
      return successResponse(res, { data: null });
    }

    const stats = computeHppStats(batch);

    return successResponse(res, {
      data: {
        batch: {
          id: batch.id,
          name: batch.name,
          batchDate: batch.batchDate.toISOString(),
          outputUnits: batch.outputUnits,
          targetMargin: batch.targetMargin,
          notes: batch.notes ?? null,
          createdAt: batch.createdAt.toISOString(),
        },
        components: batch.components.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          unitCost: c.unitCost,
          quantity: c.quantity,
          unit: c.unit,
          totalCost: c.totalCost,
          note: c.note ?? null,
        })),
        stats,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/hpp/batches", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const batches = await prisma.hppBatch.findMany({
      where: { businessId: businessContext.businessId },
      orderBy: { batchDate: "desc" },
      include: {
        components: { select: { totalCost: true, category: true } },
      },
    });

    const mapped = batches.map((b) => {
      const stats = computeHppStats(b);
      return {
        id: b.id,
        name: b.name,
        batchDate: b.batchDate.toISOString(),
        outputUnits: b.outputUnits,
        targetMargin: b.targetMargin,
        componentCount: b.components.length,
        totalCost: stats.totalCost,
        hppPerUnit: stats.hppPerUnit,
        suggestedPrice: stats.suggestedPrice,
      };
    });

    return successResponse(res, {
      data: { batches: mapped, total: mapped.length },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
