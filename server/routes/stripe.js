import express from "express";
import Stripe from "stripe";
import db from "../db.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Plans config ──────────────────────────────────────────────────────────────
const PLANS = {
  pro_monthly:      { priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,      name: "Pro",      interval: "month" },
  pro_yearly:       { priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,       name: "Pro",      interval: "year"  },
  business_monthly: { priceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID, name: "Business", interval: "month" },
  business_yearly:  { priceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,  name: "Business", interval: "year"  },
  agency_monthly:   { priceId: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,   name: "Agency",   interval: "month" },
  agency_yearly:    { priceId: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,    name: "Agency",   interval: "year"  },
};

// ─── Middleware auth ───────────────────────────────────────────────────────────
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

// ─── POST /stripe/create-checkout ─────────────────────────────────────────────
// Crée une session Stripe Checkout et retourne l'URL de paiement
router.post("/create-checkout", authenticateToken, async (req, res) => {
  const { planKey } = req.body; // ex: "pro_monthly"
  const plan = PLANS[planKey];
  if (!plan) return res.status(400).json({ message: "Invalid plan" });

  try {
    // Récupère ou crée le customer Stripe lié à l'user
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
// Reçoit les événements Stripe (abonnement activé, annulé, etc.)
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, planKey } = session.metadata;
    const plan = PLANS[planKey];

    await db.query(
      `UPDATE users 
       SET plan=$1, stripe_subscription_id=$2, plan_interval=$3
       WHERE id=$4`,
      [plan.name, session.subscription, plan.interval, userId]
    );
    // Log plan_upgrade
    try {
      await db.query(
        `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())`,
        [userId, "plan_upgrade", JSON.stringify({ plan: plan.name, interval: plan.interval, planKey })]
      );
    } catch {}
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const result = await db.query(
      "UPDATE users SET plan='Free', stripe_subscription_id=NULL WHERE stripe_subscription_id=$1 RETURNING id",
      [subscription.id]
    );
    // Log cancel_subscription
    if (result.rows.length) {
      try {
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())`,
          [result.rows[0].id, "cancel_subscription", JSON.stringify({ subscription_id: subscription.id })]
        );
      } catch {}
    }
  }

  res.json({ received: true });
});

// ─── GET /stripe/status ────────────────────────────────────────────────────────
// Retourne le plan actuel de l'user connecté
router.get("/status", authenticateToken, async (req, res) => {
  const result = await db.query(
    "SELECT email, plan, plan_interval FROM users WHERE id=$1",
    [req.user.id]
  );
  const user = result.rows[0];

  res.json({
    plan: user?.plan || "Free",
    interval: user?.plan_interval || null,
  });
});

// ─── POST /stripe/cancel ───────────────────────────────────────────────────────
// Annule l'abonnement en fin de période
router.post("/cancel", authenticateToken, async (req, res) => {
  const result = await db.query(
    "SELECT stripe_subscription_id FROM users WHERE id=$1",
    [req.user.id]
  );
  const subId = result.rows[0]?.stripe_subscription_id;
  if (!subId) return res.status(400).json({ message: "No active subscription" });

  await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
  // Log l'annulation
  try {
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())`,
      [req.user.id, "cancel_subscription", JSON.stringify({ subscription_id: subId })]
    );
  } catch {}
  res.json({ success: true, message: "Subscription will cancel at period end" });
});

export default router;
