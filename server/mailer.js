/**
 * GrowthPILOT — Mailer Service (Resend via fetch)
 * File: server/mailer.js
 *
 * Même pattern que sendWeeklySummaryEmail dans server.js
 */

const FROM    = "GrowthPILOT <noreply@aigrowthpilot.app>";
const APP_URL = process.env.FRONTEND_URL || "https://www.aigrowthpilot.app";
const PRICING = `${APP_URL}/pricing`;

const COLORS = {
  Pro:      { accent:"#f97316", light:"#fff7ed" },
  Business: { accent:"#8b5cf6", light:"#f5f3ff" },
  Agency:   { accent:"#ec4899", light:"#fdf2f8" },
  Free:     { accent:"#64748b", light:"#f8fafc" },
};

// ─── Utilitaire envoi Resend ──────────────────────────────────────────────────
async function send({ to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  console.log(`[mailer] ✅ "${subject}" → ${to}`);
  return res.json();
}

// ─── Base HTML ────────────────────────────────────────────────────────────────
const base = (content, accent = "#ef4444") => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border-top:5px solid ${accent};">
    <div style="padding:28px 32px 0;text-align:center;">
      <div style="font-size:26px;font-weight:900;color:${accent};letter-spacing:-1px;">GrowthPILOT</div>
      <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:2px;margin-top:2px;">AI CONTENT PLATFORM</div>
    </div>
    ${content}
    <div style="padding:20px 32px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9;">
      <p style="margin:0 0 4px;">GrowthPILOT · AI-powered LinkedIn content</p>
      <p style="margin:0;"><a href="${APP_URL}" style="color:#94a3b8;">aigrowthpilot.app</a></p>
    </div>
  </div>
</body></html>`;

const btn  = (href, text, accent) => `<a href="${href}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:800;font-size:14px;margin:6px 4px;">${text}</a>`;
const btn2 = (href, text)         => `<a href="${href}" style="display:inline-block;background:transparent;color:#475569;text-decoration:none;padding:11px 22px;border-radius:10px;font-weight:600;font-size:13px;border:2px solid #e2e8f0;margin:6px 4px;">${text}</a>`;

function upgradeDesc(from, to) {
  const map = {
    "Pro->Business":    "Unlock team management, approvals workflow, unlimited projects, and shared calendar.",
    "Business->Agency": "Manage multiple clients with PDF reports, Agency client portfolio, up to 20 team members and 50 clients.",
    "Agency->Agency":   "Need custom member limits, dedicated support, or white-label? Let's build a plan around your agency.",
  };
  return map[`${from}->${to}`] || `Upgrade to ${to} for more power and flexibility.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. RENOUVELLEMENT J-3 (mensuel)
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendRenewalReminder3Days({ email, firstName, plan, renewalDate, monthlyPrice, annualPrice, upgradePlan }) {
  const accent  = COLORS[plan]?.accent || "#ef4444";
  const name    = firstName || "there";
  const upgrade = upgradePlan;

  const html = base(`
    <div style="padding:32px;">
      <h1 style="color:#1e293b;font-size:21px;margin:20px 0 8px;">⏰ Your ${plan} plan renews in 3 days</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">Hi ${name}, your <strong>${plan} Monthly</strong> subscription renews on <strong>${renewalDate}</strong> at <strong>${monthlyPrice}</strong>. Nothing to do — it renews automatically.</p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid ${accent};">
        <div style="font-size:12px;font-weight:700;color:#64748b;letter-spacing:1px;margin-bottom:10px;">💡 SAVE UP TO 20% — SWITCH TO ANNUAL</div>
        <p style="color:#1e293b;font-size:14px;margin:0 0 12px;">Lock in your ${plan} plan for a full year at <strong>${annualPrice}</strong>.</p>
        ${btn(`${PRICING}?switch=annual&plan=${plan.toLowerCase()}`, "Switch to Annual & Save", accent)}
      </div>

      ${upgrade ? `
      <div style="background:${COLORS[upgrade]?.light || "#f8fafc"};border-radius:12px;padding:20px;margin:16px 0;border:2px solid ${COLORS[upgrade]?.accent || "#8b5cf6"}33;">
        <div style="font-size:12px;font-weight:700;color:${COLORS[upgrade]?.accent};letter-spacing:1px;margin-bottom:8px;">🚀 UPGRADE TO ${upgrade.toUpperCase()}</div>
        <p style="color:#475569;font-size:14px;margin:0 0 12px;">${upgradeDesc(plan, upgrade)}</p>
        ${btn(`${PRICING}?upgrade=${upgrade.toLowerCase()}`, `Upgrade to ${upgrade}`, COLORS[upgrade]?.accent)}
      </div>` : ""}

      <p style="color:#94a3b8;font-size:12px;margin-top:20px;">
        <a href="${APP_URL}/profile" style="color:${accent};">Manage subscription →</a>
      </p>
    </div>
  `, accent);

  return send({ to: email, subject: `⏰ Your ${plan} plan renews in 3 days — save with annual`, html });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. RENOUVELLEMENT J-30 (annuel)
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendRenewalReminder30Days({ email, firstName, plan, renewalDate, annualPrice, upgradePlan }) {
  const accent  = COLORS[plan]?.accent || "#ef4444";
  const name    = firstName || "there";
  const upgrade = upgradePlan;

  const html = base(`
    <div style="padding:32px;">
      <h1 style="color:#1e293b;font-size:21px;margin:20px 0 8px;">📅 Your annual ${plan} plan renews in 1 month</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">Hi ${name}, your <strong>${plan} Annual</strong> renews on <strong>${renewalDate}</strong> at <strong>${annualPrice}</strong>. You have a full month to review or upgrade.</p>

      ${upgrade ? `
      <div style="background:${COLORS[upgrade]?.light || "#f8fafc"};border-radius:12px;padding:24px;margin:24px 0;border:2px solid ${COLORS[upgrade]?.accent || "#8b5cf6"}44;">
        <div style="font-size:12px;font-weight:700;color:${COLORS[upgrade]?.accent};letter-spacing:1px;margin-bottom:8px;">🚀 READY TO LEVEL UP?</div>
        <p style="color:#475569;font-size:14px;margin:0 0 14px;">${upgradeDesc(plan, upgrade)}</p>
        ${btn(`${PRICING}?upgrade=${upgrade.toLowerCase()}`, `Upgrade to ${upgrade} →`, COLORS[upgrade]?.accent)}
        ${btn2(PRICING, `Renew ${plan}`)}
      </div>` : `<div style="text-align:center;margin:28px 0;">${btn(PRICING, `Review my plan →`, accent)}</div>`}

      ${plan === "Agency" ? `
      <div style="background:#fdf2f8;border-radius:12px;padding:20px;margin:16px 0;border:2px solid #ec489944;">
        <div style="font-size:12px;font-weight:700;color:#ec4899;letter-spacing:1px;margin-bottom:8px;">🏢 AGENCY CUSTOM — BUILT FOR SCALE</div>
        <p style="color:#475569;font-size:14px;margin:0 0 12px;">Need more than 20 members, custom quotas, or dedicated support?</p>
        ${btn("mailto:hello@aigrowthpilot.app?subject=Agency Custom Plan", "Contact us for Custom →", "#ec4899")}
      </div>` : ""}
    </div>
  `, accent);

  return send({ to: email, subject: `📅 Your ${plan} annual plan renews in 1 month`, html });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PAIEMENT ÉCHOUÉ
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendPaymentFailed({ email, firstName, plan, gracePeriodEnds, updateCardUrl }) {
  const name = firstName || "there";

  const html = base(`
    <div style="padding:32px;">
      <div style="text-align:center;font-size:44px;margin-bottom:8px;">⚠️</div>
      <h1 style="color:#ef4444;font-size:21px;margin:0 0 16px;text-align:center;">Payment failed</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">Hi ${name}, we couldn't process your payment for <strong>${plan}</strong>. Your account is in a <strong>3-day grace period</strong> — you keep full access until <strong>${gracePeriodEnds}</strong>.</p>

      <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #ef4444;">
        <p style="color:#1e293b;font-size:15px;margin:0 0 14px;font-weight:700;">Update your payment method to avoid losing access</p>
        ${btn(updateCardUrl, "Update payment method →", "#ef4444")}
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;">Common reasons: expired card, insufficient funds, or bank block. After ${gracePeriodEnds}, your account will be downgraded to Free.</p>
    </div>
  `, "#ef4444");

  return send({ to: email, subject: `⚠️ Action required — Payment failed for your ${plan} plan`, html });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CONFIRMATION RENOUVELLEMENT RÉUSSI
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendRenewalConfirmation({ email, firstName, plan, amount, nextRenewalDate }) {
  const accent = COLORS[plan]?.accent || "#ef4444";
  const name   = firstName || "there";

  const html = base(`
    <div style="padding:32px;">
      <div style="text-align:center;font-size:44px;margin-bottom:8px;">✅</div>
      <h1 style="color:#22c55e;font-size:21px;margin:0 0 16px;text-align:center;">Subscription renewed</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">Hi ${name}, your <strong>${plan}</strong> subscription has been renewed. <strong>${amount}</strong> was charged to your payment method.</p>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #22c55e;">
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr><td style="padding:6px 0;"><strong>Plan</strong></td><td style="text-align:right;">${plan}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Amount charged</strong></td><td style="text-align:right;">${amount}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Next renewal</strong></td><td style="text-align:right;">${nextRenewalDate}</td></tr>
        </table>
      </div>

      <div style="text-align:center;margin:24px 0;">${btn(APP_URL, "Go to GrowthPILOT →", accent)}</div>
    </div>
  `, "#22c55e");

  return send({ to: email, subject: `✅ ${plan} subscription renewed — ${amount} charged`, html });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. DOWNGRADE → FREE
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendDowngradeToFree({ email, firstName, previousPlan }) {
  const name = firstName || "there";
  const feats = {
    Pro:      "<li>Unlimited generations</li><li>Advanced analytics</li><li>10 projects</li>",
    Business: "<li>Unlimited generations</li><li>Team management (up to 5 members)</li><li>Approvals workflow</li><li>Unlimited projects</li>",
    Agency:   "<li>Unlimited generations</li><li>Team management (up to 20 members)</li><li>Agency client portfolio</li><li>PDF reports</li><li>Shared calendar</li>",
  };

  const html = base(`
    <div style="padding:32px;">
      <h1 style="color:#1e293b;font-size:21px;margin:20px 0 8px;">Your ${previousPlan} plan has ended</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">Hi ${name}, your <strong>${previousPlan}</strong> subscription has ended. Your account is now on the <strong>Free plan</strong> (5 generations/month).</p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:#1e293b;font-size:14px;font-weight:700;margin:0 0 8px;">What you've lost access to:</p>
        <ul style="color:#475569;font-size:13px;margin:0;padding-left:20px;line-height:2;">${feats[previousPlan] || ""}</ul>
      </div>

      <div style="text-align:center;margin:28px 0;">${btn(PRICING, "Reactivate my plan →", "#ef4444")}</div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;">Your data and history are safe — waiting when you come back.</p>
    </div>
  `, "#64748b");

  return send({ to: email, subject: `Your ${previousPlan} plan has ended — your data is safe`, html });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. WIN-BACK J+7
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendWinbackWeek({ email, firstName, previousPlan }) {
  const name = firstName || "there";

  const html = base(`
    <div style="padding:32px;">
      <h1 style="color:#1e293b;font-size:21px;margin:20px 0 8px;">We miss you, ${name} 👋</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">It's been a week since your ${previousPlan} plan ended. Your LinkedIn content strategy doesn't have to stop.</p>

      <div style="background:linear-gradient(135deg,#fef2f2,#fff7ed);border-radius:12px;padding:24px;margin:24px 0;border:2px solid #ef444433;text-align:center;">
        <p style="font-size:32px;margin:0 0 8px;">🚀</p>
        <p style="color:#1e293b;font-size:17px;font-weight:800;margin:0 0 8px;">Come back with a fresh start</p>
        <p style="color:#475569;font-size:13px;margin:0 0 18px;">Your projects, brand memory and history are still saved.</p>
        ${btn(PRICING, `Reactivate ${previousPlan} →`, "#ef4444")}
      </div>
    </div>
  `, "#ef4444");

  return send({ to: email, subject: `We miss you, ${name} — your GrowthPILOT data is waiting`, html });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. WIN-BACK J+30
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendWinbackMonth({ email, firstName, previousPlan }) {
  const name = firstName || "there";

  const html = base(`
    <div style="padding:32px;">
      <h1 style="color:#1e293b;font-size:21px;margin:20px 0 8px;">Still thinking about it? 🤔</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">Hi ${name}, it's been a month since your ${previousPlan} subscription ended. LinkedIn moves fast — don't fall behind.</p>

      <div style="background:#f5f3ff;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #8b5cf6;">
        <p style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 12px;">What GrowthPILOT users achieved this month:</p>
        <ul style="color:#475569;font-size:13px;margin:0;padding-left:20px;line-height:2.2;">
          <li>📈 Average viral score: <strong>72/100</strong></li>
          <li>⚡ Posts generated per user: <strong>18/month</strong></li>
          <li>🎯 Engagement rate improvement: <strong>+34%</strong></li>
        </ul>
      </div>

      <div style="text-align:center;margin:28px 0;">${btn(PRICING, "Reactivate now →", "#8b5cf6")}</div>
    </div>
  `, "#8b5cf6");

  return send({ to: email, subject: `One month later — here's what you're missing on GrowthPILOT`, html });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. WIN-BACK J+90
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendWinbackQuarter({ email, firstName, previousPlan }) {
  const name = firstName || "there";

  const html = base(`
    <div style="padding:32px;">
      <h1 style="color:#1e293b;font-size:21px;margin:20px 0 8px;">Last message from us, ${name}</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">This is our last win-back email. If you ever want to come back, your account and all your data are ready.</p>
      <div style="text-align:center;margin:28px 0;">${btn(PRICING, "One last look →", "#f97316")}</div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;">We'll stop sending win-back emails after this.</p>
    </div>
  `, "#f97316");

  return send({ to: email, subject: `Last message from GrowthPILOT — we won't bother you again`, html });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. SUSPENSION ÉQUIPE
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendTeamSuspended({ email, firstName, ownerName, ownerEmail }) {
  const name = firstName || "there";

  const html = base(`
    <div style="padding:32px;">
      <div style="text-align:center;font-size:44px;margin-bottom:8px;">⏸️</div>
      <h1 style="color:#f59e0b;font-size:21px;margin:0 0 16px;text-align:center;">Your team access has been suspended</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">Hi ${name}, the GrowthPILOT team managed by <strong>${ownerName || ownerEmail}</strong> has been suspended because their subscription ended.</p>
      <p style="color:#475569;font-size:15px;line-height:1.6;"><strong>No data has been deleted.</strong> Contact your team owner to restore access.</p>
      <div style="background:#fffbeb;border-radius:12px;padding:16px;margin:20px 0;border-left:4px solid #f59e0b;">
        <p style="color:#92400e;font-size:14px;margin:0;">📧 Team owner: <strong>${ownerEmail}</strong></p>
      </div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;">You can also <a href="${PRICING}" style="color:#f59e0b;">start your own plan</a> independently.</p>
    </div>
  `, "#f59e0b");

  return send({ to: email, subject: `⏸️ Your GrowthPILOT team access has been suspended`, html });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. GRACE PERIOD EXPIRE — dernier avertissement
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendGracePeriodExpiring({ email, firstName, plan, expiresAt, updateCardUrl }) {
  const name = firstName || "there";

  const html = base(`
    <div style="padding:32px;">
      <div style="text-align:center;font-size:44px;margin-bottom:8px;">🚨</div>
      <h1 style="color:#ef4444;font-size:21px;margin:0 0 16px;text-align:center;">Last chance — access expires soon</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">Hi ${name}, your grace period ends on <strong>${expiresAt}</strong>. After that, your <strong>${plan}</strong> features will be suspended.</p>
      <div style="text-align:center;margin:28px 0;">${btn(updateCardUrl, "Fix payment now →", "#ef4444")}</div>
    </div>
  `, "#ef4444");

  return send({ to: email, subject: `🚨 Last chance — your ${plan} access expires in 24h`, html });
}
