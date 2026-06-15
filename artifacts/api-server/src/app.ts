import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import { mkdirSync } from "fs";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import uploadRouter from "./routes/upload.js";
import invoiceGuardRouter from "./routes/invoice-guard.js";
import customersPartnersCapabilitiesRouter from "./routes/customers-partners-capabilities.js";
import customersPartnersDetailRouter from "./routes/customers-partners-detail.js";
import customersPartnersLoyaltyTiersRouter from "./routes/customers-partners-loyalty-tiers.js";
import customersPartnersTierAssignmentsRouter from "./routes/customers-partners-tier-assignments.js";
import customersPartnersRouter from "./routes/customers-partners.js";
import customersPartnersImportRouter from "./routes/customers-partners-import.js";
import customersPartnersSalesSyncRouter from "./routes/customers-partners-sales-sync.js";

const UPLOADS_DIR = path.resolve("data/uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

// Build an explicit allowlist of trusted frontend origins.
// The Vite dev server and Replit preview share the same external domain via
// Replit's reverse proxy, so sameSite:"lax" cookies are sufficient and
// "origin: true" (reflect-any) is unnecessary and unsafe.
const allowedOrigins = new Set<string>();

// Replit preview and deployment domains
const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
if (replitDevDomain) {
  allowedOrigins.add(`https://${replitDevDomain}`);
  // Also allow with common port suffixes used by Replit's proxy
  for (const port of [3000, 5000, 8080, 20639]) {
    allowedOrigins.add(`https://${replitDevDomain}:${port}`);
  }
}
for (const d of (process.env.REPLIT_DOMAINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
  allowedOrigins.add(`https://${d}`);
  for (const port of [3000, 5000, 8080, 20639]) {
    allowedOrigins.add(`https://${d}:${port}`);
  }
}
// Local development
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:20639");
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://localhost:5000");
  allowedOrigins.add("http://localhost:5173");
}

if (process.env.FRONTEND_URL) {
  allowedOrigins.add(process.env.FRONTEND_URL);
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / server-to-server requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/media", express.static(UPLOADS_DIR));
app.use("/api/upload", uploadRouter);
app.use("/api/uploads/menu-image", uploadRouter);
app.use("/api", invoiceGuardRouter);
app.use("/api", customersPartnersCapabilitiesRouter);
app.use("/api", customersPartnersDetailRouter);
app.use("/api", customersPartnersLoyaltyTiersRouter);
app.use("/api", customersPartnersTierAssignmentsRouter);
app.use("/api", customersPartnersRouter);
app.use("/api", customersPartnersImportRouter);
app.use("/api", customersPartnersSalesSyncRouter);
app.use("/api", router);

export default app;
