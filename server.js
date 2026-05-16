import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ✅ dotenv en premier
dotenv.config();

// ─── Logger Winston ───────────────────────────────────────────────────────────
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
          return `${timestamp} [${level}] ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// ─── Rate limiters ────────────────────────────────────────────────────────────
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many generation requests, slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: { error: "Too many admin requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many tracking requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

import "./server/config/db.js";
import authRoutes              from "./server/routes/auth.js";
import generateRoutes          from "./server/routes/generate.js";
import analyzeRoutes           from "./server/routes/analyze.js";
import stripeRoutes            from "./server/routes/stripe.js";
import linkedinRoutes          from "./server/routes/linkedin.js";
import scrapingRoutes          from "./server/routes/scraping.js";
import threadsRoutes           from "./server/routes/threads.js";
import linkedinAnalyticsRoutes from "./server/routes/linkedin-analytics.js";
import teamRoutes              from "./server/routes/team.js";
import calendarRouter          from "./server/routes/calendar.js";
import twitterRouter           from "./server/routes/twitter.js";
import agencyRouter            from "./server/routes/agency.js";
import instagramRouter         from "./server/routes/instagram.js";
import facebookRouter          from "./server/routes/facebook.js";
import tiktokRouter            from "./server/routes/tiktok.js";
import adminRouter             from "./server/routes/admin.js";
import analyticsRouter         from "./server/routes/analytics.js";

const app = express();

// ⚠️ CORS doit etre avant tout le reste (rate limiters inclus)
// sinon les reponses 429 n ont pas le header Access-Control-Allow-Origin
const corsOptions = {
  origin: ["https://www.aigrowthpilot.app", "http://localhost:5173"],
  credentials: true,
};
app.set("trust proxy", 1); // Railway est derrière un proxy
app.use(cors(corsOptions));

// ⚠️ IMPORTANT : le webhook Stripe doit recevoir le raw body AVANT express.json()
app.use("/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

// ─── Request logger middleware ─────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level](`${req.method} ${req.path}`, {
      status:   res.statusCode,
      duration: `${duration}ms`,
      ip:       req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
    });
  });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth",               authLimiter,      authRoutes);
app.use("/generate",           generateLimiter,  generateRoutes);
app.use("/analyze",                              analyzeRoutes);
app.use("/stripe",                               stripeRoutes);
app.use("/linkedin",                             linkedinRoutes);
app.use("/scraping",                             scrapingRoutes);
app.use("/threads",                              threadsRoutes);
app.use("/linkedin-analytics",                   linkedinAnalyticsRoutes);
app.use("/team",                                 teamRoutes);
app.use("/calendar",                             calendarRouter);
app.use("/twitter",                              twitterRouter);
app.use("/agency",                               agencyRouter);
app.use("/instagram",                            instagramRouter);
app.use("/facebook",                             facebookRouter);
app.use("/tiktok",                               tiktokRouter);
app.use("/admin",              adminLimiter,     adminRouter);
app.use("/analytics",          analyticsLimiter, analyticsRouter);

// ─── Error handler global ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { message: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Backend running on port ${PORT}`, { env: process.env.NODE_ENV || "development" });
});
