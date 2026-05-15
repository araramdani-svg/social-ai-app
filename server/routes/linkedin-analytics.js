// server/routes/linkedin-analytics.js
// GrowthPILOT — Sprint 1 : LinkedIn Analytics avancés
// Ajouts : best time to post, follower growth, engagement rate, weekly breakdown

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
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query(
      "SELECT linkedin_access_token, linkedin_user_id FROM users WHERE id=$1",
      [req.user.id]
    );
    const user = userResult.rows[0];
    if (!user?.linkedin_access_token) {
      return res.status(400).json({ error: "LinkedIn not connected" });
    }

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
        const encodedUrn = encodeURIComponent(post.linkedin_post_id);
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

        await db.query(
          `UPDATE posts SET likes=$1, comments=$2, shares=$3 WHERE id=$4`,
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
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(*)::int                                                        AS total_posts,
         COALESCE(SUM(likes),0)::int                                         AS total_likes,
         COALESCE(SUM(comments),0)::int                                      AS total_comments,
         COALESCE(SUM(shares),0)::int                                        AS total_shares,
         COALESCE(SUM(clicks),0)::int                                        AS total_clicks,
         COALESCE(SUM(impressions),0)::int                                   AS total_impressions,
         COALESCE(AVG(NULLIF(likes+comments+shares,0)),0)::numeric(10,1)     AS avg_engagement
       FROM posts
       WHERE user_id=$1 AND linkedin_post_id IS NOT NULL`,
      [req.user.id]
    );

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

// ─── GET /linkedin-analytics/best-time ───────────────────────────────────────
// Analyse les posts publiés pour déterminer le meilleur moment de publication
// Basé sur les données réelles de l'utilisateur (engagement par jour/heure)
router.get("/best-time", authenticateToken, async (req, res) => {
  try {
    // Engagement par jour de la semaine (0=dimanche, 1=lundi…)
    const byDayResult = await db.query(
      `SELECT
         EXTRACT(DOW FROM created_at)::int        AS day_of_week,
         COUNT(*)::int                             AS post_count,
         COALESCE(AVG(likes + comments + shares), 0)::numeric(10,2) AS avg_engagement,
         COALESCE(SUM(likes + comments + shares), 0)::int            AS total_engagement
       FROM posts
       WHERE user_id=$1 AND linkedin_post_id IS NOT NULL
       GROUP BY day_of_week
       ORDER BY avg_engagement DESC`,
      [req.user.id]
    );

    // Engagement par heure de la journée
    const byHourResult = await db.query(
      `SELECT
         EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::int AS hour_utc,
         COUNT(*)::int                                           AS post_count,
         COALESCE(AVG(likes + comments + shares), 0)::numeric(10,2) AS avg_engagement
       FROM posts
       WHERE user_id=$1 AND linkedin_post_id IS NOT NULL
       GROUP BY hour_utc
       ORDER BY avg_engagement DESC`,
      [req.user.id]
    );

    const dayNames = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

    // Construire la réponse enrichie
    const byDay  = byDayResult.rows.map(r => ({
      ...r,
      day_name: dayNames[r.day_of_week],
    }));

    const byHour = byHourResult.rows.map(r => ({
      ...r,
      hour_label: `${String(r.hour_utc).padStart(2,"0")}:00`,
    }));

    // Meilleur slot = top day + top hour
    const bestDay  = byDay[0] || null;
    const bestHour = byHour[0] || null;

    // Recommandation IA (règles + données)
    // Si pas assez de données, on utilise les benchmarks LinkedIn publics
    const hasEnoughData = byDayResult.rows.length >= 3;
    const recommendation = hasEnoughData
      ? {
          source: "your_data",
          day:    bestDay?.day_name || "Mardi",
          hour:   bestHour?.hour_label || "08:00",
          reason: `Basé sur vos ${byDayResult.rows.reduce((a,r)=>a+r.post_count,0)} posts LinkedIn publiés via GrowthPILOT`,
        }
      : {
          source: "linkedin_benchmark",
          day:    "Mardi",
          hour:   "08:00",
          reason: "Benchmark LinkedIn global (pas encore assez de données personnelles — publiez plus pour une recommandation personnalisée)",
          alternatives: ["Mercredi 09:00","Jeudi 12:00","Vendredi 08:00"],
        };

    res.json({ byDay, byHour, recommendation, hasEnoughData });
  } catch (err) {
    console.error("linkedin-analytics/best-time error:", err.message);
    res.status(500).json({ error: "Best time analysis failed" });
  }
});

// ─── GET /linkedin-analytics/growth ──────────────────────────────────────────
// Courbe de croissance du compte LinkedIn (posts publiés + engagement cumulé)
// Note : LinkedIn API ne donne pas les followers en temps réel sans Marketing API
// → On construit la courbe à partir des données GrowthPILOT
router.get("/growth", authenticateToken, async (req, res) => {
  try {
    const { period = "30" } = req.query; // 7 | 30 | 90 jours
    const days = parseInt(period, 10) || 30;

    // Engagement cumulé par jour sur la période
    const result = await db.query(
      `SELECT
         DATE(created_at)                          AS day,
         COUNT(*)::int                             AS posts_count,
         COALESCE(SUM(likes),0)::int              AS likes,
         COALESCE(SUM(comments),0)::int           AS comments,
         COALESCE(SUM(shares),0)::int             AS shares,
         COALESCE(SUM(likes+comments+shares),0)::int AS total_engagement
       FROM posts
       WHERE user_id=$1
         AND linkedin_post_id IS NOT NULL
         AND created_at >= NOW() - ($2 || ' days')::interval
       GROUP BY day
       ORDER BY day ASC`,
      [req.user.id, days]
    );

    // Calcul engagement cumulé (running total)
    let cumulative = 0;
    const growth = result.rows.map(row => {
      cumulative += row.total_engagement;
      return { ...row, cumulative_engagement: cumulative };
    });

    // Résumé de la période
    const totalPosts      = growth.reduce((a,r) => a + r.posts_count, 0);
    const totalEngagement = growth.reduce((a,r) => a + r.total_engagement, 0);
    const avgPerPost      = totalPosts > 0 ? (totalEngagement / totalPosts).toFixed(1) : 0;

    // Tendance : compare première moitié vs deuxième moitié
    const half = Math.floor(growth.length / 2);
    const firstHalf  = growth.slice(0, half).reduce((a,r)=>a+r.total_engagement,0);
    const secondHalf = growth.slice(half).reduce((a,r)=>a+r.total_engagement,0);
    const trend = firstHalf === 0 ? null : ((secondHalf - firstHalf) / firstHalf * 100).toFixed(1);

    res.json({
      period: days,
      growth,
      summary: { totalPosts, totalEngagement, avgPerPost, trend },
    });
  } catch (err) {
    console.error("linkedin-analytics/growth error:", err.message);
    res.status(500).json({ error: "Growth analysis failed" });
  }
});

// ─── GET /linkedin-analytics/weekly-breakdown ────────────────────────────────
// Breakdown de la semaine en cours vs semaine précédente
router.get("/weekly-breakdown", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         CASE
           WHEN created_at >= DATE_TRUNC('week', NOW()) THEN 'this_week'
           WHEN created_at >= DATE_TRUNC('week', NOW()) - INTERVAL '7 days' THEN 'last_week'
         END AS week,
         COUNT(*)::int                             AS posts,
         COALESCE(SUM(likes),0)::int              AS likes,
         COALESCE(SUM(comments),0)::int           AS comments,
         COALESCE(SUM(shares),0)::int             AS shares
       FROM posts
       WHERE user_id=$1
         AND linkedin_post_id IS NOT NULL
         AND created_at >= DATE_TRUNC('week', NOW()) - INTERVAL '7 days'
       GROUP BY week`,
      [req.user.id]
    );

    const thisWeek = result.rows.find(r => r.week === "this_week") || { posts:0, likes:0, comments:0, shares:0 };
    const lastWeek = result.rows.find(r => r.week === "last_week") || { posts:0, likes:0, comments:0, shares:0 };

    const delta = (curr, prev) => prev === 0 ? null : (((curr - prev) / prev) * 100).toFixed(1);

    res.json({
      thisWeek,
      lastWeek,
      delta: {
        posts:    delta(thisWeek.posts,    lastWeek.posts),
        likes:    delta(thisWeek.likes,    lastWeek.likes),
        comments: delta(thisWeek.comments, lastWeek.comments),
        shares:   delta(thisWeek.shares,   lastWeek.shares),
      },
    });
  } catch (err) {
    console.error("linkedin-analytics/weekly-breakdown error:", err.message);
    res.status(500).json({ error: "Weekly breakdown failed" });
  }
});

export default router;
