import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ✅ dotenv en premier
dotenv.config();

// ─── Sentry ───────────────────────────────────────────────────────────────────
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 0.2,
  });
  console.info("✅ Sentry backend initialized");
}

// ─── Logger Winston ───────────────────────────────────────────────────────────
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
          return `${timestamp} [${level}] ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// ─── Rate limiters ────────────────────────────────────────────────────────────
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Ne pas limiter les admins
    const body = req.body;
    return body?.email === "admin@growthpilot.admin";
  },
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many generation requests, slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: { error: "Too many admin requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many tracking requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

import db from "./server/config/db.js";
import authRoutes              from "./server/routes/auth.js";
import generateRoutes          from "./server/routes/generate.js";
import analyzeRoutes           from "./server/routes/analyze.js";
import stripeRoutes            from "./server/routes/stripe.js";
import linkedinRoutes          from "./server/routes/linkedin.js";
import scrapingRoutes          from "./server/routes/scraping.js";
import threadsRoutes           from "./server/routes/threads.js";
import linkedinAnalyticsRoutes from "./server/routes/linkedin-analytics.js";
import teamRoutes              from "./server/routes/team.js";
import calendarRouter          from "./server/routes/calendar.js";
import twitterRouter           from "./server/routes/twitter.js";
import agencyRouter            from "./server/routes/agency.js";
import instagramRouter         from "./server/routes/instagram.js";
import facebookRouter          from "./server/routes/facebook.js";
import tiktokRouter            from "./server/routes/tiktok.js";
import adminRouter             from "./server/routes/admin.js";
import analyticsRouter         from "./server/routes/analytics.js";
import watchRouter             from "./server/routes/watch.js";

const app = express();

// ⚠️ CORS doit etre avant tout le reste (rate limiters inclus)
// sinon les reponses 429 n ont pas le header Access-Control-Allow-Origin
const corsOptions = {
  origin: ["https://www.aigrowthpilot.app", "http://localhost:5173"],
  credentials: true,
};
app.set("trust proxy", 1); // Railway est derrière un proxy
app.use(cors(corsOptions));

// Sentry request handler — doit être AVANT les routes
// Sentry v8+ — requestHandler remplacé par setupExpressErrorHandler en fin de routes

// ⚠️ IMPORTANT : le webhook Stripe doit recevoir le raw body AVANT express.json()
app.use("/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

// ─── Request logger middleware ─────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level](`${req.method} ${req.path}`, {
      status:   res.statusCode,
      duration: `${duration}ms`,
      ip:       req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
    });
  });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth",               authLimiter,      authRoutes);
app.use("/generate",           generateLimiter,  generateRoutes);
app.use("/analyze",                              analyzeRoutes);
app.use("/stripe",                               stripeRoutes);
app.use("/linkedin",                             linkedinRoutes);
app.use("/scraping",                             scrapingRoutes);
app.use("/threads",                              threadsRoutes);
app.use("/linkedin-analytics",                   linkedinAnalyticsRoutes);
app.use("/team",                                 teamRoutes);
app.use("/calendar",                             calendarRouter);
app.use("/twitter",                              twitterRouter);
app.use("/agency",                               agencyRouter);
app.use("/instagram",                            instagramRouter);
app.use("/facebook",                             facebookRouter);
app.use("/tiktok",                               tiktokRouter);
app.use("/admin",              adminLimiter,     adminRouter);
app.use("/analytics",          analyticsLimiter, analyticsRouter);
app.use("/watch",                                watchRouter);

// ─── Error handler global ──────────────────────────────────────────────────────
// Sentry error handler — doit être AVANT le error handler global
if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { message: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Backend running on port ${PORT}`, { env: process.env.NODE_ENV || "development" });
});

// ─── Cron : rappel calendrier (chaque lundi à 8h UTC) ─────────────────────────

const scheduleCalendarReminder = () => {
  const now = new Date();
  const next = new Date(now);

  // Avancer jusqu'au prochain lundi
  const day = now.getUTCDay(); // 0=dim, 1=lun, ...
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  next.setUTCHours(8, 0, 0, 0);

  const msUntilNext = next.getTime() - now.getTime();
  logger.info(`📅 Calendar reminder scheduled in ${Math.round(msUntilNext / 3600000)}h (next Monday 8:00 UTC)`);

  setTimeout(async () => {
    await sendCalendarReminders();
    // Relancer chaque semaine (7 jours)
    setInterval(sendCalendarReminders, 7 * 24 * 60 * 60 * 1000);
  }, msUntilNext);
};

const sendCalendarReminders = async () => {
  logger.info("📅 Running weekly calendar reminder job...");
  try {
    // Chercher les users ayant des slots "scheduled" sans contenu dans les 7 prochains jours
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const result = await db.query(`
      SELECT DISTINCT u.id, u.email, COUNT(cp.id) AS empty_slots
      FROM users u
      JOIN calendar_posts cp ON cp.user_id = u.id
      WHERE cp.col = 'scheduled'
        AND (cp.content IS NULL OR TRIM(cp.content) = '')
        AND cp.scheduled_date >= $1
        AND cp.scheduled_date <= $2
        AND u.email_verified = true
        AND u.banned = false
      GROUP BY u.id, u.email
    `, [now.toISOString(), in7days.toISOString()]);

    logger.info(`📅 Calendar reminder: ${result.rows.length} users to notify`);

    for (const user of result.rows) {
      try {
        await sendCalendarReminderEmail(user.email, parseInt(user.empty_slots));
        logger.info(`📧 Calendar reminder sent to ${user.email}`);
      } catch (err) {
        logger.error(`❌ Calendar reminder failed for ${user.email}`, { error: err.message });
      }
    }
  } catch (err) {
    logger.error("❌ Calendar reminder job error", { error: err.message });
  }
};

const sendCalendarReminderEmail = async (email, emptySlots) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "GrowthPILOT <team@aigrowthpilot.app>",
      to: email,
      subject: `📅 You have ${emptySlots} empty slot${emptySlots > 1 ? "s" : ""} this week — GrowthPILOT`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#050a14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#0d1626;border:1px solid rgba(220,38,38,0.2);border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Growth<span style="opacity:0.8">PILOT</span></h1>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Weekly Content Reminder</p>
            </div>
            <div style="padding:40px 32px;">
              <h2 style="color:#e2e8f0;font-size:20px;font-weight:800;margin:0 0 12px;">📅 Don't leave your calendar empty</h2>
              <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 24px;">
                You have <strong style="color:#ef4444;">${emptySlots} scheduled slot${emptySlots > 1 ? "s" : ""}</strong> this week without content. 
                Your audience is waiting — let's fill them in.
              </p>
              <a href="https://www.aigrowthpilot.app" style="display:block;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;text-decoration:none;text-align:center;padding:16px 32px;border-radius:10px;font-weight:800;font-size:15px;letter-spacing:0.5px;">
                ✍️ Create content now →
              </a>
              <div style="margin-top:24px;padding:16px;background:rgba(220,38,38,0.05);border:1px solid rgba(220,38,38,0.15);border-radius:10px;">
                <div style="color:#ef4444;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:8px;">⚡ QUICK TIP</div>
                <div style="color:#64748b;font-size:13px;line-height:1.6;">
                  Use the <strong style="color:#94a3b8;">Trends tab</strong> to find this week's viral topics, then generate a post in one click.
                </div>
              </div>
              <p style="color:#334155;font-size:12px;margin:24px 0 0;text-align:center;">
                To stop receiving these reminders, manage your notification settings in your <a href="https://www.aigrowthpilot.app" style="color:#475569;">profile</a>.
              </p>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.05);padding:20px 32px;text-align:center;">
              <p style="color:#1e293b;font-size:11px;margin:0;">© 2026 GrowthPILOT · <a href="https://www.aigrowthpilot.app" style="color:#334155;">aigrowthpilot.app</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
};

// Lancer le scheduler au démarrage
scheduleCalendarReminder();

// ─── Cron : email hebdo (chaque lundi à 9h UTC) ───────────────────────────────
const scheduleWeeklyEmail = () => {
  const now  = new Date();
  const next = new Date(now);
  const day  = now.getUTCDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  next.setUTCHours(9, 0, 0, 0); // 9h UTC (après le rappel calendrier à 8h)

  const msUntilNext = next.getTime() - now.getTime();
  logger.info(`📧 Weekly email scheduled in ${Math.round(msUntilNext / 3600000)}h (next Monday 9:00 UTC)`);

  setTimeout(async () => {
    await sendWeeklyEmails();
    setInterval(sendWeeklyEmails, 7 * 24 * 60 * 60 * 1000);
  }, msUntilNext);
};

const sendWeeklyEmails = async () => {
  logger.info("📧 Running weekly summary email job...");
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Récupérer les users actifs avec au moins 1 post cette semaine
    const result = await db.query(`
      SELECT u.id, u.email, u.first_name,
             COUNT(p.id) AS posts_this_week,
             MAX(p.created_at) AS last_post_at
      FROM users u
      JOIN posts p ON p.user_id = u.id
      WHERE p.created_at >= $1
        AND u.email_verified = true
        AND u.banned = false
      GROUP BY u.id, u.email, u.first_name
      HAVING COUNT(p.id) > 0
    `, [oneWeekAgo.toISOString()]);

    logger.info(`📧 Weekly email: ${result.rows.length} users to notify`);

    for (const user of result.rows) {
      try {
        await sendWeeklySummaryEmail(user);
        logger.info(`📧 Weekly summary sent to ${user.email}`);
      } catch (err) {
        logger.error(`❌ Weekly email failed for ${user.email}`, { error: err.message });
      }
    }
  } catch (err) {
    logger.error("❌ Weekly email job error", { error: err.message });
  }
};

const sendWeeklySummaryEmail = async (user) => {
  const firstName = user.first_name || "there";
  const postsCount = parseInt(user.posts_this_week);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "GrowthPILOT <team@aigrowthpilot.app>",
      to: user.email,
      subject: `📊 Your week on GrowthPILOT — ${postsCount} post${postsCount > 1 ? "s" : ""} created`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#050a14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#0d1626;border:1px solid rgba(220,38,38,0.2);border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Growth<span style="opacity:0.8">PILOT</span></h1>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Your Weekly Summary</p>
            </div>
            <div style="padding:40px 32px;">
              <h2 style="color:#e2e8f0;font-size:20px;font-weight:800;margin:0 0 8px;">Good week, ${firstName} 👋</h2>
              <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">
                Here's what you accomplished this week on GrowthPILOT.
              </p>

              <!-- Stats -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px;">
                <div style="background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.15);border-radius:12px;padding:20px;text-align:center;">
                  <div style="color:#ef4444;font-size:32px;font-weight:900;">${postsCount}</div>
                  <div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-top:4px;">POSTS CREATED</div>
                </div>
                <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.15);border-radius:12px;padding:20px;text-align:center;">
                  <div style="color:#22c55e;font-size:32px;font-weight:900;">🔥</div>
                  <div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-top:4px;">KEEP IT UP</div>
                </div>
              </div>

              <a href="https://www.aigrowthpilot.app" style="display:block;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;text-decoration:none;text-align:center;padding:16px 32px;border-radius:10px;font-weight:800;font-size:15px;letter-spacing:0.5px;margin-bottom:24px;">
                Continue creating →
              </a>

              <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:10px;padding:16px 20px;">
                <div style="color:#818cf8;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:8px;">💡 THIS WEEK'S TIP</div>
                <div style="color:#64748b;font-size:13px;line-height:1.6;">
                  Consistency beats perfection. Posting 3x per week for a month outperforms posting 1 viral piece. Your streak matters.
                </div>
              </div>

              <p style="color:#334155;font-size:12px;margin:24px 0 0;text-align:center;">
                You're receiving this because you created content this week. 
                <a href="https://www.aigrowthpilot.app" style="color:#475569;">Manage preferences</a>
              </p>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.05);padding:20px 32px;text-align:center;">
              <p style="color:#1e293b;font-size:11px;margin:0;">© 2026 GrowthPILOT · <a href="https://www.aigrowthpilot.app" style="color:#334155;">aigrowthpilot.app</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
};

scheduleWeeklyEmail();

// ─── Cron : publication automatique des posts planifiés (toutes les minutes) ──
const publishScheduledPosts = async () => {
  try {
    const now = new Date().toISOString().split("T")[0]; // date du jour
    const result = await db.query(`
      SELECT cp.*, u.linkedin_access_token, u.linkedin_user_id,
             u.facebook_page_token, u.facebook_page_id,
             u.x_access_token, u.threads_access_token
      FROM calendar_posts cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.col = 'scheduled'
        AND cp.scheduled_date <= $1
        AND cp.published_at IS NULL
    `, [now]);

    if (result.rows.length === 0) return;

    logger.info(`📅 Auto-publish: ${result.rows.length} post(s) à publier`);

    for (const post of result.rows) {
      try {
        const text = post.content || post.title;
        const platform = (post.platform || "LinkedIn").toUpperCase();
        let success = false;

        if (platform === "LINKEDIN" && post.linkedin_access_token) {
          const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${post.linkedin_access_token}`,
              "Content-Type": "application/json",
              "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify({
              author: `urn:li:person:${post.linkedin_user_id}`,
              lifecycleState: "PUBLISHED",
              specificContent: {
                "com.linkedin.ugc.ShareContent": {
                  shareCommentary: { text },
                  shareMediaCategory: "NONE",
                },
              },
              visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
            }),
          });
          success = r.ok;
        } else if (platform === "FACEBOOK" && post.facebook_page_token) {
          const r = await fetch(`https://graph.facebook.com/v19.0/${post.facebook_page_id}/feed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, access_token: post.facebook_page_token }),
          });
          const d = await r.json();
          success = !!d.id;
        }

        if (success) {
          // Marquer comme publié
          await db.query(
            "UPDATE calendar_posts SET col='published', published_at=NOW() WHERE id=$1",
            [post.id]
          );
          // Log publish_log
          await db.query(
            "INSERT INTO publish_log (user_id, platform, post_id, status, created_at) VALUES ($1,$2,$3,'published',NOW())",
            [post.user_id, platform.toLowerCase(), post.id]
          );
          // Log user_logs
          await db.query(
            "INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'publish_post',$2,NOW())",
            [post.user_id, JSON.stringify({ platform, post_id: post.id, auto: true })]
          );
          logger.info(`✅ Auto-published post ${post.id} on ${platform} for user ${post.user_id}`);
        }
      } catch (err) {
        logger.error(`❌ Auto-publish failed for post ${post.id}`, { error: err.message });
      }
    }
  } catch (err) {
    logger.error("❌ Auto-publish cron error", { error: err.message });
  }
};

// Lancer toutes les minutes
setInterval(publishScheduledPosts, 60 * 1000);
// Et au démarrage
publishScheduledPosts();
logger.info("⏰ Auto-publish cron started (every 60s)");
