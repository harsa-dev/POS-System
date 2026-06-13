import { Router } from "express";

import { getCurrentUser } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { realtime } from "../lib/realtime.js";
import { errorResponse } from "../lib/responses/error-response.js";

const router = Router();

router.get("/events", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return void errorResponse(res, {
        status: 401,
        code: errorCodes.unauthorized,
        message: "Unauthorized.",
      });
    }

    const businessContext = await requireBusinessContextForUser(user);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    res.write(
      `event: connected\ndata: ${JSON.stringify({
        businessId: businessContext.businessId,
        businessMode: businessContext.businessMode,
        businessType: businessContext.businessType,
      })}\n\n`,
    );

    realtime.add(businessContext.businessId, res);

    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 30_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      realtime.remove(businessContext.businessId, res);
    });
  } catch (error) {
    return void handleApiError(res, error);
  }
});

export default router;
