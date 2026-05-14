import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ✅ dotenv en premier
dotenv.config();

import "./server/config/db.js";
import authRoutes     from "./server/routes/auth.js";
import generateRoutes from "./server/routes/generate.js";
import analyzeRoutes  from "./server/routes/analyze.js";
import stripeRoutes   from "./server/routes/stripe.js";
import linkedinRoutes from "./server/routes/linkedin.js";
import scrapingRoutes from "./server/routes/scraping.js";
import threadsRoutes          from "./server/routes/threads.js";
import linkedinAnalyticsRoutes from "./server/routes/linkedin-analytics.js";

const app = express();

app.use(cors());

// ⚠️ IMPORTANT : le webhook Stripe doit recevoir le raw body AVANT express.json()
app.use("/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth",     authRoutes);
app.use("/generate", generateRoutes);
app.use("/analyze",  analyzeRoutes);
app.use("/stripe",   stripeRoutes);
app.use("/linkedin", linkedinRoutes);
app.use("/scraping", scrapingRoutes);
app.use("/threads",           threadsRoutes);
app.use("/linkedin-analytics", linkedinAnalyticsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
