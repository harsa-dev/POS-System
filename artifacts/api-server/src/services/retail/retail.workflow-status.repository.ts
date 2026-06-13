import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { RetailActor, RetailBusinessScope, RetailReceivingQueueDto } from "./retail.types.js";

type RetailReceivingStatus = RetailReceivingQueueDto["status"];

type DelegateWriteCount = {
  count: number;
};

type RetailReceivingStatusRow = {
  id: string;
  businessId: string;
  referenceNumber: string;
  status: string;
  updatedAt: Date;
};

type RetailReceivingStatusDelegate = {
  findFirst(args: Record<string, unknown>): Promise<RetailReceivingStatusRow | null>;
  updateMany(args: Record<string, unknown>): Promise<DelegateWriteCount>;
};

type RetailWorkflowStatusTransactionClient = {
  retailReceiving: RetailReceivingStatusDelegate;
  $executeRaw(query: unknown): Promise<number>;
};

export type RetailReceivingStatusUpdateInput = {
  scope: RetailBusinessScope;
  actor: RetailActor;
  receivingId: string;
  status: RetailReceivingStatus;
};

export type RetailWorkflowStatusUpdateResult = {
  entity: "RetailReceiving";
  id: string;
  previousStatus: RetailReceivingStatus;
  status: RetailReceivingStatus;
  updated: boolean;
  updatedAt: string;
  reason?: string;
};

const allowedReceivingTransitions: Record<RetailReceivingStatus, RetailReceivingStatus[]> = {
  draft: ["ordered"],
  ordered: ["partial", "received"],
  partial: ["received"],
  received: [],
};

function isRetailReceivingStatus(value: string): value is RetailReceivingStatus {
  return ["draft", "ordered", "partial", "received"].includes(value);
}

function canTransitionReceivingStatus(from: RetailReceivingStatus, to: RetailReceivingStatus) {
  return allowedReceivingTransitions[from].includes(to);
}

export async function updateRetailReceivingStatusWithDelegate(
  input: RetailReceivingStatusUpdateInput,
): Promise<RetailWorkflowStatusUpdateResult | null> {
  const now = new Date();

  return prisma.$transaction(
    async (tx) => {
      const retailTx = tx as unknown as RetailWorkflowStatusTransactionClient;
      const current = await retailTx.retailReceiving.findFirst({
        where: {
          businessId: input.scope.businessId,
          id: input.receivingId,
        },
        select: {
          id: true,
          businessId: true,
          referenceNumber: true,
          status: true,
          updatedAt: true,
        },
      });

      if (!current) {
        return null;
      }

      if (!isRetailReceivingStatus(current.status)) {
        throw new Error(`Retail receiving ${current.id} has unsupported status ${current.status}.`);
      }

      if (current.status === input.status) {
        return {
          entity: "RetailReceiving",
          id: current.id,
          previousStatus: current.status,
          status: input.status,
          updated: false,
          updatedAt: current.updatedAt.toISOString(),
          reason: "Receiving status is already set to the requested value.",
        };
      }

      if (!canTransitionReceivingStatus(current.status, input.status)) {
        return {
          entity: "RetailReceiving",
          id: current.id,
          previousStatus: current.status,
          status: input.status,
          updated: false,
          updatedAt: current.updatedAt.toISOString(),
          reason: `Invalid receiving status transition from ${current.status} to ${input.status}.`,
        };
      }

      const update = await retailTx.retailReceiving.updateMany({
        where: {
          businessId: input.scope.businessId,
          id: input.receivingId,
          status: current.status,
        },
        data: {
          status: input.status,
          ...(input.status === "received" ? { receivedAt: now } : {}),
          updatedAt: now,
        },
      });

      if (update.count !== 1) {
        throw new Error(`Retail receiving ${current.id} changed before status update could be completed.`);
      }

      await retailTx.$executeRaw(Prisma.sql`
        INSERT INTO "AuditLog" (
          "id",
          "businessId",
          "userId",
          "action",
          "entityType",
          "entityId",
          "changes",
          "createdAt"
        ) VALUES (
          ${randomUUID()},
          ${input.scope.businessId},
          ${input.actor.id},
          'UPDATE',
          'RetailReceiving',
          ${current.id},
          CAST(${JSON.stringify({
            referenceNumber: current.referenceNumber,
            previousStatus: current.status,
            status: input.status,
          })} AS jsonb),
          ${now}
        )
      `);

      return {
        entity: "RetailReceiving",
        id: current.id,
        previousStatus: current.status,
        status: input.status,
        updated: true,
        updatedAt: now.toISOString(),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
