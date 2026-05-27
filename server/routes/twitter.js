// server/routes/twitter.js
// GrowthPILOT — Sprint 2 : X (Twitter) OAuth 2.0 PKCE + publication directe
// Variables Railway requises : X_CLIENT_ID, X_CLIENT_SECRET, FRONTEND_URL

import express  from "express";
import jwt      from "jsonwebtoken";
import crypto   from "crypto";
import db       from "../db.js";

const router = express.Router();

const X_CLIENT_ID     = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const FRONTEND_URL    = process.env.FRONTEND_URL;
const REDIRECT_URI    = "https://social-ai-app-production.up.railway.app/twitter/callback";

// ─── Middleware auth ──────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.query.token;
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── PKCE helpers ─────────────────────────────────────────────────────────────
const generateCodeVerifier  = () => crypto.randomBytes(32).toString("base64url");
const generateCodeChallenge = (v) => crypto.createHash("sha256").update(v).digest("base64url");

// Store PKCE en mémoire (suffit pour dev — TTL 10min)
const pkceStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pkceStore) {
    if (now - v.createdAt > 10 * 60 * 1000) pkceStore.delete(k);
  }
}, 60_000);

// ─── GET /twitter/connect ─────────────────────────────────────────────────────
router.get("/connect", authenticateToken, (req, res) => {
  const codeVerifier  = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state         = crypto.randomBytes(16).toString("hex");

  pkceStore.set(state, { codeVerifier, userId: req.user.id, createdAt: Date.now() });

  const params = new URLSearchParams({
    response_type:         "code",
    client_id:             X_CLIENT_ID,
    redirect_uri:          REDIRECT_URI,
    scope:                 "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString().replace(/\+/g, "%20")}`;

  // Redirect direct si token en query (lien <a href>), sinon JSON
  if (req.query.token) {
    res.redirect(authUrl);
  } else {
    res.json({ url: authUrl });
  }
});

// ─── GET /twitter/callback ────────────────────────────────────────────────────
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;
  console.log("Twitter callback — code:", !!code, "error:", error);

  if (error || !code || !state) {
    console.error("Twitter OAuth error:", error);
    return res.redirect(`${FRONTEND_URL}?twitter=error`);
  }

  const stored = pkceStore.get(state);
  if (!stored) {
    console.error("Twitter: state not found or expired");
    return res.redirect(`${FRONTEND_URL}?twitter=error`);
  }

  pkceStore.delete(state);
  const { codeVerifier, userId } = stored;

  try {
    // Échange code → access token
    const credentials = Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type:    "authorization_code",
        code,
        redirect_uri:  REDIRECT_URI,
        code_verifier: codeVerifier,
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    console.log("Twitter token response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      console.error("No Twitter access token:", tokenData);
      return res.redirect(`${FRONTEND_URL}?twitter=error`);
    }

    const { access_token, refresh_token } = tokenData;

    // Récupère le profil X
    const profileRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profileData = await profileRes.json();
    console.log("Twitter profile:", JSON.stringify(profileData));

    const xUsername = profileData.data?.username || null;
    const xUserId   = profileData.data?.id       || null;

    // Sauvegarde en DB
    await db.query(
      `UPDATE users
       SET x_access_token=$1, x_refresh_token=$2, x_user_id=$3, x_username=$4
       WHERE id=$5`,
      [access_token, refresh_token || null, xUserId, xUsername, userId]
    );

    res.redirect(`${FRONTEND_URL}?twitter=connected`);
  } catch (err) {
    console.error("Twitter callback error:", err.message);
    res.redirect(`${FRONTEND_URL}?twitter=error`);
  }
});

// ─── GET /twitter/status ──────────────────────────────────────────────────────
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT x_user_id, x_username FROM users WHERE id=$1",
      [req.user.id]
    );
    const user = result.rows[0];
    res.json({
      connected: !!user?.x_user_id,
      username:  user?.x_username || null,
    });
  } catch (err) {
    console.error("Twitter status error:", err.message);
    res.json({ connected: false, username: null });
  }
});

// ─── POST /twitter/post ───────────────────────────────────────────────────────
// Publication d'un tweet (≤ 280 chars) ou thread (tableau de tweets)
router.post("/post", authenticateToken, async (req, res) => {
  const { text, tweets } = req.body;
  if (!text && !tweets?.length) return res.status(400).json({ message: "Text or tweets array required" });

  try {
    const result = await db.query(
      "SELECT x_access_token, x_refresh_token, x_user_id FROM users WHERE id=$1",
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user?.x_access_token) {
      return res.status(400).json({ message: "X not connected" });
    }

    let accessToken = user.x_access_token;

    // Helper : poster un tweet unique
    const postTweet = async (tweetText, replyToId = null) => {
      const body = { text: tweetText };
      if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };

      const r = await fetch("https://api.twitter.com/2/tweets", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      // Si token expiré, tenter un refresh
      if (r.status === 401 && user.x_refresh_token) {
        const newToken = await refreshXToken(user.x_refresh_token, req.user.id);
        if (newToken) {
          accessToken = newToken;
          return postTweet(tweetText, replyToId); // retry
        }
      }

      return r.json();
    };

    // ── Tweet simple ──────────────────────────────────────────────────────────
    if (text && !tweets?.length) {
      const truncated = text.length > 280 ? text.slice(0, 277) + "..." : text;
      const data = await postTweet(truncated);
      if (!data.data?.id) return res.status(500).json({ message: "Tweet failed", detail: data });
      // ── Sauvegarder dans publish_log ───────────────────────────────────────
      try {
        await db.query(
          "INSERT INTO publish_log (user_id, platform, post_id, status) VALUES ($1, $2, $3, 'published')",
          [req.user.id, "twitter", data.data.id]
        );
      } catch (logErr) { console.error("publish_log error:", logErr.message); }
      return res.json({ success: true, tweetId: data.data.id });
    }

    // ── Thread (tableau de tweets) ────────────────────────────────────────────
    let lastId = null;
    const postedIds = [];

    for (const tweet of tweets) {
      const truncated = tweet.length > 280 ? tweet.slice(0, 277) + "..." : tweet;
      const data = await postTweet(truncated, lastId);
      if (!data.data?.id) {
        return res.status(500).json({ message: "Thread failed at tweet", detail: data, posted: postedIds });
      }
      postedIds.push(data.data.id);
      lastId = data.data.id;
      // Délai entre tweets pour éviter rate limit
      if (tweets.indexOf(tweet) < tweets.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // ── Sauvegarder dans publish_log ─────────────────────────────────────────
    try {
      await db.query(
        "INSERT INTO publish_log (user_id, platform, post_id, status) VALUES ($1, $2, $3, 'published')",
        [req.user.id, "twitter", postedIds[0]]
      );
    } catch (logErr) { console.error("publish_log error:", logErr.message); }
    res.json({ success: true, threadIds: postedIds, firstTweetId: postedIds[0] });
  } catch (err) {
    console.error("Twitter post error:", err.message);
    res.status(500).json({ message: "Twitter post failed" });
  }
});

// ─── Refresh token helper ─────────────────────────────────────────────────────
async function refreshXToken(refreshToken, userId) {
  try {
    const credentials = Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString("base64");
    const r = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type:    "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });
    const data = await r.json();
    if (data.access_token) {
      await db.query(
        "UPDATE users SET x_access_token=$1, x_refresh_token=$2 WHERE id=$3",
        [data.access_token, data.refresh_token || refreshToken, userId]
      );
      return data.access_token;
    }
    return null;
  } catch { return null; }
}

// ─── DELETE /twitter/disconnect ───────────────────────────────────────────────
router.delete("/disconnect", authenticateToken, async (req, res) => {
  await db.query(
    "UPDATE users SET x_access_token=NULL, x_refresh_token=NULL, x_user_id=NULL, x_username=NULL WHERE id=$1",
    [req.user.id]
  );
  res.json({ success: true });
});

export default router;
