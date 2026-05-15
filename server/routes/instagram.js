// server/routes/instagram.js
// GrowthPILOT — Sprint 3 : Instagram webhook Meta
// Pour l'instant : vérification webhook uniquement
// La publication directe sera activée après validation Meta App Review

import express from "express";
import crypto  from "crypto";

const router = express.Router();

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_TOKEN || "growthpilot_ig_webhook_2026";
const APP_SECRET   = process.env.META_APP_SECRET;

// ─── GET /instagram/callback — vérification webhook Meta ─────────────────────
// Meta appelle cet endpoint lors de la configuration du webhook
// avec mode=subscribe, challenge et verify_token
router.get("/callback", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Instagram webhook verify:", { mode, token: !!token, challenge: !!challenge });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Instagram webhook verified!");
    return res.status(200).send(challenge);
  }

  console.error("❌ Instagram webhook verification failed");
  return res.status(403).json({ error: "Verification failed" });
});

// ─── POST /instagram/callback — réception des events Meta ────────────────────
// Meta envoie les notifications ici après publication, commentaires, etc.
router.post("/callback", (req, res) => {
  // Vérification signature Meta (sécurité)
  if (APP_SECRET) {
    const signature = req.headers["x-hub-signature-256"];
    if (signature) {
      const expected = "sha256=" + crypto
        .createHmac("sha256", APP_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (signature !== expected) {
        console.error("Instagram webhook: invalid signature");
        return res.status(403).json({ error: "Invalid signature" });
      }
    }
  }

  const body = req.body;
  console.log("Instagram webhook event:", JSON.stringify(body).slice(0, 200));

  // Traitement des events (à enrichir après App Review)
  if (body.object === "instagram") {
    body.entry?.forEach(entry => {
      entry.changes?.forEach(change => {
        console.log("Instagram change:", change.field, change.value);
        // TODO : traiter les events (commentaires, mentions, etc.)
      });
    });
  }

  // Toujours répondre 200 rapidement à Meta
  res.status(200).json({ status: "ok" });
});

export default router;
