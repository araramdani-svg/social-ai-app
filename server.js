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
import webhooksRouter          from "./server/routes/webhooks.js";

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
app.use("/webhooks",                             webhooksRouter);

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

// ─── Import mailer pour les crons billing ─────────────────────────────────────
import {
  sendRenewalReminder3Days,
  sendRenewalReminder30Days,
  sendWinbackWeek,
  sendWinbackMonth,
  sendWinbackQuarter,
  sendGracePeriodExpiring,
  sendDowngradeToFree,
  sendTeamSuspended,
} from "./server/mailer.js";

const BILLING_PRICES = {
  Pro:      { monthly: "€19/month", annual: "€182/year" },
  Business: { monthly: "€49/month", annual: "€470/year" },
  Agency:   { monthly: "€99/month", annual: "€950/year" },
};
const UPGRADE_PLAN = { Pro: "Business", Business: "Agency", Agency: null };

// ─── Cron billing : J-3 mensuel + J-30 annuel + grace period — toutes les heures
const runBillingReminders = async () => {
  const now = new Date();
  logger.info("💳 Running billing reminders job...");

  try {
    // ── J-3 mensuel ────────────────────────────────────────────────────────────
    const j3 = await db.query(
      `SELECT id, email, first_name, plan, plan_interval, current_period_end
       FROM users
       WHERE plan_interval='month' AND plan!='Free' AND current_period_end IS NOT NULL
         AND current_period_end BETWEEN NOW() + INTERVAL '2 days' AND NOW() + INTERVAL '4 days'
         AND (renewal_reminder_sent_at IS NULL OR renewal_reminder_sent_at < NOW() - INTERVAL '25 days')`
    );
    for (const u of j3.rows) {
      try {
        await sendRenewalReminder3Days({
          email: u.email, firstName: u.first_name, plan: u.plan,
          renewalDate: new Date(u.current_period_end).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }),
          monthlyPrice: BILLING_PRICES[u.plan]?.monthly || "—",
          annualPrice:  BILLING_PRICES[u.plan]?.annual  || "—",
          upgradePlan:  UPGRADE_PLAN[u.plan],
        });
        await db.query("UPDATE users SET renewal_reminder_sent_at=NOW() WHERE id=$1", [u.id]);
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'renewal_reminder_3d',$2,NOW())`,
          [u.id, JSON.stringify({ plan: u.plan, renewal_date: u.current_period_end })]
        ).catch(() => {});
        await db.query(
          `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'renewal_reminder_3d',$2,$3,NOW())`,
          [u.id, u.id, JSON.stringify({ plan: u.plan, interval: "month" })]
        ).catch(() => {});
        logger.info(`💳 J-3 reminder sent to ${u.email} (${u.plan})`);
      } catch (err) { logger.error(`💳 J-3 failed for ${u.email}`, { error: err.message }); }
    }

    // ── J-30 annuel ────────────────────────────────────────────────────────────
    const j30 = await db.query(
      `SELECT id, email, first_name, plan, plan_interval, current_period_end
       FROM users
       WHERE plan_interval='year' AND plan!='Free' AND current_period_end IS NOT NULL
         AND current_period_end BETWEEN NOW() + INTERVAL '28 days' AND NOW() + INTERVAL '32 days'
         AND (renewal_reminder_sent_at IS NULL OR renewal_reminder_sent_at < NOW() - INTERVAL '300 days')`
    );
    for (const u of j30.rows) {
      try {
        await sendRenewalReminder30Days({
          email: u.email, firstName: u.first_name, plan: u.plan,
          renewalDate: new Date(u.current_period_end).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }),
          annualPrice: BILLING_PRICES[u.plan]?.annual || "—",
          upgradePlan: UPGRADE_PLAN[u.plan],
        });
        await db.query("UPDATE users SET renewal_reminder_sent_at=NOW() WHERE id=$1", [u.id]);
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'renewal_reminder_30d',$2,NOW())`,
          [u.id, JSON.stringify({ plan: u.plan, renewal_date: u.current_period_end })]
        ).catch(() => {});
        await db.query(
          `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'renewal_reminder_30d',$2,$3,NOW())`,
          [u.id, u.id, JSON.stringify({ plan: u.plan, interval: "year" })]
        ).catch(() => {});
        logger.info(`💳 J-30 reminder sent to ${u.email} (${u.plan})`);
      } catch (err) { logger.error(`💳 J-30 failed for ${u.email}`, { error: err.message }); }
    }

    // ── Grace period — avertissement 24h avant expiration ─────────────────────
    const graceWarn = await db.query(
      `SELECT id, email, first_name, plan, grace_period_ends_at, stripe_customer_id
       FROM users
       WHERE grace_period_ends_at IS NOT NULL
         AND grace_period_ends_at BETWEEN NOW() + INTERVAL '20 hours' AND NOW() + INTERVAL '28 hours'
         AND payment_failed_at IS NOT NULL`
    );
    for (const u of graceWarn.rows) {
      try {
        let updateCardUrl = `${process.env.FRONTEND_URL}/profile`;
        const Stripe = (await import("stripe")).default;
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
        if (u.stripe_customer_id) {
          const portal = await stripeClient.billingPortal.sessions.create({
            customer: u.stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL}/profile`,
          }).catch(() => null);
          if (portal?.url) updateCardUrl = portal.url;
        }
        await sendGracePeriodExpiring({
          email: u.email, firstName: u.first_name, plan: u.plan,
          expiresAt: new Date(u.grace_period_ends_at).toLocaleDateString("en-GB", { day:"numeric", month:"long", hour:"2-digit", minute:"2-digit" }),
          updateCardUrl,
        });
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'grace_period_warning_24h',$2,NOW())`,
          [u.id, JSON.stringify({ plan: u.plan })]
        ).catch(() => {});
        logger.info(`💳 Grace period warning sent to ${u.email}`);
      } catch (err) { logger.error(`💳 Grace warn failed for ${u.email}`, { error: err.message }); }
    }

    // ── Grace period expiré → downgrade Free ──────────────────────────────────
    const graceExpired = await db.query(
      `SELECT id, email, first_name, plan, stripe_subscription_id
       FROM users
       WHERE grace_period_ends_at IS NOT NULL
         AND grace_period_ends_at < NOW()
         AND plan != 'Free'
         AND payment_failed_at IS NOT NULL`
    );
    for (const u of graceExpired.rows) {
      try {
        const previousPlan = u.plan;
        if (u.stripe_subscription_id) {
          const Stripe = (await import("stripe")).default;
          const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
          await stripeClient.subscriptions.cancel(u.stripe_subscription_id).catch(() => {});
        }
        await db.query(
          `UPDATE users SET plan='Free', stripe_subscription_id=NULL, plan_interval=NULL,
           current_period_end=NULL, payment_failed_at=NULL, grace_period_ends_at=NULL, downgraded_at=NOW()
           WHERE id=$1`,
          [u.id]
        );
        if (previousPlan === "Business" || previousPlan === "Agency") {
          const membersRes = await db.query(
            `SELECT tm.member_id, u2.email, u2.first_name, ou.email as owner_email, ou.display_name as owner_name
             FROM team_members tm JOIN users u2 ON u2.id=tm.member_id JOIN users ou ON ou.id=tm.owner_id
             WHERE tm.owner_id=$1 AND tm.status='active'`, [u.id]
          ).catch(() => ({ rows: [] }));
          await db.query("UPDATE team_members SET status='suspended' WHERE owner_id=$1 AND status='active'", [u.id]).catch(() => {});
          for (const m of membersRes.rows) {
            await sendTeamSuspended({ email: m.email, firstName: m.first_name, ownerName: m.owner_name, ownerEmail: m.owner_email }).catch(() => {});
          }
        }
        await sendDowngradeToFree({ email: u.email, firstName: u.first_name, previousPlan }).catch(() => {});
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'grace_period_expired_downgrade',$2,NOW())`,
          [u.id, JSON.stringify({ previous_plan: previousPlan })]
        ).catch(() => {});
        await db.query(
          `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'grace_period_expired_downgrade',$2,$3,NOW())`,
          [u.id, u.id, JSON.stringify({ previous_plan: previousPlan })]
        ).catch(() => {});
        logger.info(`💳 Grace expired downgrade: user=${u.id} ${previousPlan}→Free`);
      } catch (err) { logger.error(`💳 Grace expire failed for ${u.id}`, { error: err.message }); }
    }

    // ── Overrides admin expirés → downgrade Free ───────────────────────────────
    const expiredOverrides = await db.query(
      `SELECT id, email, first_name, plan, admin_override_plan
       FROM users
       WHERE admin_override = TRUE
         AND override_expires_at IS NOT NULL
         AND override_expires_at < NOW()
         AND plan != 'Free'`
    );
    for (const u of expiredOverrides.rows) {
      try {
        await db.query(
          `UPDATE users SET
             plan='Free', admin_override=FALSE, admin_override_plan=NULL,
             override_expires_at=NULL, override_granted_by=NULL,
             downgraded_at=NOW()
           WHERE id=$1`,
          [u.id]
        );
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'cancel_subscription',$2,NOW())`,
          [u.id, JSON.stringify({ previous_plan: u.plan, reason:"admin_override_expired" })]
        ).catch(() => {});
        await db.query(
          `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'override_expired',$2,$3,NOW())`,
          [u.id, u.id, JSON.stringify({ previous_plan: u.plan })]
        ).catch(() => {});
        await sendDowngradeToFree({ email: u.email, firstName: u.first_name, previousPlan: u.plan }).catch(() => {});
        logger.info(`🎁 Override expired: user=${u.id} ${u.plan}→Free`);
      } catch (err) { logger.error(`🎁 Override expire failed for ${u.id}`, { error: err.message }); }
    }

  } catch (err) {
    logger.error("💳 Billing reminders job error", { error: err.message });
  }
};

// ─── Cron win-back : J+7, J+30, J+90 — toutes les 12h ────────────────────────
const runWinbackEmails = async () => {
  logger.info("📧 Running win-back email job...");
  try {
    // J+7
    const wb7 = await db.query(
      `SELECT id, email, first_name, highest_plan_ever FROM users
       WHERE plan='Free' AND had_paid_plan=TRUE AND downgraded_at IS NOT NULL
         AND downgraded_at BETWEEN NOW()-INTERVAL '8 days' AND NOW()-INTERVAL '6 days'
         AND winback_email_sent_at IS NULL`
    );
    for (const u of wb7.rows) {
      try {
        await sendWinbackWeek({ email: u.email, firstName: u.first_name, previousPlan: u.highest_plan_ever || "Pro" });
        await db.query("UPDATE users SET winback_email_sent_at=NOW() WHERE id=$1", [u.id]);
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'winback_7d',$2,NOW())`,
          [u.id, JSON.stringify({ highest_plan: u.highest_plan_ever })]
        ).catch(() => {});
        await db.query(
          `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'winback_7d',$2,$3,NOW())`,
          [u.id, u.id, JSON.stringify({ highest_plan: u.highest_plan_ever })]
        ).catch(() => {});
        logger.info(`📧 Win-back J+7 sent to ${u.email}`);
      } catch (err) { logger.error(`📧 Win-back J+7 failed for ${u.email}`, { error: err.message }); }
    }

    // J+30
    const wb30 = await db.query(
      `SELECT id, email, first_name, highest_plan_ever FROM users
       WHERE plan='Free' AND had_paid_plan=TRUE AND downgraded_at IS NOT NULL
         AND downgraded_at BETWEEN NOW()-INTERVAL '31 days' AND NOW()-INTERVAL '29 days'
         AND winback_email_sent_at IS NOT NULL`
    );
    for (const u of wb30.rows) {
      try {
        await sendWinbackMonth({ email: u.email, firstName: u.first_name, previousPlan: u.highest_plan_ever || "Pro" });
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'winback_30d',$2,NOW())`,
          [u.id, JSON.stringify({ highest_plan: u.highest_plan_ever })]
        ).catch(() => {});
        await db.query(
          `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'winback_30d',$2,$3,NOW())`,
          [u.id, u.id, JSON.stringify({ highest_plan: u.highest_plan_ever })]
        ).catch(() => {});
        logger.info(`📧 Win-back J+30 sent to ${u.email}`);
      } catch (err) { logger.error(`📧 Win-back J+30 failed for ${u.email}`, { error: err.message }); }
    }

    // J+90
    const wb90 = await db.query(
      `SELECT id, email, first_name, highest_plan_ever FROM users
       WHERE plan='Free' AND had_paid_plan=TRUE AND downgraded_at IS NOT NULL
         AND downgraded_at BETWEEN NOW()-INTERVAL '91 days' AND NOW()-INTERVAL '89 days'
         AND winback_email_sent_at IS NOT NULL`
    );
    for (const u of wb90.rows) {
      try {
        await sendWinbackQuarter({ email: u.email, firstName: u.first_name, previousPlan: u.highest_plan_ever || "Pro" });
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'winback_90d',$2,NOW())`,
          [u.id, JSON.stringify({ highest_plan: u.highest_plan_ever })]
        ).catch(() => {});
        await db.query(
          `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'winback_90d',$2,$3,NOW())`,
          [u.id, u.id, JSON.stringify({ highest_plan: u.highest_plan_ever })]
        ).catch(() => {});
        logger.info(`📧 Win-back J+90 sent to ${u.email}`);
      } catch (err) { logger.error(`📧 Win-back J+90 failed for ${u.email}`, { error: err.message }); }
    }
  } catch (err) {
    logger.error("📧 Win-back job error", { error: err.message });
  }
};

// Lancer billing toutes les heures
setInterval(runBillingReminders, 60 * 60 * 1000);
// Lancer win-back toutes les 12h
setInterval(runWinbackEmails, 12 * 60 * 60 * 1000);
// Et au démarrage (après 30s pour laisser le temps aux connexions DB)
setTimeout(() => { runBillingReminders(); runWinbackEmails(); }, 30000);
logger.info("💳 Billing & win-back crons started (billing: 1h, winback: 12h)");
