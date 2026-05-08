import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";

const API = "https://social-ai-app-production.up.railway.app";

const PLANS = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: null,
    description: "Discover GrowthPILOT",
    color: "#475569",
    accent: "rgba(71,85,105,0.2)",
    border: "rgba(71,85,105,0.3)",
    features: [
      { text: "5 AI generations / month", included: true },
      { text: "1 project", included: true },
      { text: "3 content analyses", included: true },
      { text: "Brand Memory", included: false },
      { text: "Export content", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started Free",
    planKey: null,
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 19,
    yearlyPrice: 15,
    badge: "MOST POPULAR",
    description: "For solo creators & founders",
    color: "#ef4444",
    accent: "rgba(220,38,38,0.15)",
    border: "rgba(220,38,38,0.5)",
    features: [
      { text: "100 AI generations / month", included: true },
      { text: "10 projects", included: true },
      { text: "Unlimited analyses", included: true },
      { text: "Brand Memory", included: true },
      { text: "Export content", included: true },
      { text: "Priority support", included: false },
    ],
    cta: "Start Pro →",
    planKey: "pro",
  },
  {
    key: "business",
    name: "Business",
    monthlyPrice: 49,
    yearlyPrice: 39,
    badge: "BEST VALUE",
    description: "For teams & agencies",
    color: "#f97316",
    accent: "rgba(249,115,22,0.12)",
    border: "rgba(249,115,22,0.4)",
    features: [
      { text: "Unlimited AI generations", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Unlimited analyses", included: true },
      { text: "Brand Memory", included: true },
      { text: "Export content", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Business →",
    planKey: "business",
  },
];

export default function Pricing({ openLogin, openApp, token }) {
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    if (token) {
      fetch(`${API}/stripe/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setCurrentPlan(data.plan))
        .catch(() => {});
    }
  }, [token]);

  const handleCheckout = async (plan) => {
    if (!token) {
      openLogin();
      return;
    }
    if (!plan.planKey) return;

    setLoading(plan.key);
    try {
      const planKey = `${plan.planKey}_${yearly ? "yearly" : "monthly"}`;
      const res = await fetch(`${API}/stripe/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={styles.page}>
      {/* Noise overlay */}
      <div style={styles.noise} />

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.brand}>
          <img src={logo} alt="logo" style={styles.navLogo} />
          <span style={styles.brandName}>GrowthPILOT</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={styles.navBtn} onClick={openLogin}>LOGIN</button>
          <button style={styles.navCta} onClick={openApp}>TRY FOR FREE</button>
        </div>
      </nav>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.badge}>💳 SIMPLE PRICING</div>
        <h1 style={styles.title}>
          Invest in your<br />
          <span style={styles.titleAccent}>content growth.</span>
        </h1>
        <p style={styles.subtitle}>
          No hidden fees. No surprises. Cancel anytime.
        </p>

        {/* Toggle */}
        <div style={styles.toggle}>
          <span style={{ color: !yearly ? "#fff" : "#475569", fontWeight: 700, fontSize: 14 }}>Monthly</span>
          <div
            style={styles.toggleTrack}
            onClick={() => setYearly(!yearly)}
          >
            <div style={{
              ...styles.toggleThumb,
              transform: yearly ? "translateX(22px)" : "translateX(2px)"
            }} />
          </div>
          <span style={{ color: yearly ? "#fff" : "#475569", fontWeight: 700, fontSize: 14 }}>
            Yearly
            <span style={styles.saveBadge}>SAVE 20%</span>
          </span>
        </div>
      </div>

      {/* Plans */}
      <div style={styles.plans}>
        {PLANS.map((plan) => {
          const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
          const isActive = currentPlan?.toLowerCase() === plan.name.toLowerCase();
          const isPro = plan.key === "pro";

          return (
            <div
              key={plan.key}
              style={{
                ...styles.card,
                border: `1px solid ${plan.border}`,
                background: isPro
                  ? `linear-gradient(145deg, #1a0a0a, #1a1020)`
                  : "linear-gradient(145deg,#111827,#0f172a)",
                boxShadow: isPro
                  ? `0 0 40px rgba(220,38,38,0.15), 0 20px 60px rgba(0,0,0,0.4)`
                  : "0 20px 60px rgba(0,0,0,0.3)",
                transform: isPro ? "scale(1.04)" : "scale(1)",
                zIndex: isPro ? 2 : 1,
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{ ...styles.planBadge, background: plan.accent, color: plan.color, border: `1px solid ${plan.border}` }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan header */}
              <div style={styles.planHeader}>
                <div style={{ ...styles.planDot, background: plan.color }} />
                <span style={{ ...styles.planName, color: plan.color }}>{plan.name}</span>
              </div>
              <p style={styles.planDesc}>{plan.description}</p>

              {/* Price */}
              <div style={styles.priceRow}>
                <span style={styles.currency}>€</span>
                <span style={styles.price}>{price}</span>
                <span style={styles.per}>/mo</span>
              </div>
              {yearly && price > 0 && (
                <div style={styles.billedYearly}>Billed €{price * 12}/year</div>
              )}

              {/* Divider */}
              <div style={{ ...styles.divider, background: plan.border }} />

              {/* Features */}
              <div style={styles.features}>
                {plan.features.map((f, i) => (
                  <div key={i} style={styles.feature}>
                    <span style={{ color: f.included ? plan.color : "#1e293b", fontSize: 14, fontWeight: 800 }}>
                      {f.included ? "✓" : "✗"}
                    </span>
                    <span style={{ color: f.included ? "#cbd5e1" : "#334155", fontSize: 13 }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                style={{
                  ...styles.cta,
                  background: isActive
                    ? "rgba(34,197,94,0.15)"
                    : plan.key === "free"
                    ? "transparent"
                    : `linear-gradient(135deg, ${plan.color}, ${plan.key === "pro" ? "#991b1b" : "#c2410c"})`,
                  border: isActive
                    ? "1px solid #22c55e"
                    : plan.key === "free"
                    ? `1px solid ${plan.border}`
                    : "none",
                  color: isActive ? "#22c55e" : "#fff",
                  cursor: isActive || plan.key === "free" ? "default" : "pointer",
                  boxShadow: plan.key !== "free" && !isActive
                    ? `0 4px 20px ${plan.accent}`
                    : "none",
                }}
                onClick={() => !isActive && handleCheckout(plan)}
                disabled={loading === plan.key || isActive}
              >
                {loading === plan.key
                  ? "Redirecting..."
                  : isActive
                  ? "✓ Current Plan"
                  : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p style={styles.footerNote}>
        🔒 Secure payment via Stripe · Cancel anytime · No commitment
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617 0%,#0f172a 50%,#1a0a0a 100%)",
    color: "white",
    padding: "20px 48px 60px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  noise: {
    position: "fixed",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 48,
    position: "relative",
    zIndex: 1,
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  navLogo: { width: 44, height: 44, objectFit: "contain" },
  brandName: {
    fontSize: 20,
    fontWeight: 900,
    fontStyle: "italic",
    color: "#000",
    WebkitTextStroke: "1px white",
    textShadow: "1px 1px 0 #ef4444",
  },
  navBtn: {
    padding: "12px 24px",
    background: "transparent",
    border: "1px solid rgba(220,38,38,0.25)",
    borderRadius: 10,
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  navCta: {
    padding: "12px 24px",
    background: "linear-gradient(135deg,#dc2626,#991b1b)",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    boxShadow: "0 4px 16px rgba(220,38,38,0.35)",
  },
  header: {
    textAlign: "center",
    marginBottom: 56,
    position: "relative",
    zIndex: 1,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(220,38,38,0.1)",
    border: "1px solid rgba(220,38,38,0.3)",
    borderRadius: 20,
    padding: "6px 16px",
    fontSize: 11,
    fontWeight: 700,
    color: "#ef4444",
    letterSpacing: "1.5px",
    marginBottom: 20,
  },
  title: {
    fontSize: 52,
    fontWeight: 900,
    lineHeight: 1.1,
    margin: "0 0 16px",
  },
  titleAccent: { color: "#ef4444" },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    margin: "0 0 32px",
  },
  toggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
  },
  toggleTrack: {
    width: 48,
    height: 26,
    background: "rgba(220,38,38,0.3)",
    border: "1px solid rgba(220,38,38,0.5)",
    borderRadius: 13,
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
  },
  toggleThumb: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 20,
    background: "#ef4444",
    borderRadius: "50%",
    transition: "transform 0.2s",
    boxShadow: "0 2px 8px rgba(220,38,38,0.5)",
  },
  saveBadge: {
    marginLeft: 8,
    background: "rgba(220,38,38,0.2)",
    border: "1px solid rgba(220,38,38,0.4)",
    borderRadius: 6,
    padding: "2px 6px",
    fontSize: 10,
    color: "#ef4444",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },
  plans: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 24,
    maxWidth: 960,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
    alignItems: "center",
  },
  card: {
    borderRadius: 20,
    padding: "28px 24px",
    position: "relative",
    transition: "transform 0.2s",
  },
  planBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "4px 14px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "1px",
    whiteSpace: "nowrap",
  },
  planHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  planDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  planName: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },
  planDesc: {
    fontSize: 12,
    color: "#475569",
    margin: "0 0 20px",
  },
  priceRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 4,
  },
  currency: {
    fontSize: 20,
    fontWeight: 800,
    color: "#94a3b8",
    marginBottom: 6,
  },
  price: {
    fontSize: 52,
    fontWeight: 900,
    lineHeight: 1,
    color: "#fff",
  },
  per: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
  },
  billedYearly: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 4,
  },
  divider: {
    height: 1,
    margin: "20px 0",
    opacity: 0.3,
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 24,
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  cta: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: "0.5px",
    transition: "opacity 0.2s, transform 0.1s",
    cursor: "pointer",
  },
  footerNote: {
    textAlign: "center",
    color: "#334155",
    fontSize: 13,
    marginTop: 40,
    position: "relative",
    zIndex: 1,
  },
};
