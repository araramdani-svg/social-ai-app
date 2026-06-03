/**
 * GrowthPILOT — Webhooks (Zapier + Slack)
 * File: server/routes/webhooks.js
 *
 * Routes :
 *  POST /webhooks/zapier/subscribe    — enregistrer un webhook Zapier
 *  DELETE /webhooks/zapier/:id        — supprimer un webhook
 *  GET  /webhooks/zapier              — lister ses webhooks
 *  POST /webhooks/slack/subscribe     — connecter un channel Slack
 *  DELETE /webhooks/slack             — déconnecter Slack
 *  POST /webhooks/test/:id            — tester un webhook
 *
 * Events déclencheurs (appelés depuis auth.js/team.js via triggerWebhooks) :
 *  post.created, post.approved, post.rejected, post.assigned,
 *  post.published, comment.added, team.member_joined
 *
 * Migration SQL requise :
 *   CREATE TABLE IF NOT EXISTS user_webhooks (
 *     id SERIAL PRIMARY KEY,
 *     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *     type VARCHAR(20) NOT NULL DEFAULT 'zapier', -- 'zapier' | 'slack'
 *     url TEXT NOT NULL,
 *     events TEXT[] NOT NULL DEFAULT '{}',
 *     label VARCHAR(100),
 *     active BOOLEAN DEFAULT TRUE,
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     last_triggered_at TIMESTAMPTZ,
 *     trigger_count INTEGER DEFAULT 0
 *   );
 */

import express from "express";
import jwt     from "jsonwebtoken";
import db      from "../config/db.js";

const router = express.Router();

// ─── Middleware auth ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── Events disponibles ───────────────────────────────────────────────────────
export const WEBHOOK_EVENTS = [
  "post.created",
  "post.approved",
  "post.rejected",
  "post.assigned",
  "post.published",
  "comment.added",
  "team.member_joined",
  "client.added",
];

// ─── Helper : déclencher les webhooks pour un user + event ───────────────────
export async function triggerWebhooks(userId, event, payload = {}) {
  try {
    const result = await db.query(
      `SELECT id, url, type FROM user_webhooks
       WHERE user_id = $1 AND active = TRUE AND $2 = ANY(events)`,
      [userId, event]
    );
    if (!result.rows.length) return;

    for (const wh of result.rows) {
      try {
        const body = {
          event,
          timestamp: new Date().toISOString(),
          source:    "GrowthPILOT",
          data:      payload,
        };

        // Format Slack spécial (blocks)
        const fetchBody = wh.type === "slack"
          ? JSON.stringify({
              text: `*GrowthPILOT* — \`${event}\``,
              blocks: [{
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*🚀 GrowthPILOT Event: \`${event}\`*\n${Object.entries(payload).map(([k,v]) => `• *${k}:* ${v}`).join("\n")}`,
                },
              }],
            })
          : JSON.stringify(body);

        const r = await fetch(wh.url, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    fetchBody,
          signal:  AbortSignal.timeout(5000),
        });

        // Update stats
        await db.query(
          `UPDATE user_webhooks SET last_triggered_at=NOW(), trigger_count=trigger_count+1 WHERE id=$1`,
          [wh.id]
        ).catch(() => {});

        console.log(`[webhooks] ${event} → ${wh.type} ${wh.url.slice(0,50)}... (${r.status})`);
      } catch (err) {
        console.error(`[webhooks] Failed to trigger ${wh.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[webhooks] triggerWebhooks error:", err.message);
  }
}

// ─── GET /webhooks — lister ses webhooks ──────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, type, url, events, label, active, created_at, last_triggered_at, trigger_count
       FROM user_webhooks WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ webhooks: result.rows, available_events: WEBHOOK_EVENTS });
  } catch (err) {
    console.error("GET /webhooks:", err.message);
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

// ─── POST /webhooks/subscribe — enregistrer un webhook ───────────────────────
router.post("/subscribe", auth, async (req, res) => {
  const { url, events, label, type = "zapier" } = req.body;

  if (!url?.startsWith("https://")) return res.status(400).json({ error: "URL must start with https://" });
  if (!Array.isArray(events) || !events.length) return res.status(400).json({ error: "At least one event required" });

  const invalidEvents = events.filter(e => !WEBHOOK_EVENTS.includes(e));
  if (invalidEvents.length) return res.status(400).json({ error: `Invalid events: ${invalidEvents.join(", ")}` });

  // Limite : 10 webhooks par user
  const count = await db.query("SELECT COUNT(*)::int AS c FROM user_webhooks WHERE user_id=$1", [req.user.id]);
  if (count.rows[0].c >= 10) return res.status(400).json({ error: "Max 10 webhooks per account" });

  try {
    const result = await db.query(
      `INSERT INTO user_webhooks (user_id, type, url, events, label, active, created_at)
       VALUES ($1,$2,$3,$4,$5,TRUE,NOW()) RETURNING id, type, url, events, label, active`,
      [req.user.id, type, url, events, label || null]
    );

    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'webhook_subscribed',$2,NOW())`,
      [req.user.id, JSON.stringify({ type, events, label })]
    ).catch(() => {});

    // Test immédiat
    await triggerWebhooks(req.user.id, "post.created", {
      test:    true,
      message: "GrowthPILOT webhook connected successfully!",
    });

    console.log(`[webhooks] subscribed: user=${req.user.id} type=${type} events=${events.join(",")}`);
    res.json({ success: true, webhook: result.rows[0] });
  } catch (err) {
    console.error("POST /webhooks/subscribe:", err.message);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// ─── PATCH /webhooks/:id — activer/désactiver/modifier ───────────────────────
router.patch("/:id", auth, async (req, res) => {
  const { active, events, label } = req.body;
  try {
    const fields = []; const vals = []; let i = 1;
    if (active    !== undefined) { fields.push(`active=$${i++}`);    vals.push(active); }
    if (events    !== undefined) { fields.push(`events=$${i++}`);    vals.push(events); }
    if (label     !== undefined) { fields.push(`label=$${i++}`);     vals.push(label); }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

    vals.push(req.params.id, req.user.id);
    const result = await db.query(
      `UPDATE user_webhooks SET ${fields.join(",")} WHERE id=$${i} AND user_id=$${i+1} RETURNING *`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ error: "Webhook not found" });
    res.json({ success: true, webhook: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// ─── DELETE /webhooks/:id — supprimer un webhook ──────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM user_webhooks WHERE id=$1 AND user_id=$2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Webhook not found" });

    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'webhook_deleted',$2,NOW())`,
      [req.user.id, JSON.stringify({ webhook_id: req.params.id })]
    ).catch(() => {});

    console.log(`[webhooks] deleted: webhook=${req.params.id} user=${req.user.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// ─── POST /webhooks/:id/test — tester un webhook ─────────────────────────────
router.post("/:id/test", auth, async (req, res) => {
  try {
    const wh = await db.query(
      "SELECT * FROM user_webhooks WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (!wh.rows.length) return res.status(404).json({ error: "Webhook not found" });

    const r = await fetch(wh.rows[0].url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        event:     "test",
        timestamp: new Date().toISOString(),
        source:    "GrowthPILOT",
        data:      { message: "Test webhook from GrowthPILOT", webhook_id: req.params.id },
      }),
      signal: AbortSignal.timeout(5000),
    });

    console.log(`[webhooks] test: webhook=${req.params.id} status=${r.status}`);
    res.json({ success: r.ok, status: r.status });
  } catch (err) {
    res.status(500).json({ error: `Test failed: ${err.message}` });
  }
});

export default router;
