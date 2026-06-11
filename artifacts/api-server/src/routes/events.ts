import { Router } from "express";
import { getCurrentUser } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { realtime } from "../lib/realtime.js";
import { errorResponse } from "../lib/responses/error-response.js";

const router = Router();

// GET /api/events  — Server-Sent Events stream.
//
// Auth: cookie-based JWT (EventSource sends cookies automatically via
// withCredentials:true on the client).
//
// The client receives:
//   event: connected    — on successful auth, once per connection
//   event: order:created / order:updated / table:updated — pushed by routes
//   : heartbeat         — comment-only keepalive every 30 s
//
// On disconnect the client EventSource retries automatically (spec behaviour).
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

    // SSE response headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Connection", "keep-alive");
    // Disable Nginx / reverse-proxy buffering so events flush immediately
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Confirm connection to client.
    // restaurantId is kept for backward compatibility while new code moves to businessId.
    res.write(
      `event: connected\ndata: ${JSON.stringify({
        businessId: businessContext.businessId,
        businessMode: businessContext.businessMode,
        restaurantId: businessContext.restaurantId,
      })}\n\n`,
    );

    realtime.add(businessContext.businessId, res);

    // Keepalive ping every 30 s — prevents proxy idle-timeout disconnects
    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 30_000);

    // Clean up when the browser closes the tab / navigates away
    req.on("close", () => {
      clearInterval(heartbeat);
      realtime.remove(businessContext.businessId, res);
    });
  } catch (error) {
    return void handleApiError(res, error);
  }
});

export default router;
