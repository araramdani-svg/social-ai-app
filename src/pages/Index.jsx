import React from "react";
import logo from "../assets/logo.png";

export default function Index({ openApp, openLogin }) {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.brand}>
          <img src={logo} alt="logo" style={styles.navLogo} />
          <span style={styles.brandName}>GrowthPILOT</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button style={styles.login} onClick={openLogin}>LOGIN</button>
          <button style={styles.cta} onClick={openApp}>TRY FOR FREE</button>
        </div>
      </nav>

      <section style={styles.hero}>
        <div style={styles.left}>

          {/* Badge */}
          <div style={styles.badge}>⚡ AI-POWERED CONTENT OS</div>

          <h1 style={styles.headline}>
            Build Authority.<br/>
            Scale Content.<br/>
            <span style={styles.headlineAccent}>Dominate Social.</span>
          </h1>

          <p style={styles.description}>
            The all-in-one platform for founders, creators and growth teams
            who want to publish smarter and grow faster.
          </p>

          <div style={{ display:"flex", gap:12, marginTop:40 }}>
            <button style={styles.ctaLarge} onClick={openApp}>START FREE →</button>
            <button style={styles.ctaOutline} onClick={openLogin}>LOGIN</button>
          </div>

          {/* Social proof */}
          <div style={styles.proof}>
            <div style={styles.proofItem}>
              <span style={styles.proofNum}>10k+</span>
              <span style={styles.proofLabel}>Posts generated</span>
            </div>
            <div style={styles.proofDivider}/>
            <div style={styles.proofItem}>
              <span style={styles.proofNum}>3x</span>
              <span style={styles.proofLabel}>Faster publishing</span>
            </div>
            <div style={styles.proofDivider}/>
            <div style={styles.proofItem}>
              <span style={styles.proofNum}>98%</span>
              <span style={styles.proofLabel}>Satisfaction rate</span>
            </div>
          </div>
        </div>

        {/* Card droite */}
        <div style={styles.right}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardBadge}>LIVE PLATFORM</span>
              <span style={styles.cardDot}/>
            </div>

            {[
              { icon:"✍️", label:"AI Writing Engine", desc:"Generate authority content in seconds" },
              { icon:"🧠", label:"Brand Memory", desc:"Train AI on your brand identity" },
              { icon:"📅", label:"Scheduler", desc:"Plan and automate your publishing" },
              { icon:"📊", label:"Analytics", desc:"Measure and optimize performance" },
              { icon:"🚀", label:"Autopost", desc:"Multi-platform distribution" },
              { icon:"👥", label:"Team Mode", desc:"Collaborative content operations" },
            ].map((f,i)=>(
              <div key={i} style={styles.feature}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <div>
                  <div style={styles.featureLabel}>{f.label}</div>
                  <div style={styles.featureDesc}>{f.desc}</div>
                </div>
                <span style={styles.featureArrow}>▸</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    overflow: "hidden",
    background: "linear-gradient(135deg,#020617 0%,#0f172a 50%,#1a0a0a 100%)",
    color: "white",
    padding: "20px 48px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif"
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  navLogo: {
    width: 44,
    height: 44,
    objectFit: "contain"
  },
  brandName: {
    fontSize: 20,
    fontWeight: 900,
    fontStyle: "italic",
    color: "#000",
    WebkitTextStroke: "1px white",
    textShadow: "1px 1px 0 #ef4444"
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 48,
    alignItems: "center",
    height: "calc(100vh - 120px)"
  },
  left: {
    display: "flex",
    flexDirection: "column"
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
    marginBottom: 24,
    width: "fit-content"
  },
  headline: {
    fontSize: 48,
    fontWeight: 900,
    lineHeight: 1.1,
    marginBottom: 20,
    margin: 0
  },
  headlineAccent: {
    color: "#ef4444",
    WebkitTextStroke: "0px",
  },
  description: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 1.7,
    maxWidth: 480,
    marginTop: 20
  },
  cta: {
    padding: "12px 24px",
    background: "linear-gradient(135deg,#dc2626,#991b1b)",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    letterSpacing: "0.5px",
    boxShadow: "0 4px 16px rgba(220,38,38,0.35)"
  },
  ctaLarge: {
    padding: "16px 32px",
    background: "linear-gradient(135deg,#dc2626,#991b1b)",
    border: "none",
    borderRadius: 12,
    color: "white",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    letterSpacing: "1px",
    boxShadow: "0 4px 24px rgba(220,38,38,0.4)"
  },
  ctaOutline: {
    padding: "16px 32px",
    background: "transparent",
    border: "1px solid rgba(220,38,38,0.3)",
    borderRadius: 12,
    color: "#ef4444",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer"
  },
  login: {
    padding: "12px 24px",
    background: "transparent",
    border: "1px solid rgba(220,38,38,0.25)",
    borderRadius: 10,
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13
  },
  proof: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    marginTop: 40,
    paddingTop: 32,
    borderTop: "1px solid rgba(255,255,255,0.06)"
  },
  proofItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  proofNum: {
    fontSize: 24,
    fontWeight: 900,
    color: "#ef4444"
  },
  proofLabel: {
    fontSize: 12,
    color: "#475569"
  },
  proofDivider: {
    width: 1,
    height: 36,
    background: "rgba(255,255,255,0.08)"
  },
  right: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    background: "linear-gradient(145deg,#1a2235,#111827)",
    border: "1px solid rgba(220,38,38,0.2)",
    borderLeft: "3px solid #ef4444",
    borderRadius: 16,
    padding: "24px 20px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(220,38,38,0.1)"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  cardBadge: {
    color: "#ef4444",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "1.5px"
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px #22c55e"
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid rgba(220,38,38,0.06)",
    cursor: "pointer"
  },
  featureIcon: {
    fontSize: 18,
    width: 32,
    textAlign: "center"
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#fff"
  },
  featureDesc: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2
  },
  featureArrow: {
    marginLeft: "auto",
    color: "#ef4444",
    fontSize: 12
  }
};