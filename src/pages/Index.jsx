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

/* ── SEO Meta tags injection ─────────────────────────────────────────────────*/
function useSEO(lang) {
  useEffect(() => {
    const SEO = {
      en: {
        title: "GrowthPILOT — AI LinkedIn Content OS | Generate, Schedule & Publish",
        desc:  "GrowthPILOT is the AI-powered LinkedIn content platform. Generate viral posts, repurpose content in 3 formats, schedule & publish to LinkedIn, X, Threads and Instagram. Free to start.",
        keywords: "LinkedIn AI writer, LinkedIn content generator, AI social media tool, LinkedIn scheduler, content repurposing, viral LinkedIn posts, SaaS content tool",
      },
      fr: {
        title: "GrowthPILOT — IA pour LinkedIn | Générez, Planifiez & Publiez",
        desc:  "GrowthPILOT est la plateforme IA pour créer du contenu LinkedIn viral. Générez des posts, repurposez en 3 formats, planifiez et publiez sur LinkedIn, X, Threads et Instagram.",
        keywords: "IA LinkedIn, générateur contenu LinkedIn, outil réseaux sociaux IA, planificateur LinkedIn, repurposing contenu",
      },
      es: {
        title: "GrowthPILOT — IA para LinkedIn | Genera, Planifica y Publica",
        desc:  "GrowthPILOT es la plataforma IA para crear contenido viral en LinkedIn. Genera posts, reutiliza en 3 formatos, planifica y publica en LinkedIn, X, Threads e Instagram.",
        keywords: "IA LinkedIn, generador contenido LinkedIn, herramienta redes sociales IA, planificador LinkedIn",
      },
      de: {
        title: "GrowthPILOT — KI für LinkedIn | Erstellen, Planen & Veröffentlichen",
        desc:  "GrowthPILOT ist die KI-Plattform für viralen LinkedIn-Content. Erstelle Posts, repurpose in 3 Formate, plane und veröffentliche auf LinkedIn, X, Threads und Instagram.",
        keywords: "KI LinkedIn, LinkedIn Content Generator, Social Media KI Tool, LinkedIn Scheduler",
      },
      it: {
        title: "GrowthPILOT — IA per LinkedIn | Genera, Pianifica e Pubblica",
        desc:  "GrowthPILOT è la piattaforma IA per creare contenuti virali su LinkedIn. Genera post, riutilizza in 3 formati, pianifica e pubblica su LinkedIn, X, Threads e Instagram.",
        keywords: "IA LinkedIn, generatore contenuti LinkedIn, strumento social media IA, pianificatore LinkedIn",
      },
      pt: {
        title: "GrowthPILOT — IA para LinkedIn | Gere, Agende e Publique",
        desc:  "GrowthPILOT é a plataforma IA para criar conteúdo viral no LinkedIn. Gere posts, reutilize em 3 formatos, agende e publique no LinkedIn, X, Threads e Instagram.",
        keywords: "IA LinkedIn, gerador conteúdo LinkedIn, ferramenta redes sociais IA, agendador LinkedIn",
      },
    };

    const s = SEO[lang] || SEO.en;

    // Title
    document.title = s.title;

    // Meta helpers
    const setMeta = (name, content, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        prop ? el.setAttribute("property", name) : el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Base SEO
    setMeta("description",        s.desc);
    setMeta("keywords",           s.keywords);
    setMeta("robots",             "index, follow");
    setMeta("author",             "GrowthPILOT");
    setMeta("viewport",           "width=device-width, initial-scale=1.0");

    // Open Graph
    setMeta("og:type",            "website",                       true);
    setMeta("og:url",             "https://www.aigrowthpilot.app", true);
    setMeta("og:title",           s.title,                         true);
    setMeta("og:description",     s.desc,                          true);
    setMeta("og:image",           "https://www.aigrowthpilot.app/og-image.png", true);
    setMeta("og:image:width",     "1200",                          true);
    setMeta("og:image:height",    "630",                           true);
    setMeta("og:site_name",       "GrowthPILOT",                   true);
    setMeta("og:locale",          lang,                            true);

    // Twitter Card
    setMeta("twitter:card",        "summary_large_image");
    setMeta("twitter:site",        "@growthpilot");
    setMeta("twitter:title",       s.title);
    setMeta("twitter:description", s.desc);
    setMeta("twitter:image",       "https://www.aigrowthpilot.app/og-image.png");

    // Canonical
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://www.aigrowthpilot.app");

    // hreflang
    const hreflangs = { en:"en", fr:"fr", es:"es", de:"de", it:"it", pt:"pt" };
    Object.entries(hreflangs).forEach(([l, hl]) => {
      let link = document.querySelector(`link[hreflang="${hl}"]`);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "alternate");
        link.setAttribute("hreflang", hl);
        document.head.appendChild(link);
      }
      link.setAttribute("href", `https://www.aigrowthpilot.app?lang=${l}`);
    });

    // Schema.org JSON-LD
    const schemaId = "gp-schema-jsonld";
    let schemaEl = document.getElementById(schemaId);
    if (!schemaEl) {
      schemaEl = document.createElement("script");
      schemaEl.id = schemaId;
      schemaEl.type = "application/ld+json";
      document.head.appendChild(schemaEl);
    }
    schemaEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "GrowthPILOT",
      "url": "https://www.aigrowthpilot.app",
      "description": s.desc,
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": [
        { "@type":"Offer", "price":"0", "priceCurrency":"EUR", "name":"Free Plan" },
        { "@type":"Offer", "price":"19", "priceCurrency":"EUR", "name":"Pro Plan", "billingIncrement":"1", "priceSpecification": { "@type":"UnitPriceSpecification", "price":"19", "priceCurrency":"EUR", "unitCode":"MON" } },
        { "@type":"Offer", "price":"49", "priceCurrency":"EUR", "name":"Business Plan" },
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "127",
      },
      "author": { "@type":"Organization", "name":"GrowthPILOT", "url":"https://www.aigrowthpilot.app" },
    });

  }, [lang]);
}

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
  const [lang, setLang]               = useState(() => localStorage.getItem("gp_lang") || "en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);

  // Sync avec gp_lang
  const handleSetLang = (l) => {
    setLang(l);
    localStorage.setItem("gp_lang", l);
  };

  // Inject SEO
  useSEO(lang);

  // Scroll effect sur la nav
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const width    = useWindowWidth();
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

  const s = makeStyles(isMobile, isTablet, scrolled);

  return (
    <div style={s.page}>

      {/* ── NAV ── */}
      <nav style={s.nav} role="navigation" aria-label="Main navigation">
        <div style={s.brand}>
          <img src={logo} alt="GrowthPILOT logo" style={s.navLogo} width="40" height="40" loading="eager" />
          <span style={s.brandName}>GrowthPILOT</span>
        </div>

        {isMobile ? (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ position:"relative" }}>
              <button style={s.langBtn} onClick={() => setShowLangMenu(!showLangMenu)} aria-label="Select language">
                {LANGS.find(lx => lx.key === lang)?.flag}
              </button>
              {showLangMenu && (
                <div style={s.langMenu} role="menu">
                  {LANGS.map(lx => (
                    <button key={lx.key} role="menuitem"
                      style={{ ...s.langItem, background: lang === lx.key ? "rgba(220,38,38,0.15)" : "transparent", color: lang === lx.key ? "#ef4444" : "#94a3b8" }}
                      onClick={() => { handleSetLang(lx.key); setShowLangMenu(false); }}>
                      {lx.flag} {lx.key.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button style={s.burgerBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ position:"relative" }}>
              <button style={s.langBtn} onClick={() => setShowLangMenu(!showLangMenu)} aria-label="Select language">
                {LANGS.find(lx => lx.key === lang)?.flag} {lang.toUpperCase()}
              </button>
              {showLangMenu && (
                <div style={s.langMenu} role="menu">
                  {LANGS.map(lx => (
                    <button key={lx.key} role="menuitem"
                      style={{ ...s.langItem, background: lang === lx.key ? "rgba(220,38,38,0.15)" : "transparent", color: lang === lx.key ? "#ef4444" : "#94a3b8" }}
                      onClick={() => { handleSetLang(lx.key); setShowLangMenu(false); }}>
                      {lx.flag} {lx.key.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button style={s.navLogin} onClick={openLogin}>{l("login")}</button>
            <button style={s.navCta}   onClick={openApp}>{l("tryFree")}</button>
          </div>
        )}
      </nav>

      {/* Menu mobile */}
      {isMobile && mobileMenuOpen && (
        <div style={s.mobileMenu} role="menu">
          <button style={s.mobileMenuItem} onClick={() => { openLogin(); setMobileMenuOpen(false); }}>{l("login")}</button>
          <button style={{ ...s.mobileMenuItem, ...s.mobileMenuCta }} onClick={() => { openApp(); setMobileMenuOpen(false); }}>{l("tryFree")}</button>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={s.hero} aria-label="Hero">
        <div style={s.heroLeft}>
          <div style={s.badge} aria-label="Badge">{l("badge")}</div>
          <h1 style={s.headline}>
            {l("headline1")}<br/>
            {l("headline2")}<br/>
            <span style={s.accent}>{l("headline3")}</span>
          </h1>
          <p style={s.desc}>{l("description")}</p>
          <div style={{ display:"flex", gap:12, marginTop:32, flexWrap:"wrap" }}>
            <button style={s.ctaLarge}   onClick={openApp}>{l("startFree")}</button>
            <button style={s.ctaOutline} onClick={openLogin}>{l("login")}</button>
          </div>

          {/* Social proof */}
          <div style={s.proof} aria-label="Social proof">
            {[
              [l("proof1num"), l("proof1label")],
              [l("proof2num"), l("proof2label")],
              [l("proof3num"), l("proof3label")],
            ].map(([num, label], i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={s.proofDivider} aria-hidden="true"/>}
                <div style={s.proofItem}>
                  <span style={s.proofNum}>{num}</span>
                  <span style={s.proofLabel}>{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Intégrations badge */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:24, flexWrap:"wrap" }}>
            <span style={{ color:"#334155", fontSize:11, fontWeight:700, letterSpacing:"1px" }}>WORKS WITH</span>
            {["in","𝕏","🧵","📸"].map((icon,i) => (
              <div key={i} style={{ width:30, height:30, borderRadius:6, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"#fff" }}>{icon}</div>
            ))}
          </div>
        </div>

        {/* Card droite */}
        {!isMobile && (
          <div style={s.heroRight}>
            <div style={s.card} role="complementary" aria-label="Platform features">
              <div style={s.cardHeader}>
                <span style={s.cardBadge}>LIVE PLATFORM</span>
                <span style={s.cardDot} aria-label="Active"/>
              </div>
              {[
                { icon:"✍️", label:"AI Writing Engine",   desc:"Generate authority content in seconds" },
                { icon:"🧠", label:"Brand Memory",        desc:"Train AI on your brand identity" },
                { icon:"📅", label:"Scheduler",           desc:"Plan and automate your publishing" },
                { icon:"📊", label:"Analytics",           desc:"Measure and optimize performance" },
                { icon:"🚀", label:"Autopost",            desc:"Multi-platform distribution" },
                { icon:"🌍", label:"Trends",              desc:"Real-time viral topics from 12 sources" },
              ].map((f,i) => (
                <div key={i} style={s.feature}>
                  <span style={s.featureIcon} aria-hidden="true">{f.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={s.featureLabel}>{f.label}</div>
                    <div style={s.featureDesc}>{f.desc}</div>
                  </div>
                  <span style={s.featureArrow} aria-hidden="true">▸</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── FEATURES ── */}
      <section style={s.section} aria-label="Features">
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>{l("featuresTitle")}</h2>
          <p style={s.sectionSubtitle}>{l("featuresSubtitle")}</p>
        </div>
        <div style={s.featuresGrid}>
          {features.map((f, i) => (
            <article key={i} style={s.featureCard}>
              <div style={s.featureCardIcon} aria-hidden="true">{f.icon}</div>
              <h3 style={s.featureCardTitle}>{l(f.titleKey)}</h3>
              <p style={s.featureCardDesc}>{l(f.descKey)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ ...s.section, background:"rgba(255,255,255,0.01)" }} aria-label="Testimonials">
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>{l("testimonialsTitle")}</h2>
        </div>
        <div style={s.testimonialsGrid}>
          {testimonials.map((t, i) => (
            <article key={i} style={s.testimonialCard} itemScope itemType="https://schema.org/Review">
              <div style={{ color:"#ef4444", fontSize:16, marginBottom:12 }} aria-label={`${t.stars} stars`}>{"★".repeat(t.stars)}</div>
              <p style={s.testimonialText} itemProp="reviewBody">"{l(t.textKey)}"</p>
              <div style={s.testimonialAuthor} itemProp="author" itemScope itemType="https://schema.org/Person">
                <div style={s.testimonialAvatar} aria-hidden="true">{l(t.nameKey).charAt(0)}</div>
                <div>
                  <div style={s.testimonialName} itemProp="name">{l(t.nameKey)}</div>
                  <div style={s.testimonialRole}>{l(t.roleKey)}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section style={s.section} aria-label="Pricing">
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>{l("pricingTitle")}</h2>
          <p style={s.sectionSubtitle}>{l("pricingSubtitle")}</p>
        </div>
        <div style={s.pricingGrid}>
          {[
            { name:"Free",     price:"€0",  period:"/mo", color:"#64748b", features:["5 AI generations/mo","1 project","3 analyses"],                                    cta:l("startFree"), action:openApp },
            { name:"Pro",      price:"€19", period:"/mo", color:"#ef4444", features:["100 AI generations/mo","10 projects","Unlimited analyses","Brand Memory","Export"], cta:"Start Pro →",       action:openPricing, popular:true },
            { name:"Business", price:"€49", period:"/mo", color:"#f97316", features:["Unlimited everything","Priority support","Team mode","All features"],               cta:"Start Business →",  action:openPricing },
          ].map((plan, i) => (
            <article key={i} style={{ ...s.pricingCard, borderColor:plan.color, transform:plan.popular&&!isMobile?"scale(1.04)":"scale(1)", zIndex:plan.popular?2:1 }}
              itemScope itemType="https://schema.org/Offer">
              {plan.popular && <div style={{ ...s.popularBadge, background:plan.color }}>MOST POPULAR</div>}
              <div style={{ color:plan.color, fontWeight:800, fontSize:13, letterSpacing:"1.5px", marginBottom:8 }} itemProp="name">{plan.name}</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:16 }}>
                <span style={{ fontSize:isMobile?34:42, fontWeight:900, color:"#fff" }} itemProp="price">{plan.price}</span>
                <span style={{ color:"#475569", marginBottom:8 }}>{plan.period}</span>
              </div>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:16, marginBottom:20 }}>
                {plan.features.map((f,j) => (
                  <div key={j} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ color:plan.color, fontWeight:800 }} aria-hidden="true">✓</span>
                    <span style={{ color:"#94a3b8", fontSize:13 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button style={{ ...s.pricingCta, background:plan.popular?`linear-gradient(135deg,${plan.color},#991b1b)`:"transparent", border:plan.popular?"none":`1px solid ${plan.color}`, color:"#fff" }}
                onClick={plan.action} aria-label={`${plan.cta} - ${plan.name} plan`}>
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ── FAQ ── (nouveau — bon pour le SEO) */}
      <section style={{ ...s.section, maxWidth:720, margin:"0 auto" }} aria-label="FAQ" itemScope itemType="https://schema.org/FAQPage">
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>FAQ</h2>
        </div>
        {[
          { q:"What is GrowthPILOT?", a:"GrowthPILOT is an AI-powered content operating system for LinkedIn creators, founders and agencies. It helps you generate, schedule and publish content across LinkedIn, X, Threads and Instagram." },
          { q:"Is GrowthPILOT free?", a:"Yes, GrowthPILOT has a free plan that includes 5 AI generations per month. No credit card required." },
          { q:"Which platforms does GrowthPILOT support?", a:"GrowthPILOT supports LinkedIn, X (Twitter), Threads and Instagram Business for direct publishing." },
          { q:"Can I use GrowthPILOT for my agency?", a:"Yes! The Agency plan supports up to 50 client accounts and 20 team members, with a dedicated agency dashboard." },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom:16, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"16px 20px" }}
            itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 style={{ color:"#e2e8f0", fontSize:15, fontWeight:700, margin:"0 0 8px" }} itemProp="name">{item.q}</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p style={{ color:"#64748b", fontSize:13, lineHeight:1.7, margin:0 }} itemProp="text">{item.a}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── CTA FINAL ── */}
      <section style={s.ctaSection} aria-label="Call to action">
        <div style={s.ctaGlow} aria-hidden="true"/>
        <h2 style={s.ctaTitle}>{l("ctaTitle")}</h2>
        <p style={s.ctaSubtitle}>{l("ctaSubtitle")}</p>
        <button style={s.ctaFinal} onClick={openApp}>{l("ctaBtn")}</button>
        <div style={{ marginTop:16, color:"#334155", fontSize:13 }}>
          {l("ctaLogin")} <button style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontWeight:700 }} onClick={openLogin}>{l("login")}</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer} role="contentinfo">
        <div style={s.brand}>
          <img src={logo} alt="GrowthPILOT" style={{ width:32, height:32, objectFit:"contain" }} width="32" height="32" loading="lazy" />
          <span style={{ ...s.brandName, fontSize:16 }}>GrowthPILOT</span>
        </div>
        <p style={s.footerTagline}>{l("footerTagline")}</p>
        <div style={{ display:"flex", gap:16, marginTop:4 }}>
          <a href="/privacy" style={{ color:"#334155", fontSize:12, textDecoration:"none" }}>Privacy Policy</a>
          <span style={{ color:"#1e293b" }}>·</span>
          <a href="mailto:team@aigrowthpilot.app" style={{ color:"#334155", fontSize:12, textDecoration:"none" }}>Contact</a>
        </div>
        <p style={s.footerRights}>{l("footerRights")}</p>
      </footer>

    </div>
  );
}

/* ══ makeStyles ══════════════════════════════════════════════════════════════ */
function makeStyles(isMobile, isTablet, scrolled) {
  const px        = isMobile ? 20 : isTablet ? 32 : 48;
  const sectionPy = isMobile ? 48 : 80;

  return {
    page: {
      minHeight:"100vh",
      background:"linear-gradient(135deg,#020617 0%,#0f172a 50%,#1a0a0a 100%)",
      color:"white", fontFamily:"Arial, sans-serif", overflowX:"hidden",
    },
    nav: {
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding: isMobile ? "14px 20px" : "20px 48px",
      position:"sticky", top:0, zIndex:100,
      background: scrolled ? "rgba(2,6,23,0.98)" : "rgba(2,6,23,0.95)",
      backdropFilter:"blur(12px)",
      borderBottom: scrolled ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(220,38,38,0.1)",
      transition:"all 0.3s ease",
      boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
    },
    brand:     { display:"flex", alignItems:"center", gap: isMobile ? 8:12 },
    navLogo:   { width: isMobile ? 32:40, height: isMobile ? 32:40, objectFit:"contain" },
    brandName: { fontSize: isMobile ? 16:20, fontWeight:900, fontStyle:"italic", color:"#000", WebkitTextStroke:"1px white", textShadow:"1px 1px 0 #ef4444" },
    langBtn:   { padding: isMobile ? "8px 10px":"8px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#94a3b8", cursor:"pointer", fontSize:12, fontWeight:700 },
    langMenu:  { position:"absolute", top:44, right:0, background:"#1a2235", border:"1px solid rgba(220,38,38,0.3)", borderRadius:12, overflow:"hidden", zIndex:99999, minWidth:130, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" },
    langItem:  { width:"100%", padding:"10px 16px", border:"none", cursor:"pointer", textAlign:"left", fontSize:13, fontWeight:600 },
    navLogin:  { padding:"10px 20px", background:"transparent", border:"1px solid rgba(220,38,38,0.3)", borderRadius:8, color:"#ef4444", cursor:"pointer", fontWeight:600, fontSize:13 },
    navCta:    { padding:"10px 20px", background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:8, color:"white", fontWeight:700, cursor:"pointer", fontSize:13, boxShadow:"0 4px 16px rgba(220,38,38,0.35)" },
    burgerBtn: { padding:"8px 12px", background:"transparent", border:"1px solid rgba(220,38,38,0.3)", borderRadius:8, color:"#ef4444", cursor:"pointer", fontSize:18, fontWeight:700 },
    mobileMenu:    { background:"rgba(2,6,23,0.98)", borderBottom:"1px solid rgba(220,38,38,0.2)", padding:"16px 20px", display:"flex", flexDirection:"column", gap:8, position:"sticky", top: isMobile ? 60:80, zIndex:99 },
    mobileMenuItem:{ width:"100%", padding:"14px 20px", background:"transparent", border:"1px solid rgba(220,38,38,0.25)", borderRadius:10, color:"#ef4444", cursor:"pointer", fontWeight:700, fontSize:15, textAlign:"center" },
    mobileMenuCta: { background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", color:"white", boxShadow:"0 4px 16px rgba(220,38,38,0.4)" },
    hero: {
      display: isMobile ? "flex":"grid", flexDirection: isMobile ? "column":undefined,
      gridTemplateColumns: isTablet ? "1fr":"1.2fr 1fr",
      gap: isMobile ? 32:48, alignItems:"center",
      padding:`${isMobile ? 48:80}px ${px}px`,
      minHeight: isMobile ? "auto":"calc(100vh - 80px)",
    },
    heroLeft:  { display:"flex", flexDirection:"column" },
    heroRight: { display:"flex", alignItems:"center", justifyContent:"center" },
    badge:     { display:"inline-flex", alignItems:"center", background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:20, padding:"6px 16px", fontSize:11, fontWeight:700, color:"#ef4444", letterSpacing:"1.5px", marginBottom:24, width:"fit-content" },
    headline:  { fontSize: isMobile ? 34: isTablet ? 42:52, fontWeight:900, lineHeight:1.1, margin:"0 0 20px" },
    accent:    { color:"#ef4444" },
    desc:      { fontSize: isMobile ? 15:17, color:"#64748b", lineHeight:1.7, maxWidth: isMobile ? "100%":480, marginTop:8 },
    ctaLarge:  { padding: isMobile ? "16px 28px":"18px 36px", background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:12, color:"white", fontWeight:800, fontSize: isMobile ? 15:16, cursor:"pointer", letterSpacing:"1px", boxShadow:"0 8px 32px rgba(220,38,38,0.4)", flex: isMobile ? 1:"unset" },
    ctaOutline:{ padding: isMobile ? "16px 28px":"18px 36px", background:"transparent", border:"1px solid rgba(220,38,38,0.4)", borderRadius:12, color:"#ef4444", fontWeight:700, fontSize: isMobile ? 15:16, cursor:"pointer", flex: isMobile ? 1:"unset" },
    proof:     { display:"flex", alignItems:"center", gap: isMobile ? 16:24, marginTop:40, paddingTop:32, borderTop:"1px solid rgba(255,255,255,0.06)", flexWrap: isMobile ? "wrap":"nowrap" },
    proofItem: { display:"flex", flexDirection:"column", gap:4 },
    proofNum:  { fontSize: isMobile ? 22:28, fontWeight:900, color:"#ef4444" },
    proofLabel:{ fontSize:12, color:"#475569" },
    proofDivider:{ width:1, height:36, background:"rgba(255,255,255,0.08)", flexShrink:0 },
    card:      { background:"linear-gradient(145deg,#1a2235,#111827)", border:"1px solid rgba(220,38,38,0.2)", borderLeft:"3px solid #ef4444", borderRadius:16, padding:"24px 20px", width:"100%", boxShadow:"0 20px 60px rgba(220,38,38,0.1)" },
    cardHeader:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 },
    cardBadge: { color:"#ef4444", fontSize:11, fontWeight:700, letterSpacing:"1.5px" },
    cardDot:   { width:8, height:8, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e" },
    feature:   { display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(220,38,38,0.06)" },
    featureIcon: { fontSize:18, width:32, textAlign:"center" },
    featureLabel:{ fontSize:13, fontWeight:700, color:"#fff" },
    featureDesc: { fontSize:11, color:"#475569", marginTop:2 },
    featureArrow:{ marginLeft:"auto", color:"#ef4444", fontSize:12 },
    section:   { padding:`${sectionPy}px ${px}px` },
    sectionHeader:{ textAlign:"center", marginBottom: isMobile ? 32:56 },
    sectionTitle: { fontSize: isMobile ? 26:36, fontWeight:900, margin:"0 0 16px" },
    sectionSubtitle:{ fontSize: isMobile ? 14:16, color:"#475569", margin:0 },
    featuresGrid:{ display:"grid", gridTemplateColumns: isMobile ? "1fr": isTablet ? "repeat(2,1fr)":"repeat(3,1fr)", gap: isMobile ? 16:24, maxWidth:1000, margin:"0 auto" },
    featureCard: { background:"linear-gradient(145deg,#111827,#0f172a)", border:"1px solid rgba(220,38,38,0.1)", borderRadius:16, padding: isMobile ? 20:28 },
    featureCardIcon: { fontSize:32, marginBottom:16 },
    featureCardTitle:{ fontSize: isMobile ? 15:16, fontWeight:800, margin:"0 0 10px", color:"#fff" },
    featureCardDesc: { fontSize:13, color:"#475569", lineHeight:1.6, margin:0 },
    testimonialsGrid:{ display:"grid", gridTemplateColumns: isMobile ? "1fr": isTablet ? "repeat(2,1fr)":"repeat(3,1fr)", gap: isMobile ? 16:24, maxWidth:1000, margin:"0 auto" },
    testimonialCard: { background:"linear-gradient(145deg,#111827,#0f172a)", border:"1px solid rgba(220,38,38,0.1)", borderRadius:16, padding: isMobile ? 20:28 },
    testimonialText: { color:"#94a3b8", fontSize:14, lineHeight:1.7, margin:"0 0 20px", fontStyle:"italic" },
    testimonialAuthor:{ display:"flex", alignItems:"center", gap:12 },
    testimonialAvatar:{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#dc2626,#991b1b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#fff", flexShrink:0 },
    testimonialName:  { fontSize:14, fontWeight:700, color:"#fff" },
    testimonialRole:  { fontSize:12, color:"#475569" },
    pricingGrid:{ display:"grid", gridTemplateColumns: isMobile ? "1fr": isTablet ? "repeat(2,1fr)":"repeat(3,1fr)", gap: isMobile ? 16:24, maxWidth:900, margin:"0 auto", alignItems:"center" },
    pricingCard:{ background:"linear-gradient(145deg,#111827,#0f172a)", border:"1px solid", borderRadius:20, padding: isMobile ? "24px 18px":"28px 24px", position:"relative" },
    popularBadge:{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", padding:"4px 14px", borderRadius:20, fontSize:10, fontWeight:800, color:"#fff", letterSpacing:"1px", whiteSpace:"nowrap" },
    pricingCta:{ width:"100%", padding:14, borderRadius:12, fontWeight:800, fontSize:14, cursor:"pointer" },
    ctaSection:{ padding:`${isMobile ? 64:100}px ${px}px`, textAlign:"center", position:"relative", overflow:"hidden" },
    ctaGlow:   { position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width: isMobile ? 300:600, height: isMobile ? 300:600, background:"radial-gradient(circle,rgba(220,38,38,0.08) 0%,transparent 70%)", pointerEvents:"none" },
    ctaTitle:  { fontSize: isMobile ? 28:44, fontWeight:900, margin:"0 0 16px", position:"relative" },
    ctaSubtitle:{ fontSize: isMobile ? 14:16, color:"#475569", margin:"0 0 40px", position:"relative" },
    ctaFinal:  { padding: isMobile ? "16px 32px":"20px 48px", background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:16, color:"white", fontWeight:900, fontSize: isMobile ? 16:18, cursor:"pointer", letterSpacing:"1px", boxShadow:"0 8px 40px rgba(220,38,38,0.5)", position:"relative", width: isMobile ? "100%":"auto" },
    footer:    { padding:`40px ${px}px`, borderTop:"1px solid rgba(255,255,255,0.05)", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 },
    footerTagline:{ color:"#334155", fontSize:13, margin:0 },
    footerRights: { color:"#1e293b", fontSize:12, margin:0 },
  };
}
