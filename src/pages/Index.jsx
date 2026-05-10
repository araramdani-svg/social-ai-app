import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { t as tr } from "../translations.js";

const API = "https://social-ai-app-production.up.railway.app";

const LANGS = [
  { key:"en", flag:"🇬🇧" },
  { key:"fr", flag:"🇫🇷" },
  { key:"es", flag:"🇪🇸" },
  { key:"de", flag:"🇩🇪" },
  { key:"it", flag:"🇮🇹" },
  { key:"pt", flag:"🇵🇹" },
];

/* ── Hook breakpoint ── */
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

export default function Index({ openApp, openLogin, openPricing }) {
  const [lang, setLang] = useState("en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width < 1024;

  const l = (key) => tr(lang, `landing.${key}`);

  const features = [
    { icon:"✍️", titleKey:"feature1title", descKey:"feature1desc" },
    { icon:"🧠", titleKey:"feature2title", descKey:"feature2desc" },
    { icon:"🌍", titleKey:"feature3title", descKey:"feature3desc" },
    { icon:"📊", titleKey:"feature4title", descKey:"feature4desc" },
    { icon:"📅", titleKey:"feature5title", descKey:"feature5desc" },
    { icon:"🚀", titleKey:"feature6title", descKey:"feature6desc" },
  ];

  const testimonials = [
    { nameKey:"t1name", roleKey:"t1role", textKey:"t1text", stars:5 },
    { nameKey:"t2name", roleKey:"t2role", textKey:"t2text", stars:5 },
    { nameKey:"t3name", roleKey:"t3role", textKey:"t3text", stars:5 },
  ];

  /* ── Styles responsive ── */
  const s = makeStyles(isMobile, isTablet);

  return (
    <div style={s.page}>

      {/* ── NAV ── */}
      <nav style={s.nav}>
        <div style={s.brand}>
          <img src={logo} alt="logo" style={s.navLogo} />
          <span style={s.brandName}>GrowthPILOT</span>
        </div>

        {isMobile ? (
          /* Nav mobile : burger */
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Lang selector compact */}
            <div style={{ position:"relative" }}>
              <button style={s.langBtn} onClick={() => setShowLangMenu(!showLangMenu)}>
                {LANGS.find(l => l.key === lang)?.flag}
              </button>
              {showLangMenu && (
                <div style={s.langMenu}>
                  {LANGS.map(l => (
                    <button key={l.key}
                      style={{ ...s.langItem, background: lang === l.key ? "rgba(220,38,38,0.15)" : "transparent", color: lang === l.key ? "#ef4444" : "#94a3b8" }}
                      onClick={() => { setLang(l.key); setShowLangMenu(false); }}>
                      {l.flag} {l.key.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button style={s.burgerBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        ) : (
          /* Nav desktop */
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ position:"relative" }}>
              <button style={s.langBtn} onClick={() => setShowLangMenu(!showLangMenu)}>
                {LANGS.find(l => l.key === lang)?.flag} {lang.toUpperCase()}
              </button>
              {showLangMenu && (
                <div style={s.langMenu}>
                  {LANGS.map(l => (
                    <button key={l.key}
                      style={{ ...s.langItem, background: lang === l.key ? "rgba(220,38,38,0.15)" : "transparent", color: lang === l.key ? "#ef4444" : "#94a3b8" }}
                      onClick={() => { setLang(l.key); setShowLangMenu(false); }}>
                      {l.flag} {l.key.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button style={s.navLogin} onClick={openLogin}>{l("login")}</button>
            <button style={s.navCta} onClick={openApp}>{l("tryFree")}</button>
          </div>
        )}
      </nav>

      {/* Menu mobile déroulant */}
      {isMobile && mobileMenuOpen && (
        <div style={s.mobileMenu}>
          <button style={s.mobileMenuItem} onClick={() => { openLogin(); setMobileMenuOpen(false); }}>
            {l("login")}
          </button>
          <button style={{ ...s.mobileMenuItem, ...s.mobileMenuCta }} onClick={() => { openApp(); setMobileMenuOpen(false); }}>
            {l("tryFree")}
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.heroLeft}>
          <div style={s.badge}>{l("badge")}</div>
          <h1 style={s.headline}>
            {l("headline1")}<br/>
            {l("headline2")}<br/>
            <span style={s.accent}>{l("headline3")}</span>
          </h1>
          <p style={s.desc}>{l("description")}</p>
          <div style={{ display:"flex", gap:12, marginTop:32, flexWrap:"wrap" }}>
            <button style={s.ctaLarge} onClick={openApp}>{l("startFree")}</button>
            <button style={s.ctaOutline} onClick={openLogin}>{l("login")}</button>
          </div>
          {/* Social proof */}
          <div style={s.proof}>
            {[
              [l("proof1num"), l("proof1label")],
              [l("proof2num"), l("proof2label")],
              [l("proof3num"), l("proof3label")],
            ].map(([num, label], i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={s.proofDivider}/>}
                <div style={s.proofItem}>
                  <span style={s.proofNum}>{num}</span>
                  <span style={s.proofLabel}>{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card droite — masquée sur mobile, visible sur tablette+ */}
        {!isMobile && (
          <div style={s.heroRight}>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <span style={s.cardBadge}>LIVE PLATFORM</span>
                <span style={s.cardDot}/>
              </div>
              {[
                { icon:"✍️", label:"AI Writing Engine", desc:"Generate authority content in seconds" },
                { icon:"🧠", label:"Brand Memory", desc:"Train AI on your brand identity" },
                { icon:"📅", label:"Scheduler", desc:"Plan and automate your publishing" },
                { icon:"📊", label:"Analytics", desc:"Measure and optimize performance" },
                { icon:"🚀", label:"Autopost", desc:"Multi-platform distribution" },
                { icon:"🌍", label:"Trends", desc:"Real-time viral topics from 8 sources" },
              ].map((f,i) => (
                <div key={i} style={s.feature}>
                  <span style={s.featureIcon}>{f.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={s.featureLabel}>{f.label}</div>
                    <div style={s.featureDesc}>{f.desc}</div>
                  </div>
                  <span style={s.featureArrow}>▸</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── FEATURES ── */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>{l("featuresTitle")}</h2>
          <p style={s.sectionSubtitle}>{l("featuresSubtitle")}</p>
        </div>
        <div style={s.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} style={s.featureCard}>
              <div style={s.featureCardIcon}>{f.icon}</div>
              <h3 style={s.featureCardTitle}>{l(f.titleKey)}</h3>
              <p style={s.featureCardDesc}>{l(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ ...s.section, background:"rgba(255,255,255,0.01)" }}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>{l("testimonialsTitle")}</h2>
        </div>
        <div style={s.testimonialsGrid}>
          {testimonials.map((t, i) => (
            <div key={i} style={s.testimonialCard}>
              <div style={{ color:"#ef4444", fontSize:16, marginBottom:12 }}>{"★".repeat(t.stars)}</div>
              <p style={s.testimonialText}>"{l(t.textKey)}"</p>
              <div style={s.testimonialAuthor}>
                <div style={s.testimonialAvatar}>{l(t.nameKey).charAt(0)}</div>
                <div>
                  <div style={s.testimonialName}>{l(t.nameKey)}</div>
                  <div style={s.testimonialRole}>{l(t.roleKey)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>{l("pricingTitle")}</h2>
          <p style={s.sectionSubtitle}>{l("pricingSubtitle")}</p>
        </div>
        <div style={s.pricingGrid}>
          {[
            { name:"Free", price:"€0", period:"/mo", color:"#64748b", features:["5 AI generations/mo", "1 project", "3 analyses"], cta: l("startFree"), action: openApp },
            { name:"Pro", price:"€19", period:"/mo", color:"#ef4444", features:["100 AI generations/mo", "10 projects", "Unlimited analyses", "Brand Memory", "Export"], cta:"Start Pro →", action: openPricing, popular: true },
            { name:"Business", price:"€49", period:"/mo", color:"#f97316", features:["Unlimited everything", "Priority support", "Team mode", "All features"], cta:"Start Business →", action: openPricing },
          ].map((plan, i) => (
            <div key={i} style={{
              ...s.pricingCard,
              borderColor: plan.color,
              transform: plan.popular && !isMobile ? "scale(1.04)" : "scale(1)",
              zIndex: plan.popular ? 2 : 1,
            }}>
              {plan.popular && <div style={{ ...s.popularBadge, background: plan.color }}>MOST POPULAR</div>}
              <div style={{ color: plan.color, fontWeight:800, fontSize:13, letterSpacing:"1.5px", marginBottom:8 }}>{plan.name}</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:16 }}>
                <span style={{ fontSize: isMobile ? 34 : 42, fontWeight:900, color:"#fff" }}>{plan.price}</span>
                <span style={{ color:"#475569", marginBottom:8 }}>{plan.period}</span>
              </div>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:16, marginBottom:20 }}>
                {plan.features.map((f,j) => (
                  <div key={j} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ color: plan.color, fontWeight:800 }}>✓</span>
                    <span style={{ color:"#94a3b8", fontSize:13 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                style={{ ...s.pricingCta, background: plan.popular ? `linear-gradient(135deg,${plan.color},#991b1b)` : "transparent", border: plan.popular ? "none" : `1px solid ${plan.color}`, color: "#fff" }}
                onClick={plan.action}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={s.ctaSection}>
        <div style={s.ctaGlow}/>
        <h2 style={s.ctaTitle}>{l("ctaTitle")}</h2>
        <p style={s.ctaSubtitle}>{l("ctaSubtitle")}</p>
        <button style={s.ctaFinal} onClick={openApp}>{l("ctaBtn")}</button>
        <div style={{ marginTop:16, color:"#334155", fontSize:13 }}>
          {l("ctaLogin")} <button style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontWeight:700 }} onClick={openLogin}>{l("login")}</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.brand}>
          <img src={logo} alt="logo" style={{ width:32, height:32, objectFit:"contain" }} />
          <span style={{ ...s.brandName, fontSize:16 }}>GrowthPILOT</span>
        </div>
        <p style={s.footerTagline}>{l("footerTagline")}</p>
        <p style={s.footerRights}>{l("footerRights")}</p>
      </footer>

    </div>
  );
}

/* ══════════════════════════════════════════════════════
   makeStyles — retourne les styles selon le breakpoint
══════════════════════════════════════════════════════ */
function makeStyles(isMobile, isTablet) {
  const px = isMobile ? 20 : isTablet ? 32 : 48;
  const sectionPy = isMobile ? 48 : 80;

  return {
    page: {
      minHeight:"100vh",
      background:"linear-gradient(135deg,#020617 0%,#0f172a 50%,#1a0a0a 100%)",
      color:"white",
      fontFamily:"Arial, sans-serif",
      overflowX:"hidden",
    },

    /* NAV */
    nav: {
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding: isMobile ? "14px 20px" : "20px 48px",
      position:"sticky", top:0, zIndex:100,
      background:"rgba(2,6,23,0.95)", backdropFilter:"blur(12px)",
      borderBottom:"1px solid rgba(220,38,38,0.1)",
    },
    brand: { display:"flex", alignItems:"center", gap: isMobile ? 8 : 12 },
    navLogo: { width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, objectFit:"contain" },
    brandName: {
      fontSize: isMobile ? 16 : 20,
      fontWeight:900, fontStyle:"italic",
      color:"#000", WebkitTextStroke:"1px white",
      textShadow:"1px 1px 0 #ef4444",
    },
    langBtn: {
      padding: isMobile ? "8px 10px" : "8px 14px",
      background:"rgba(255,255,255,0.05)",
      border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:8, color:"#94a3b8", cursor:"pointer",
      fontSize:12, fontWeight:700,
    },
    langMenu: {
      position:"absolute", top:44, right:0,
      background:"#1a2235", border:"1px solid rgba(220,38,38,0.3)",
      borderRadius:12, overflow:"hidden", zIndex:99999,
      minWidth:130, boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
    },
    langItem: {
      width:"100%", padding:"10px 16px", border:"none",
      cursor:"pointer", textAlign:"left", fontSize:13, fontWeight:600,
    },
    navLogin: {
      padding:"10px 20px", background:"transparent",
      border:"1px solid rgba(220,38,38,0.3)", borderRadius:8,
      color:"#ef4444", cursor:"pointer", fontWeight:600, fontSize:13,
    },
    navCta: {
      padding:"10px 20px",
      background:"linear-gradient(135deg,#dc2626,#991b1b)",
      border:"none", borderRadius:8, color:"white",
      fontWeight:700, cursor:"pointer", fontSize:13,
      boxShadow:"0 4px 16px rgba(220,38,38,0.35)",
    },
    burgerBtn: {
      padding:"8px 12px", background:"transparent",
      border:"1px solid rgba(220,38,38,0.3)", borderRadius:8,
      color:"#ef4444", cursor:"pointer", fontSize:18, fontWeight:700,
    },

    /* MOBILE MENU */
    mobileMenu: {
      background:"rgba(2,6,23,0.98)", borderBottom:"1px solid rgba(220,38,38,0.2)",
      padding:"16px 20px", display:"flex", flexDirection:"column", gap:8,
      position:"sticky", top: isMobile ? 60 : 80, zIndex:99,
    },
    mobileMenuItem: {
      width:"100%", padding:"14px 20px", background:"transparent",
      border:"1px solid rgba(220,38,38,0.25)", borderRadius:10,
      color:"#ef4444", cursor:"pointer", fontWeight:700, fontSize:15, textAlign:"center",
    },
    mobileMenuCta: {
      background:"linear-gradient(135deg,#dc2626,#991b1b)",
      border:"none", color:"white",
      boxShadow:"0 4px 16px rgba(220,38,38,0.4)",
    },

    /* HERO */
    hero: {
      display: isMobile ? "flex" : "grid",
      flexDirection: isMobile ? "column" : undefined,
      gridTemplateColumns: isTablet ? "1fr" : "1.2fr 1fr",
      gap: isMobile ? 32 : 48,
      alignItems:"center",
      padding: `${isMobile ? 48 : 80}px ${px}px`,
      minHeight: isMobile ? "auto" : "calc(100vh - 80px)",
    },
    heroLeft: { display:"flex", flexDirection:"column" },
    heroRight: { display:"flex", alignItems:"center", justifyContent:"center" },

    badge: {
      display:"inline-flex", alignItems:"center",
      background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.3)",
      borderRadius:20, padding:"6px 16px",
      fontSize:11, fontWeight:700, color:"#ef4444", letterSpacing:"1.5px",
      marginBottom:24, width:"fit-content",
    },
    headline: {
      fontSize: isMobile ? 34 : isTablet ? 42 : 52,
      fontWeight:900, lineHeight:1.1, margin:"0 0 20px",
    },
    accent: { color:"#ef4444" },
    desc: {
      fontSize: isMobile ? 15 : 17,
      color:"#64748b", lineHeight:1.7,
      maxWidth: isMobile ? "100%" : 480,
      marginTop:8,
    },
    ctaLarge: {
      padding: isMobile ? "16px 28px" : "18px 36px",
      background:"linear-gradient(135deg,#dc2626,#991b1b)",
      border:"none", borderRadius:12, color:"white",
      fontWeight:800, fontSize: isMobile ? 15 : 16,
      cursor:"pointer", letterSpacing:"1px",
      boxShadow:"0 8px 32px rgba(220,38,38,0.4)",
      flex: isMobile ? 1 : "unset",
    },
    ctaOutline: {
      padding: isMobile ? "16px 28px" : "18px 36px",
      background:"transparent", border:"1px solid rgba(220,38,38,0.4)",
      borderRadius:12, color:"#ef4444",
      fontWeight:700, fontSize: isMobile ? 15 : 16,
      cursor:"pointer",
      flex: isMobile ? 1 : "unset",
    },
    proof: {
      display:"flex", alignItems:"center",
      gap: isMobile ? 16 : 24,
      marginTop:40, paddingTop:32,
      borderTop:"1px solid rgba(255,255,255,0.06)",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    proofItem: { display:"flex", flexDirection:"column", gap:4 },
    proofNum: { fontSize: isMobile ? 22 : 28, fontWeight:900, color:"#ef4444" },
    proofLabel: { fontSize:12, color:"#475569" },
    proofDivider: { width:1, height:36, background:"rgba(255,255,255,0.08)", flexShrink:0 },

    /* CARD HERO */
    card: {
      background:"linear-gradient(145deg,#1a2235,#111827)",
      border:"1px solid rgba(220,38,38,0.2)", borderLeft:"3px solid #ef4444",
      borderRadius:16, padding:"24px 20px", width:"100%",
      boxShadow:"0 20px 60px rgba(220,38,38,0.1)",
    },
    cardHeader: {
      display:"flex", justifyContent:"space-between",
      alignItems:"center", marginBottom:20,
    },
    cardBadge: { color:"#ef4444", fontSize:11, fontWeight:700, letterSpacing:"1.5px" },
    cardDot: { width:8, height:8, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e" },
    feature: {
      display:"flex", alignItems:"center", gap:12,
      padding:"10px 0", borderBottom:"1px solid rgba(220,38,38,0.06)",
    },
    featureIcon: { fontSize:18, width:32, textAlign:"center" },
    featureLabel: { fontSize:13, fontWeight:700, color:"#fff" },
    featureDesc: { fontSize:11, color:"#475569", marginTop:2 },
    featureArrow: { marginLeft:"auto", color:"#ef4444", fontSize:12 },

    /* SECTIONS */
    section: { padding:`${sectionPy}px ${px}px` },
    sectionHeader: { textAlign:"center", marginBottom: isMobile ? 32 : 56 },
    sectionTitle: { fontSize: isMobile ? 26 : 36, fontWeight:900, margin:"0 0 16px" },
    sectionSubtitle: { fontSize: isMobile ? 14 : 16, color:"#475569", margin:0 },

    featuresGrid: {
      display:"grid",
      gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)",
      gap: isMobile ? 16 : 24,
      maxWidth:1000, margin:"0 auto",
    },
    featureCard: {
      background:"linear-gradient(145deg,#111827,#0f172a)",
      border:"1px solid rgba(220,38,38,0.1)",
      borderRadius:16, padding: isMobile ? 20 : 28,
      transition:"border-color 0.2s",
    },
    featureCardIcon: { fontSize:32, marginBottom:16 },
    featureCardTitle: { fontSize: isMobile ? 15 : 16, fontWeight:800, margin:"0 0 10px", color:"#fff" },
    featureCardDesc: { fontSize:13, color:"#475569", lineHeight:1.6, margin:0 },

    testimonialsGrid: {
      display:"grid",
      gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)",
      gap: isMobile ? 16 : 24,
      maxWidth:1000, margin:"0 auto",
    },
    testimonialCard: {
      background:"linear-gradient(145deg,#111827,#0f172a)",
      border:"1px solid rgba(220,38,38,0.1)",
      borderRadius:16, padding: isMobile ? 20 : 28,
    },
    testimonialText: { color:"#94a3b8", fontSize:14, lineHeight:1.7, margin:"0 0 20px", fontStyle:"italic" },
    testimonialAuthor: { display:"flex", alignItems:"center", gap:12 },
    testimonialAvatar: {
      width:40, height:40, borderRadius:"50%",
      background:"linear-gradient(135deg,#dc2626,#991b1b)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:16, fontWeight:800, color:"#fff", flexShrink:0,
    },
    testimonialName: { fontSize:14, fontWeight:700, color:"#fff" },
    testimonialRole: { fontSize:12, color:"#475569" },

    pricingGrid: {
      display:"grid",
      gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)",
      gap: isMobile ? 16 : 24,
      maxWidth:900, margin:"0 auto", alignItems:"center",
    },
    pricingCard: {
      background:"linear-gradient(145deg,#111827,#0f172a)",
      border:"1px solid", borderRadius:20,
      padding: isMobile ? "24px 18px" : "28px 24px",
      position:"relative",
    },
    popularBadge: {
      position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
      padding:"4px 14px", borderRadius:20,
      fontSize:10, fontWeight:800, color:"#fff", letterSpacing:"1px", whiteSpace:"nowrap",
    },
    pricingCta: { width:"100%", padding:14, borderRadius:12, fontWeight:800, fontSize:14, cursor:"pointer" },

    /* CTA FINAL */
    ctaSection: {
      padding: `${isMobile ? 64 : 100}px ${px}px`,
      textAlign:"center", position:"relative", overflow:"hidden",
    },
    ctaGlow: {
      position:"absolute", top:"50%", left:"50%",
      transform:"translate(-50%,-50%)",
      width: isMobile ? 300 : 600, height: isMobile ? 300 : 600,
      background:"radial-gradient(circle,rgba(220,38,38,0.08) 0%,transparent 70%)",
      pointerEvents:"none",
    },
    ctaTitle: { fontSize: isMobile ? 28 : 44, fontWeight:900, margin:"0 0 16px", position:"relative" },
    ctaSubtitle: { fontSize: isMobile ? 14 : 16, color:"#475569", margin:"0 0 40px", position:"relative" },
    ctaFinal: {
      padding: isMobile ? "16px 32px" : "20px 48px",
      background:"linear-gradient(135deg,#dc2626,#991b1b)",
      border:"none", borderRadius:16, color:"white",
      fontWeight:900, fontSize: isMobile ? 16 : 18,
      cursor:"pointer", letterSpacing:"1px",
      boxShadow:"0 8px 40px rgba(220,38,38,0.5)", position:"relative",
      width: isMobile ? "100%" : "auto",
    },

    /* FOOTER */
    footer: {
      padding: `40px ${px}px`,
      borderTop:"1px solid rgba(255,255,255,0.05)",
      textAlign:"center", display:"flex", flexDirection:"column",
      alignItems:"center", gap:12,
    },
    footerTagline: { color:"#334155", fontSize:13, margin:0 },
    footerRights: { color:"#1e293b", fontSize:12, margin:0 },
  };
}
