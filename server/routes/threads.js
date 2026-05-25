import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

const THREADS_APP_ID      = process.env.THREADS_APP_ID;
const THREADS_APP_SECRET  = process.env.THREADS_APP_SECRET;
const THREADS_REDIRECT_URI = process.env.THREADS_REDIRECT_URI;
const FRONTEND_URL        = process.env.FRONTEND_URL;

// ─── Middleware auth ───────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.query.token;
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── GET /threads/connect ──────────────────────────────────────────────────────
// Redirige vers l'auth Threads (OAuth2 via Meta)
router.get("/connect", authenticateToken, (req, res) => {
  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString("base64");
  const scope = "threads_basic,threads_content_publish";

  const authUrl =
    `https://threads.net/oauth/authorize` +
    `?client_id=${THREADS_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(THREADS_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&response_type=code` +
    `&state=${state}`;

  if (req.query.token) {
  res.redirect(authUrl);
} else {
  res.json({ url: authUrl });
};
});

// ─── GET /threads/callback ─────────────────────────────────────────────────────
// Callback OAuth — échange le code contre un access token
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;
  console.log("Threads callback — code:", !!code, "error:", error);

  if (error || !code) {
    console.error("Threads OAuth error:", error);
    return res.redirect(`${FRONTEND_URL}?threads=error`);
  }

  try {
    let userId = null;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString());
      userId = decoded.userId;
    } catch {
      return res.redirect(`${FRONTEND_URL}?threads=error`);
    }

    // Échange code → short-lived token
    const tokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     THREADS_APP_ID,
        client_secret: THREADS_APP_SECRET,
        grant_type:    "authorization_code",
        redirect_uri:  THREADS_REDIRECT_URI,
        code,
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    console.log("Threads token response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      console.error("No Threads access token");
      return res.redirect(`${FRONTEND_URL}?threads=error`);
    }

    const shortToken = tokenData.access_token;
    const threadsUserId = tokenData.user_id;

    // Échange short-lived → long-lived token (60 jours)
    const longRes = await fetch(
      `https://graph.threads.net/access_token` +
      `?grant_type=th_exchange_token` +
      `&client_secret=${THREADS_APP_SECRET}` +
      `&access_token=${shortToken}`
    );
    const longData = await longRes.json();
    const accessToken = longData.access_token || shortToken;

    // Récupère le profil Threads
    const profileRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}?fields=id,username,name&access_token=${accessToken}`
    );
    const profile = await profileRes.json();
    console.log("Threads profile:", JSON.stringify(profile));

    // Sauvegarde en DB
    await db.query(
      `UPDATE users 
       SET threads_access_token=$1, threads_user_id=$2, threads_username=$3
       WHERE id=$4`,
      [accessToken, threadsUserId, profile.username || profile.name, userId]
    );

    res.redirect(`${FRONTEND_URL}?threads=connected`);
  } catch (err) {
    console.error("Threads callback error:", err.message);
    res.redirect(`${FRONTEND_URL}?threads=error`);
  }
});

// ─── GET /threads/status ───────────────────────────────────────────────────────
router.get("/status", authenticateToken, async (req, res) => {
  const result = await db.query(
    "SELECT threads_user_id, threads_username FROM users WHERE id=$1",
    [req.user.id]
  );
  const user = result.rows[0];
  res.json({
    connected: !!user?.threads_user_id,
    username:  user?.threads_username || null,
  });
});

// ─── POST /threads/post ────────────────────────────────────────────────────────
// Publication en 2 étapes : création du container → publication
router.post("/post", authenticateToken, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Text is required" });

  try {
    const result = await db.query(
      "SELECT threads_access_token, threads_user_id FROM users WHERE id=$1",
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user?.threads_access_token) {
      return res.status(400).json({ message: "Threads not connected" });
    }

    const { threads_access_token: token, threads_user_id: userId } = user;

    // Étape 1 : créer le container
    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type:   "TEXT",
          text,
          access_token: token,
        }),
      }
    );
    const containerData = await containerRes.json();
    console.log("Threads container:", JSON.stringify(containerData));

    if (!containerData.id) {
      return res.status(500).json({ message: "Failed to create Threads container", detail: containerData });
    }

    // Délai recommandé par Meta avant publication
    await new Promise(r => setTimeout(r, 1500));

    // Étape 2 : publier le container
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id:  containerData.id,
          access_token: token,
        }),
      }
    );
    const publishData = await publishRes.json();
    console.log("Threads publish:", JSON.stringify(publishData));

    if (!publishData.id) {
      return res.status(500).json({ message: "Failed to publish on Threads", detail: publishData });
    }

    // ── Sauvegarder dans publish_log ─────────────────────────────────────────
    try {
      await db.query(
        "INSERT INTO publish_log (user_id, platform, post_id, status) VALUES ($1, $2, $3, 'published')",
        [req.user.id, "threads", publishData.id]
      );
    } catch (logErr) { console.error("publish_log error:", logErr.message); }

    res.json({ success: true, postId: publishData.id });
  } catch (err) {
    console.error("Threads post error:", err);
    res.status(500).json({ message: "Threads post failed" });
  }
});

// ─── DELETE /threads/disconnect ────────────────────────────────────────────────
router.delete("/disconnect", authenticateToken, async (req, res) => {
  await db.query(
    `UPDATE users 
     SET threads_access_token=NULL, threads_user_id=NULL, threads_username=NULL
     WHERE id=$1`,
    [req.user.id]
  );
  res.json({ success: true });
});

export default router;
