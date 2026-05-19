// server/routes/instagram.js
// GrowthPILOT — Instagram API with Instagram Login (app growthPILOT-IG)
// Flow : instagram.com/oauth/authorize → api.instagram.com/oauth/access_token → graph.instagram.com

import express from "express";
import crypto  from "crypto";
import jwt     from "jsonwebtoken";
import db      from "../db.js";

const router = express.Router();

const IG_APP_ID       = process.env.INSTAGRAM_APP_ID;
const IG_APP_SECRET   = process.env.INSTAGRAM_APP_SECRET;
const IG_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
const FRONTEND_URL    = process.env.FRONTEND_URL || "https://www.aigrowthpilot.app";

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
    scope:         "instagram_business_basic,instagram_content_publish,instagram_business_manage_messages,instagram_business_manage_comments",
    response_type: "code",
    state,
  });
  const authUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  console.log("IG connect URL:", authUrl);
  if (req.query.token) { res.redirect(authUrl); } else { res.json({ url: authUrl }); }
});

// ─── GET /instagram/oauth/callback ───────────────────────────────────────────
router.get("/oauth/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code) {
    console.error("Instagram OAuth error:", error);
    return res.redirect(`${FRONTEND_URL}?instagram=error`);
  }

  let userId = null;
  try {
    userId = JSON.parse(Buffer.from(state, "base64").toString()).userId;
  } catch {
    return res.redirect(`${FRONTEND_URL}?instagram=error`);
  }

  try {
    // Étape 1 : code → short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     IG_APP_ID,
        client_secret: IG_APP_SECRET,
        grant_type:    "authorization_code",
        redirect_uri:  IG_REDIRECT_URI,
        code,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    console.log("IG step1 short token:", JSON.stringify(tokenData));
    if (!tokenData.access_token) {
      console.error("IG token exchange failed:", JSON.stringify(tokenData));
      return res.redirect(`${FRONTEND_URL}?instagram=error`);
    }

    const shortToken = tokenData.access_token;
    const igUserId   = tokenData.user_id?.toString();

    // Étape 2 : short-lived → long-lived token (60 jours)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?` +
      new URLSearchParams({
        grant_type:    "ig_exchange_token",
        client_secret: IG_APP_SECRET,
        access_token:  shortToken,
      }).toString()
    );
    const longData = await longRes.json();
    console.log("IG step2 long token:", JSON.stringify(longData));
    const accessToken = longData.access_token || shortToken;

    // Étape 3 : profil Instagram
    const profileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username,name,account_type&access_token=${accessToken}`
    );
    const profile = await profileRes.json();
    console.log("IG step3 profile:", JSON.stringify(profile));
    const username = profile.username || profile.name || null;
    const finalId  = igUserId || profile.id;

    if (!finalId) {
      console.error("IG no user ID found");
      return res.redirect(`${FRONTEND_URL}?instagram=error`);
    }

    // Étape 4 : sauvegarder en DB
    await db.query(
      "UPDATE users SET instagram_access_token=$1, instagram_user_id=$2, instagram_username=$3 WHERE id=$4",
      [accessToken, finalId, username, userId]
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
router.post("/post", auth, async (req, res) => {
  const { caption, imageUrl } = req.body;
  if (!caption)  return res.status(400).json({ message: "Caption required" });
  if (!imageUrl) return res.status(400).json({ message: "Instagram requires an image URL.", code: "image_required" });
  try {
    const result = await db.query("SELECT instagram_access_token, instagram_user_id FROM users WHERE id=$1", [req.user.id]);
    const user = result.rows[0];
    if (!user?.instagram_access_token) return res.status(400).json({ message: "Instagram not connected" });
    const { instagram_access_token: token, instagram_user_id: igUserId } = user;

    // Créer container
    const containerRes = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
    });
    const containerData = await containerRes.json();
    if (!containerData.id) return res.status(500).json({ message: "Failed to create container", detail: containerData });

    await new Promise(r => setTimeout(r, 2000));

    // Publier
    const publishRes = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media_publish`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerData.id, access_token: token }),
    });
    const publishData = await publishRes.json();
    if (!publishData.id) return res.status(500).json({ message: "Failed to publish", detail: publishData });
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

// ─── Webhook ──────────────────────────────────────────────────────────────────
router.get("/callback", (req, res) => {
  const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
  const VERIFY = process.env.INSTAGRAM_WEBHOOK_TOKEN || "growthpilot_ig_webhook_2026";
  if (mode === "subscribe" && token === VERIFY) return res.status(200).send(challenge);
  return res.status(403).json({ error: "Verification failed" });
});

router.post("/callback", (req, res) => {
  if (IG_APP_SECRET) {
    const sig      = req.headers["x-hub-signature-256"];
    const expected = "sha256=" + crypto.createHmac("sha256", IG_APP_SECRET).update(JSON.stringify(req.body)).digest("hex");
    if (sig && sig !== expected) return res.status(403).json({ error: "Invalid signature" });
  }
  res.status(200).json({ status: "ok" });
});

export default router;
