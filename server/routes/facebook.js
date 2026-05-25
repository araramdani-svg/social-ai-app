// server/routes/facebook.js
// GrowthPILOT — Sprint 2 : Facebook OAuth + publication (Pages & Profil)

import express from "express";
import jwt     from "jsonwebtoken";
import db      from "../db.js";

const router = express.Router();

const FB_APP_ID       = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET   = process.env.FACEBOOK_APP_SECRET;
const FB_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;
const FRONTEND_URL    = process.env.FRONTEND_URL;

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

// ─── GET /facebook/connect ────────────────────────────────────────────────────
router.get("/connect", auth, (req, res) => {
  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString("base64");
  const params = new URLSearchParams({
    client_id:     FB_APP_ID,
    redirect_uri:  FB_REDIRECT_URI,
    scope:         "pages_show_list,pages_read_engagement,pages_manage_posts",
    response_type: "code",
    state,
  });
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  if (req.query.token) { res.redirect(authUrl); } else { res.json({ url: authUrl }); }
});

// ─── GET /facebook/oauth/callback ─────────────────────────────────────────────
router.get("/oauth/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code) return res.redirect(`${FRONTEND_URL}?facebook=error`);

  let userId = null;
  try { userId = JSON.parse(Buffer.from(state, "base64").toString()).userId; }
  catch { return res.redirect(`${FRONTEND_URL}?facebook=error`); }

  try {
    // Échange code → user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ client_id: FB_APP_ID, client_secret: FB_APP_SECRET, redirect_uri: FB_REDIRECT_URI, code }).toString()
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect(`${FRONTEND_URL}?facebook=error`);

    const userToken = tokenData.access_token;

    // Long-lived user token (60 jours)
    const longRes  = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ grant_type: "fb_exchange_token", client_id: FB_APP_ID, client_secret: FB_APP_SECRET, fb_exchange_token: userToken }).toString()
    );
    const longData = await longRes.json();
    const longUserToken = longData.access_token || userToken;

    // Profil utilisateur
    const profileRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${longUserToken}`);
    const profile    = await profileRes.json();

    // Pages gérées + leur token permanent
    const pagesRes  = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longUserToken}`);
    const pagesData = await pagesRes.json();
    const firstPage = pagesData.data?.[0] || null;

    await db.query(
      `UPDATE users SET
        facebook_access_token=$1,
        facebook_user_id=$2,
        facebook_user_name=$3,
        facebook_page_id=$4,
        facebook_page_name=$5,
        facebook_page_token=$6
       WHERE id=$7`,
      [
        longUserToken,
        profile.id,
        profile.name || null,
        firstPage?.id   || null,
        firstPage?.name || null,
        firstPage?.access_token || null,
        userId,
      ]
    );

    res.redirect(`${FRONTEND_URL}?facebook=connected`);
  } catch (err) {
    console.error("Facebook callback error:", err.message);
    res.redirect(`${FRONTEND_URL}?facebook=error`);
  }
});

// ─── GET /facebook/status ──────────────────────────────────────────────────────
router.get("/status", auth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT facebook_user_id, facebook_user_name, facebook_page_id, facebook_page_name FROM users WHERE id=$1",
      [req.user.id]
    );
    const u = result.rows[0];
    res.json({
      connected: !!u?.facebook_user_id,
      userName:  u?.facebook_user_name || null,
      pageId:    u?.facebook_page_id   || null,
      pageName:  u?.facebook_page_name || null,
    });
  } catch { res.json({ connected: false }); }
});

// ─── GET /facebook/pages ───────────────────────────────────────────────────────
// Retourne toutes les pages gérées pour laisser l'user choisir
router.get("/pages", auth, async (req, res) => {
  try {
    const result = await db.query("SELECT facebook_access_token FROM users WHERE id=$1", [req.user.id]);
    const token  = result.rows[0]?.facebook_access_token;
    if (!token) return res.status(400).json({ message: "Facebook not connected" });

    const pagesRes  = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
    const pagesData = await pagesRes.json();
    res.json({ pages: pagesData.data || [] });
  } catch (err) {
    console.error("Facebook pages error:", err.message);
    res.status(500).json({ message: "Failed to fetch pages" });
  }
});

// ─── POST /facebook/select-page ───────────────────────────────────────────────
// L'user choisit la page active
router.post("/select-page", auth, async (req, res) => {
  const { pageId, pageName, pageToken } = req.body;
  if (!pageId || !pageToken) return res.status(400).json({ message: "pageId and pageToken required" });

  await db.query(
    "UPDATE users SET facebook_page_id=$1, facebook_page_name=$2, facebook_page_token=$3 WHERE id=$4",
    [pageId, pageName || null, pageToken, req.user.id]
  );
  res.json({ success: true });
});

// ─── POST /facebook/post ──────────────────────────────────────────────────────
// Publie sur la Page Facebook (si page connectée) sinon sur le profil
router.post("/post", auth, async (req, res) => {
  const { message, imageUrl, link } = req.body;
  if (!message) return res.status(400).json({ message: "Message required" });

  try {
    const result = await db.query(
      "SELECT facebook_access_token, facebook_user_id, facebook_page_id, facebook_page_token FROM users WHERE id=$1",
      [req.user.id]
    );
    const u = result.rows[0];
    if (!u?.facebook_access_token) return res.status(400).json({ message: "Facebook not connected" });

    // Préférer le token de page (permanent) si disponible
    const token    = u.facebook_page_token || u.facebook_access_token;
    const targetId = u.facebook_page_id   || u.facebook_user_id;
    const endpoint = `https://graph.facebook.com/v19.0/${targetId}/feed`;

    let postRes;
    if (imageUrl && !link) {
      // Poster une image via /photos (ne nécessite pas de link)
      const photoEndpoint = `https://graph.facebook.com/v19.0/${targetId}/photos`;
      const photoBody = { caption: message, url: imageUrl, access_token: token };
      postRes = await fetch(photoEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoBody),
      });
    } else {
      const body = { message, access_token: token };
      if (imageUrl) body.picture = imageUrl;
      if (link)     body.link    = link;
      postRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    const postData = await postRes.json();

    if (!postData.id) return res.status(500).json({ message: "Failed to publish on Facebook", detail: postData });

    res.json({ success: true, postId: postData.id });
  } catch (err) {
    console.error("Facebook post error:", err.message);
    res.status(500).json({ message: "Facebook post failed" });
  }
});

// ─── DELETE /facebook/disconnect ──────────────────────────────────────────────
router.delete("/disconnect", auth, async (req, res) => {
  await db.query(
    `UPDATE users SET
      facebook_access_token=NULL, facebook_user_id=NULL, facebook_user_name=NULL,
      facebook_page_id=NULL, facebook_page_name=NULL, facebook_page_token=NULL
     WHERE id=$1`,
    [req.user.id]
  );
  res.json({ success: true });
});

export default router;
