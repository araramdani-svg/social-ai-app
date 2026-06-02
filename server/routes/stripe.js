import express from "express";
import Stripe from "stripe";
import db from "../config/db.js";
import {
  sendRenewalConfirmation,
  sendPaymentFailed,
  sendDowngradeToFree,
  sendTeamSuspended,
} from "../mailer.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  pro_monthly:      { priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,      name: "Pro",      interval: "month" },
  pro_yearly:       { priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,       name: "Pro",      interval: "year"  },
  business_monthly: { priceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID, name: "Business", interval: "month" },
  business_yearly:  { priceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,  name: "Business", interval: "year"  },
  agency_monthly:   { priceId: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,   name: "Agency",   interval: "month" },
  agency_yearly:    { priceId: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,    name: "Agency",   interval: "year"  },
};

import jwt from "jsonwebtoken";
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getUserBySubId(subscriptionId) {
  const r = await db.query(
    "SELECT id, email, plan, plan_interval, first_name, stripe_customer_id FROM users WHERE stripe_subscription_id=$1",
    [subscriptionId]
  );
  return r.rows[0] || null;
}

async function suspendTeam(ownerId) {
  try {
    const membersRes = await db.query(
      `SELECT tm.member_id, u.email, u.first_name,
              ou.email as owner_email, ou.display_name as owner_name
       FROM team_members tm
       JOIN users u ON u.id = tm.member_id
       JOIN users ou ON ou.id = tm.owner_id
       WHERE tm.owner_id = $1 AND tm.status = 'active'`,
      [ownerId]
    );
    await db.query(
      "UPDATE team_members SET status='suspended' WHERE owner_id=$1 AND status='active'",
      [ownerId]
    );
    for (const m of membersRes.rows) {
      await sendTeamSuspended({ email: m.email, firstName: m.first_name, ownerName: m.owner_name, ownerEmail: m.owner_email }).catch(() => {});
    }
    console.log(`[stripe] Team suspended owner=${ownerId}, ${membersRes.rows.length} members notified`);
  } catch (err) {
    console.error("[stripe] suspendTeam error:", err.message);
  }
}

// ─── POST /stripe/create-checkout ─────────────────────────────────────────────
router.post("/create-checkout", authenticateToken, async (req, res) => {
  const { planKey } = req.body;
  const plan = PLANS[planKey];
  if (!plan) return res.status(400).json({ message: "Invalid plan" });

  try {
    const userResult = await db.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
    const user = userResult.rows[0];

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await db.query("UPDATE users SET stripe_customer_id=$1 WHERE id=$2", [customerId, user.id]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=success`,
      cancel_url:  `${process.env.FRONTEND_URL}/pricing?upgrade=cancelled`,
      metadata: { userId: req.user.id, planKey },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ message: "Stripe error" });
  }
});

// ─── POST /stripe/webhook ──────────────────────────────────────────────────────
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[stripe webhook] ${event.type}`);

  // ── 1. Checkout complété ────────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, planKey } = session.metadata;
    const plan = PLANS[planKey];

    let periodEnd = null, periodStart = null;
    try {
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      periodEnd   = new Date(sub.current_period_end   * 1000);
      periodStart = new Date(sub.current_period_start * 1000);
    } catch {}

    await db.query(
      `UPDATE users SET
         plan=$1, stripe_subscription_id=$2, plan_interval=$3,
         subscription_start_at=COALESCE(subscription_start_at,$4),
         current_period_end=$5,
         had_paid_plan=TRUE,
         highest_plan_ever=CASE
           WHEN highest_plan_ever='Agency' THEN 'Agency'
           WHEN $1='Agency' THEN 'Agency'
           WHEN highest_plan_ever='Business' AND $1='Business' THEN 'Business'
           WHEN $1='Pro' AND (highest_plan_ever IS NULL OR highest_plan_ever='Free') THEN 'Pro'
           ELSE COALESCE(highest_plan_ever,$1)
         END,
         payment_failed_at=NULL, grace_period_ends_at=NULL,
         renewal_reminder_sent_at=NULL,
         generations_count=0, quota_reset_date=NOW()
       WHERE id=$6`,
      [plan.name, session.subscription, plan.interval, periodStart, periodEnd, userId]
    );

    // Réactiver équipe suspendue si owner revient
    await db.query(
      "UPDATE team_members SET status='active' WHERE owner_id=$1 AND status='suspended'",
      [userId]
    ).catch(() => {});

    // Logs
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'plan_upgrade',$2,NOW())`,
      [userId, JSON.stringify({ plan: plan.name, interval: plan.interval, planKey })]
    ).catch(() => {});
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'plan_upgrade',$2,$3,NOW())`,
      [userId, userId, JSON.stringify({ plan: plan.name, interval: plan.interval, planKey, period_end: periodEnd })]
    ).catch(() => {});

    console.log(`[stripe] plan activated: user=${userId} plan=${plan.name} until=${periodEnd}`);
  }

  // ── 2. Renouvellement réussi (invoice.paid) ─────────────────────────────────
  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    if (invoice.billing_reason !== "subscription_cycle") return res.json({ received: true });

    const user = await getUserBySubId(invoice.subscription);
    if (!user) return res.json({ received: true });

    let periodEnd = null;
    try {
      const sub = await stripe.subscriptions.retrieve(invoice.subscription);
      periodEnd = new Date(sub.current_period_end * 1000);
    } catch {}

    await db.query(
      `UPDATE users SET
         generations_count=0, quota_reset_date=NOW(),
         current_period_end=$1,
         payment_failed_at=NULL, grace_period_ends_at=NULL,
         renewal_reminder_sent_at=NULL
       WHERE id=$2`,
      [periodEnd, user.id]
    );

    const amount = `${(invoice.amount_paid / 100).toFixed(2)} ${(invoice.currency || "eur").toUpperCase()}`;

    // Logs
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'subscription_renewed',$2,NOW())`,
      [user.id, JSON.stringify({ plan: user.plan, interval: user.plan_interval, amount_paid: invoice.amount_paid / 100, currency: invoice.currency, period_end: periodEnd })]
    ).catch(() => {});
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'subscription_renewed',$2,$3,NOW())`,
      [user.id, user.id, JSON.stringify({ plan: user.plan, amount, period_end: periodEnd })]
    ).catch(() => {});

    await sendRenewalConfirmation({
      email: user.email, firstName: user.first_name, plan: user.plan, amount,
      nextRenewalDate: periodEnd?.toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }) || "—",
    }).catch(() => {});

    console.log(`[stripe] renewal confirmed: user=${user.id} plan=${user.plan} amount=${amount}`);
  }

  // ── 3. Paiement échoué ───────────────────────────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const user = await getUserBySubId(invoice.subscription);
    if (!user) return res.json({ received: true });

    const gracePeriodEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await db.query(
      "UPDATE users SET payment_failed_at=NOW(), grace_period_ends_at=$1 WHERE id=$2",
      [gracePeriodEnds, user.id]
    );

    let updateCardUrl = `${process.env.FRONTEND_URL}/profile`;
    try {
      const portal = await stripe.billingPortal.sessions.create({
        customer: user.stripe_customer_id,
        return_url: `${process.env.FRONTEND_URL}/profile`,
      });
      updateCardUrl = portal.url;
    } catch {}

    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'payment_failed',$2,NOW())`,
      [user.id, JSON.stringify({ plan: user.plan, invoice_id: invoice.id, grace_period_ends: gracePeriodEnds })]
    ).catch(() => {});
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'payment_failed',$2,$3,NOW())`,
      [user.id, user.id, JSON.stringify({ plan: user.plan, grace_until: gracePeriodEnds })]
    ).catch(() => {});

    await sendPaymentFailed({
      email: user.email, firstName: user.first_name, plan: user.plan,
      gracePeriodEnds: gracePeriodEnds.toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }),
      updateCardUrl,
    }).catch(() => {});

    console.log(`[stripe] payment_failed: user=${user.id} grace_until=${gracePeriodEnds}`);
  }

  // ── 4. Abonnement supprimé ───────────────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const user = await getUserBySubId(subscription.id);
    if (!user) return res.json({ received: true });

    const previousPlan = user.plan;

    await db.query(
      `UPDATE users SET
         plan='Free', stripe_subscription_id=NULL, plan_interval=NULL,
         current_period_end=NULL, payment_failed_at=NULL, grace_period_ends_at=NULL,
         downgraded_at=NOW()
       WHERE id=$1`,
      [user.id]
    );

    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'cancel_subscription',$2,NOW())`,
      [user.id, JSON.stringify({ previous_plan: previousPlan, subscription_id: subscription.id })]
    ).catch(() => {});
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,'cancel_subscription',$2,$3,NOW())`,
      [user.id, user.id, JSON.stringify({ previous_plan: previousPlan })]
    ).catch(() => {});

    if (previousPlan === "Business" || previousPlan === "Agency") {
      await suspendTeam(user.id);
    }

    await sendDowngradeToFree({ email: user.email, firstName: user.first_name, previousPlan }).catch(() => {});

    console.log(`[stripe] subscription deleted: user=${user.id} was ${previousPlan} → Free`);
  }

  res.json({ received: true });
});

// ─── GET /stripe/status ────────────────────────────────────────────────────────
router.get("/status", authenticateToken, async (req, res) => {
  const result = await db.query(
    `SELECT email, plan, plan_interval, current_period_end,
            subscription_start_at, had_paid_plan, highest_plan_ever,
            payment_failed_at, grace_period_ends_at
     FROM users WHERE id=$1`,
    [req.user.id]
  );
  const user = result.rows[0];
  res.json({
    plan:                  user?.plan || "Free",
    interval:              user?.plan_interval || null,
    current_period_end:    user?.current_period_end || null,
    subscription_start_at: user?.subscription_start_at || null,
    had_paid_plan:         user?.had_paid_plan || false,
    highest_plan_ever:     user?.highest_plan_ever || "Free",
    payment_failed:        !!user?.payment_failed_at,
    grace_period_ends_at:  user?.grace_period_ends_at || null,
  });
});

// ─── POST /stripe/cancel ───────────────────────────────────────────────────────
router.post("/cancel", authenticateToken, async (req, res) => {
  const result = await db.query(
    "SELECT stripe_subscription_id FROM users WHERE id=$1", [req.user.id]
  );
  const subId = result.rows[0]?.stripe_subscription_id;
  if (!subId) return res.status(400).json({ message: "No active subscription" });

  await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
  await db.query(
    `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'cancel_subscription',$2,NOW())`,
    [req.user.id, JSON.stringify({ subscription_id: subId, cancel_at_period_end: true })]
  ).catch(() => {});

  res.json({ success: true, message: "Subscription will cancel at period end" });
});

// ─── GET /stripe/portal — Stripe Customer Portal ──────────────────────────────
router.get("/portal", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT stripe_customer_id FROM users WHERE id=$1", [req.user.id]
    );
    const customerId = result.rows[0]?.stripe_customer_id;
    if (!customerId) return res.status(400).json({ message: "No Stripe customer" });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/profile`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err.message);
    res.status(500).json({ message: "Failed to create portal session" });
  }
});

export default router;
