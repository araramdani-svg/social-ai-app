// server/routes/analytics.js
// GrowthPILOT — Comptage visites landing + pages app

import express from "express";
import db      from "../db.js";

const router = express.Router();

// ─── POST /analytics/track ────────────────────────────────────────────────────
// Appelé côté frontend à chaque changement de page
// Body : { page: "landing" | "generator" | "pricing" | "auth" }
router.post("/track", async (req, res) => {
  try {
    const { page } = req.body;
    if (!page || typeof page !== "string") return res.status(400).json({ error: "Missing page" });
    const validPages = ["landing", "generator", "pricing", "auth", "admin"];
    const safePage = validPages.includes(page) ? page : "other";

    // Récupère IP et user-agent pour dédoublonnage basique (non stockés, juste hachés)
    const ip        = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await db.query(
      `INSERT INTO page_views (page, ip_hash, user_agent_short, created_at)
       VALUES ($1, MD5($2), $3, NOW())`,
      [safePage, ip, userAgent.slice(0, 80)]
    );
    res.json({ ok: true });
  } catch (err) {
    // Silencieux côté client pour ne pas casser l'app
    console.error("Analytics track error:", err.message);
    res.json({ ok: false });
  }
});

export default router;
