// server/routes/tiktok.js
// GrowthPILOT — Sprint 2 : TikTok OAuth 2.0 + publication vidéo

import express from "express";
import jwt     from "jsonwebtoken";
import crypto  from "crypto";
import db      from "../db.js";

const router = express.Router();

const TT_CLIENT_ID     = process.env.TIKTOK_CLIENT_ID;
const TT_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TT_REDIRECT_URI  = process.env.TIKTOK_REDIRECT_URI;
const FRONTEND_URL     = process.env.FRONTEND_URL;

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

// ─── GET /tiktok/connect ──────────────────────────────────────────────────────
router.get("/connect", auth, (req, res) => {
  const state        = Buffer.from(JSON.stringify({ userId: req.user.id })).toString("base64");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge= crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  // Stocker le codeVerifier en session temporaire (cookie signé ou state étendu)
  // On l'encode dans le state pour simplicité
  const fullState = Buffer.from(JSON.stringify({ userId: req.user.id, cv: codeVerifier })).toString("base64");

  const params = new URLSearchParams({
    client_key:            TT_CLIENT_ID,
    redirect_uri:          TT_REDIRECT_URI,
    response_type:         "code",
    scope:                 "user.info.basic,video.upload,video.publish",
    state:                 fullState,
    code_challenge:        codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  if (req.query.token) { res.redirect(authUrl); } else { res.json({ url: authUrl }); }
});

// ─── GET /tiktok/oauth/callback ───────────────────────────────────────────────
router.get("/oauth/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code) return res.redirect(`${FRONTEND_URL}?tiktok=error`);

  let userId, codeVerifier;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64").toString());
    userId       = parsed.userId;
    codeVerifier = parsed.cv;
  } catch { return res.redirect(`${FRONTEND_URL}?tiktok=error`); }

  try {
    // Échange code → access token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key:    TT_CLIENT_ID,
        client_secret: TT_CLIENT_SECRET,
        code,
        grant_type:    "authorization_code",
        redirect_uri:  TT_REDIRECT_URI,
        code_verifier: codeVerifier,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect(`${FRONTEND_URL}?tiktok=error`);

    const { access_token, refresh_token, open_id } = tokenData;

    // Profil utilisateur
    const profileRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profileData = await profileRes.json();
    const username    = profileData.data?.user?.display_name || null;

    await db.query(
      `UPDATE users SET
        tiktok_access_token=$1,
        tiktok_refresh_token=$2,
        tiktok_user_id=$3,
        tiktok_username=$4
       WHERE id=$5`,
      [access_token, refresh_token || null, open_id, username, userId]
    );

    res.redirect(`${FRONTEND_URL}?tiktok=connected`);
  } catch (err) {
    console.error("TikTok callback error:", err.message);
    res.redirect(`${FRONTEND_URL}?tiktok=error`);
  }
});

// ─── GET /tiktok/status ───────────────────────────────────────────────────────
router.get("/status", auth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT tiktok_user_id, tiktok_username FROM users WHERE id=$1",
      [req.user.id]
    );
    const u = result.rows[0];
    res.json({ connected: !!u?.tiktok_user_id, username: u?.tiktok_username || null });
  } catch { res.json({ connected: false, username: null }); }
});

// ─── POST /tiktok/post ────────────────────────────────────────────────────────
// TikTok nécessite une URL vidéo publique accessible
// Le texte seul n'est pas supporté — une vidéo est obligatoire
router.post("/post", auth, async (req, res) => {
  const { videoUrl, caption } = req.body;
  if (!videoUrl) return res.status(400).json({ message: "TikTok requires a video URL.", code: "video_required" });

  try {
    const result = await db.query(
      "SELECT tiktok_access_token, tiktok_user_id FROM users WHERE id=$1",
      [req.user.id]
    );
    const u = result.rows[0];
    if (!u?.tiktok_access_token) return res.status(400).json({ message: "TikTok not connected" });

    const { tiktok_access_token: token } = u;

    // Étape 1 : initialiser l'upload
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title:        caption?.slice(0, 150) || "Posted via GrowthPILOT",
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet:  false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source:    "PULL_FROM_URL",
          video_url: videoUrl,
        },
      }),
    });
    const initData = await initRes.json();

    if (!initData.data?.publish_id) {
      return res.status(500).json({ message: "Failed to initialize TikTok upload", detail: initData });
    }

    // ── Sauvegarder dans publish_log ─────────────────────────────────────────
    try {
      await db.query(
        "INSERT INTO publish_log (user_id, platform, post_id, status) VALUES ($1, $2, $3, 'published')",
        [req.user.id, "tiktok", initData.data.publish_id]
      );
    } catch (logErr) { console.error("publish_log error:", logErr.message); }
    res.json({ success: true, publishId: initData.data.publish_id });
  } catch (err) {
    console.error("TikTok post error:", err.message);
    res.status(500).json({ message: "TikTok post failed" });
  }
});

// ─── DELETE /tiktok/disconnect ────────────────────────────────────────────────
router.delete("/disconnect", auth, async (req, res) => {
  await db.query(
    "UPDATE users SET tiktok_access_token=NULL, tiktok_refresh_token=NULL, tiktok_user_id=NULL, tiktok_username=NULL WHERE id=$1",
    [req.user.id]
  );
  res.json({ success: true });
});

export default router;
