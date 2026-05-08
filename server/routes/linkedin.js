import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

// ─── Middleware auth ───────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── GET /linkedin/connect ─────────────────────────────────────────────────────
// Redirige l'user vers la page d'auth LinkedIn
router.get("/connect", authenticateToken, (req, res) => {
  const scope = "openid profile email w_member_social";
  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString("base64");

  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  res.json({ url: authUrl });
});

// ─── GET /linkedin/callback ────────────────────────────────────────────────────
// LinkedIn redirige ici après auth — échange le code contre un access token
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) return res.redirect(`${FRONTEND_URL}?linkedin=error`);

  try {
    const { userId } = JSON.parse(Buffer.from(state, "base64").toString());
    console.log("LinkedIn callback - userId:", userId);
    console.log("LinkedIn callback - code:", code);

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("LinkedIn token response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) throw new Error("No access token");

    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    console.log("LinkedIn profile:", JSON.stringify(profile));

    await db.query(
      `UPDATE users SET linkedin_access_token=$1, linkedin_user_id=$2, linkedin_name=$3 WHERE id=$4`,
      [tokenData.access_token, profile.sub, profile.name, userId]
    );

    res.redirect(`${FRONTEND_URL}?linkedin=connected`);
  } catch (err) {
    console.error("LinkedIn callback error:", err);
    res.redirect(`${FRONTEND_URL}?linkedin=error`);
  }
});

// ─── GET /linkedin/status ──────────────────────────────────────────────────────
// Vérifie si l'user a connecté son compte LinkedIn
router.get("/status", authenticateToken, async (req, res) => {
  const result = await db.query(
    "SELECT linkedin_user_id, linkedin_name FROM users WHERE id=$1",
    [req.user.id]
  );
  const user = result.rows[0];
  res.json({
    connected: !!user?.linkedin_user_id,
    name: user?.linkedin_name || null,
  });
});

// ─── POST /linkedin/post ───────────────────────────────────────────────────────
// Publie un post sur LinkedIn au nom de l'user
router.post("/post", authenticateToken, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Text is required" });

  try {
    const result = await db.query(
      "SELECT linkedin_access_token, linkedin_user_id FROM users WHERE id=$1",
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user?.linkedin_access_token) {
      return res.status(400).json({ message: "LinkedIn not connected" });
    }

    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.linkedin_access_token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:person:${user.linkedin_user_id}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (!postRes.ok) {
      const err = await postRes.json();
      console.error("LinkedIn post error:", err);
      return res.status(500).json({ message: "Failed to post on LinkedIn" });
    }

    const postData = await postRes.json();
    res.json({ success: true, postId: postData.id });
  } catch (err) {
    console.error("LinkedIn post error:", err);
    res.status(500).json({ message: "LinkedIn post failed" });
  }
});

// ─── DELETE /linkedin/disconnect ───────────────────────────────────────────────
// Déconnecte le compte LinkedIn
router.delete("/disconnect", authenticateToken, async (req, res) => {
  await db.query(
    "UPDATE users SET linkedin_access_token=NULL, linkedin_user_id=NULL, linkedin_name=NULL WHERE id=$1",
    [req.user.id]
  );
  res.json({ success: true });
});

export default router;
