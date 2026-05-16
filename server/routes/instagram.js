// server/routes/instagram.js
// GrowthPILOT — Sprint 3 : Instagram Business OAuth + publication + webhook Meta

import express from "express";
import crypto  from "crypto";
import jwt     from "jsonwebtoken";
import db      from "../db.js";

const router = express.Router();

const IG_APP_ID       = process.env.INSTAGRAM_APP_ID;
const IG_APP_SECRET   = process.env.INSTAGRAM_APP_SECRET;
const IG_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
const FRONTEND_URL    = process.env.FRONTEND_URL;
const VERIFY_TOKEN    = process.env.INSTAGRAM_WEBHOOK_TOKEN || "growthpilot_ig_webhook_2026";

// ─── Auth middleware ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.query.token;
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── GET /instagram/connect ───────────────────────────────────────────────────
router.get("/connect", auth, (req, res) => {
  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString("base64");
  const params = new URLSearchParams({
    client_id:     IG_APP_ID,
    redirect_uri:  IG_REDIRECT_URI,
    scope: "pages_show_list,pages_read_engagement,business_management",
    response_type: "code",
    state,
  });
  const authUrl = `https://www.facebook.com/dialog/oauth?${params.toString()}`;
  if (req.query.token) { res.redirect(authUrl); } else { res.json({ url: authUrl }); }
});

// ─── GET /instagram/oauth/callback ───────────────────────────────────────────
router.get("/oauth/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code) return res.redirect(`${FRONTEND_URL}?instagram=error`);

  let userId = null;
  try { userId = JSON.parse(Buffer.from(state, "base64").toString()).userId; }
  catch { return res.redirect(`${FRONTEND_URL}?instagram=error`); }

  try {
    // Échange code → user access token via Facebook
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ client_id: IG_APP_ID, client_secret: IG_APP_SECRET, redirect_uri: IG_REDIRECT_URI, code }).toString()
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect(`${FRONTEND_URL}?instagram=error`);

    const userToken = tokenData.access_token;

    // Long-lived token (60 jours)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ grant_type: "fb_exchange_token", client_id: IG_APP_ID, client_secret: IG_APP_SECRET, fb_exchange_token: userToken }).toString()
    );
    const longData = await longRes.json();
    const accessToken = longData.access_token || userToken;

    // Récupérer le compte Instagram Business lié à la Page Facebook
    const pagesRes  = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();
    const page      = pagesData.data?.[0];
    if (!page) return res.redirect(`${FRONTEND_URL}?instagram=error`);

    const igRes  = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
    const igData = await igRes.json();
    const igUserId = igData.instagram_business_account?.id;
    if (!igUserId) return res.redirect(`${FRONTEND_URL}?instagram=error`);

    // Profil Instagram
    const profileRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}?fields=id,username,name&access_token=${page.access_token}`);
    const profile    = await profileRes.json();

    await db.query(
      "UPDATE users SET instagram_access_token=$1, instagram_user_id=$2, instagram_username=$3 WHERE id=$4",
      [page.access_token, igUserId, profile.username || profile.name || null, userId]
    );

    res.redirect(`${FRONTEND_URL}?instagram=connected`);
  } catch (err) {
    console.error("Instagram callback error:", err.message);
    res.redirect(`${FRONTEND_URL}?instagram=error`);
  }
});

// ─── GET /instagram/status ────────────────────────────────────────────────────
router.get("/status", auth, async (req, res) => {
  try {
    const result = await db.query("SELECT instagram_user_id, instagram_username FROM users WHERE id=$1", [req.user.id]);
    const user = result.rows[0];
    res.json({ connected: !!user?.instagram_user_id, username: user?.instagram_username || null });
  } catch { res.json({ connected: false, username: null }); }
});

// ─── POST /instagram/post ─────────────────────────────────────────────────────
// Publication Instagram — image obligatoire (API Instagram ne supporte pas texte seul)
router.post("/post", auth, async (req, res) => {
  const { caption, imageUrl } = req.body;
  if (!caption) return res.status(400).json({ message: "Caption required" });
  if (!imageUrl) return res.status(400).json({ message: "Instagram requires an image URL.", code: "image_required" });

  try {
    const result = await db.query("SELECT instagram_access_token, instagram_user_id FROM users WHERE id=$1", [req.user.id]);
    const user = result.rows[0];
    if (!user?.instagram_access_token) return res.status(400).json({ message: "Instagram not connected" });

    const { instagram_access_token: token, instagram_user_id: igUserId } = user;

    // Étape 1 : container media
    const containerRes  = await fetch(`https://graph.instagram.com/v19.0/${igUserId}/media`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
    });
    const containerData = await containerRes.json();
    if (!containerData.id) return res.status(500).json({ message: "Failed to create Instagram container", detail: containerData });

    // Délai Meta recommandé
    await new Promise(r => setTimeout(r, 2000));

    // Étape 2 : publish
    const publishRes  = await fetch(`https://graph.instagram.com/v19.0/${igUserId}/media_publish`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerData.id, access_token: token }),
    });
    const publishData = await publishRes.json();
    if (!publishData.id) return res.status(500).json({ message: "Failed to publish on Instagram", detail: publishData });

    res.json({ success: true, postId: publishData.id });
  } catch (err) {
    console.error("Instagram post error:", err.message);
    res.status(500).json({ message: "Instagram post failed" });
  }
});

// ─── DELETE /instagram/disconnect ─────────────────────────────────────────────
router.delete("/disconnect", auth, async (req, res) => {
  await db.query("UPDATE users SET instagram_access_token=NULL, instagram_user_id=NULL, instagram_username=NULL WHERE id=$1", [req.user.id]);
  res.json({ success: true });
});

// ─── GET /instagram/callback — vérification webhook Meta ─────────────────────
router.get("/callback", (req, res) => {
  const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
  if (mode === "subscribe" && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.status(403).json({ error: "Verification failed" });
});

// ─── POST /instagram/callback — events Meta ───────────────────────────────────
router.post("/callback", (req, res) => {
  if (IG_APP_SECRET) {
    const sig = req.headers["x-hub-signature-256"];
    if (sig) {
      const expected = "sha256=" + crypto.createHmac("sha256", IG_APP_SECRET).update(JSON.stringify(req.body)).digest("hex");
      if (sig !== expected) return res.status(403).json({ error: "Invalid signature" });
    }
  }
  res.status(200).json({ status: "ok" });
});

export default router;
