import type { Response } from "express";
import type { RealtimeEventName } from "./realtime-events.js";

// ---------------------------------------------------------------------------
// In-process SSE client registry.
//
// Scalability note: this is a single-process Map. For horizontal scaling
// (multiple API instances) replace broadcast() with a Redis Pub/Sub publisher
// call behind the same interface — zero frontend changes required.
// ---------------------------------------------------------------------------
class RealtimeManager {
  private clients = new Map<string, Set<Response>>();

  add(restaurantId: string, res: Response): void {
    if (!this.clients.has(restaurantId)) {
      this.clients.set(restaurantId, new Set());
    }
    this.clients.get(restaurantId)!.add(res);
  }

  remove(restaurantId: string, res: Response): void {
    this.clients.get(restaurantId)?.delete(res);
  }

  broadcast(restaurantId: string, event: RealtimeEventName, data: unknown): void {
    const clients = this.clients.get(restaurantId);
    if (!clients || clients.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of clients) {
      try {
        client.write(payload);
      } catch {
        clients.delete(client);
      }
    }
  }

  clientCount(restaurantId: string): number {
    return this.clients.get(restaurantId)?.size ?? 0;
  }
}

export const realtime = new RealtimeManager();
