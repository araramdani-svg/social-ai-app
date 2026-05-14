// server/routes/linkedin-analytics.js
import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── GET /linkedin-analytics/posts ───────────────────────────────────────────
// Retourne tous les posts LinkedIn publiés via GrowthPILOT avec leurs stats
router.get("/posts", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, content, linkedin_post_id, platform,
              impressions, likes, comments, shares, clicks, created_at
       FROM posts
       WHERE user_id = $1 AND linkedin_post_id IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ posts: result.rows });
  } catch (err) {
    console.error("linkedin-analytics/posts error:", err.message);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// ─── POST /linkedin-analytics/refresh ────────────────────────────────────────
// Rafraîchit les stats LinkedIn pour tous les posts de l'utilisateur
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    // Récupérer le token LinkedIn
    const userResult = await db.query(
      "SELECT linkedin_access_token, linkedin_user_id FROM users WHERE id=$1",
      [req.user.id]
    );
    const user = userResult.rows[0];

    if (!user?.linkedin_access_token) {
      return res.status(400).json({ error: "LinkedIn not connected" });
    }

    // Récupérer les posts avec linkedin_post_id
    const postsResult = await db.query(
      `SELECT id, linkedin_post_id FROM posts
       WHERE user_id=$1 AND linkedin_post_id IS NOT NULL`,
      [req.user.id]
    );

    if (postsResult.rows.length === 0) {
      return res.json({ updated: 0, message: "No LinkedIn posts found" });
    }

    let updated = 0;
    const errors = [];

    for (const post of postsResult.rows) {
      try {
        // Encoder l'URN pour l'URL
        const encodedUrn = encodeURIComponent(post.linkedin_post_id);

        // Récupérer les socialActions (likes, commentaires, partages)
        const actionsRes = await fetch(
          `https://api.linkedin.com/v2/socialActions/${encodedUrn}`,
          {
            headers: {
              Authorization: `Bearer ${user.linkedin_access_token}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );

        if (!actionsRes.ok) {
          errors.push({ postId: post.linkedin_post_id, status: actionsRes.status });
          continue;
        }

        const actions = await actionsRes.json();

        const likes    = actions.likesSummary?.totalLikes ?? 0;
        const comments = actions.commentsSummary?.totalFirstLevelComments ?? 0;
        const shares   = actions.sharesSummary?.totalShares ?? 0;

        // Mettre à jour en DB
        await db.query(
          `UPDATE posts SET likes=$1, comments=$2, shares=$3
           WHERE id=$4`,
          [likes, comments, shares, post.id]
        );

        updated++;
      } catch (err) {
        errors.push({ postId: post.linkedin_post_id, error: err.message });
      }
    }

    res.json({ updated, total: postsResult.rows.length, errors });
  } catch (err) {
    console.error("linkedin-analytics/refresh error:", err.message);
    res.status(500).json({ error: "Refresh failed" });
  }
});

// ─── GET /linkedin-analytics/summary ─────────────────────────────────────────
// Retourne les totaux agrégés pour le dashboard
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(*)::int                AS total_posts,
         COALESCE(SUM(likes),0)::int     AS total_likes,
         COALESCE(SUM(comments),0)::int  AS total_comments,
         COALESCE(SUM(shares),0)::int    AS total_shares,
         COALESCE(SUM(clicks),0)::int    AS total_clicks,
         COALESCE(SUM(impressions),0)::int AS total_impressions,
         COALESCE(AVG(NULLIF(likes+comments+shares,0)),0)::numeric(10,1) AS avg_engagement
       FROM posts
       WHERE user_id=$1 AND linkedin_post_id IS NOT NULL`,
      [req.user.id]
    );

    // Top post par engagement
    const topResult = await db.query(
      `SELECT title, content, likes, comments, shares, created_at
       FROM posts
       WHERE user_id=$1 AND linkedin_post_id IS NOT NULL
       ORDER BY (likes + comments + shares) DESC
       LIMIT 1`,
      [req.user.id]
    );

    res.json({
      summary: result.rows[0],
      topPost: topResult.rows[0] || null,
    });
  } catch (err) {
    console.error("linkedin-analytics/summary error:", err.message);
    res.status(500).json({ error: "Summary failed" });
  }
});

export default router;
