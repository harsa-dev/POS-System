import { Router } from "express";
import { getCurrentUser, getRestaurantForUser } from "../lib/auth.js";
import { realtime } from "../lib/realtime.js";
import { ERR } from "../lib/constants.js";

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
  const user = await getCurrentUser(req);
  if (!user) {
    return void res
      .status(401)
      .json({ success: false, message: ERR.UNAUTHORIZED });
  }

  const restaurant = await getRestaurantForUser(user);
  if (!restaurant) {
    return void res
      .status(404)
      .json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
  }

  // SSE response headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Connection", "keep-alive");
  // Disable Nginx / reverse-proxy buffering so events flush immediately
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Confirm connection to client
  res.write(
    `event: connected\ndata: ${JSON.stringify({ restaurantId: restaurant.id })}\n\n`,
  );

  realtime.add(restaurant.id, res);

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
    realtime.remove(restaurant.id, res);
  });
});

export default router;
