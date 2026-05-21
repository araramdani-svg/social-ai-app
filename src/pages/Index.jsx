import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import { t as tr, landing as ld } from "../translations.js";

/* ── GIFs produit ── */
import gifDashboard  from "../assets/gifs/dashboard.gif";
import gifCreator    from "../assets/gifs/creator.gif";
import gifAnalytics  from "../assets/gifs/analytics.gif";
import gifTrends     from "../assets/gifs/trends.gif";

const LANGS = [
  { key:"en", flag:"🇬🇧" },
  { key:"fr", flag:"🇫🇷" },
  { key:"es", flag:"🇪🇸" },
  { key:"de", flag:"🇩🇪" },
  { key:"it", flag:"🇮🇹" },
  { key:"pt", flag:"🇵🇹" },
];

/* ── Google Fonts inject ── */
function useGoogleFonts() {
  useEffect(() => {
    const id = "gp-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id   = id;
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ── SEO ── */
function useSEO(activeLang) {
  useEffect(() => {
    const SEO = {
      en: { title:"GrowthPILOT — The Only Multi-Platform AI Content OS", desc:"Generate, schedule & publish AI content to LinkedIn, X, Threads, Facebook & TikTok from one command center. Free to start.", keywords:"AI content platform, LinkedIn automation, social media AI, multi-platform publishing, content generator, brand memory, viral trends, SaaS marketing, founder content", locale:"en_US" },
      fr: { title:"GrowthPILOT — Le seul OS IA multi-plateformes pour créateurs", desc:"Générez, planifiez et publiez du contenu IA sur LinkedIn, X, Threads, Facebook et TikTok depuis un seul outil. Gratuit pour commencer.", keywords:"plateforme contenu IA, automatisation LinkedIn, IA réseaux sociaux, publication multi-plateforme, générateur contenu, mémoire de marque, tendances virales", locale:"fr_FR" },
      es: { title:"GrowthPILOT — El único OS de contenido IA multi-plataforma", desc:"Genera, programa y publica contenido IA en LinkedIn, X, Threads, Facebook y TikTok desde un centro de control. Gratis para empezar.", keywords:"plataforma contenido IA, automatización LinkedIn, IA redes sociales, publicación multiplataforma, generador contenido, memoria de marca", locale:"es_ES" },
      de: { title:"GrowthPILOT — Das einzige Multi-Plattform KI-Content-OS", desc:"Erstelle, plane und veröffentliche KI-Inhalte auf LinkedIn, X, Threads, Facebook und TikTok aus einer Zentrale. Kostenlos starten.", keywords:"KI Content Plattform, LinkedIn Automatisierung, Social Media KI, Multi-Plattform Publishing, Content Generator, Brand Memory", locale:"de_DE" },
      it: { title:"GrowthPILOT — L'unico OS IA multi-piattaforma per i creator", desc:"Genera, pianifica e pubblica contenuti IA su LinkedIn, X, Threads, Facebook e TikTok da un'unica piattaforma. Gratis per iniziare.", keywords:"piattaforma contenuti IA, automazione LinkedIn, IA social media, pubblicazione multi-piattaforma, generatore contenuti, brand memory", locale:"it_IT" },
      pt: { title:"GrowthPILOT — O único OS de conteúdo IA multi-plataforma", desc:"Gere, agende e publique conteúdo IA no LinkedIn, X, Threads, Facebook e TikTok a partir de um centro de controle. Grátis para começar.", keywords:"plataforma conteúdo IA, automação LinkedIn, IA redes sociais, publicação multiplataforma, gerador conteúdo, memória de marca", locale:"pt_BR" },
    };
    const s = SEO[activeLang] || SEO.en;
    document.title = s.title;
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const setOG = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    // Core SEO
    setMeta("description", s.desc);
    setMeta("keywords", s.keywords);
    setMeta("robots", "index, follow");
    // Open Graph
    setOG("og:title", s.title);
    setOG("og:description", s.desc);
    setOG("og:locale", s.locale);
    setOG("og:url", "https://www.aigrowthpilot.app/");
    setOG("og:image", "https://www.aigrowthpilot.app/og-image.png");
    // Twitter Card
    setMeta("twitter:title", s.title);
    setMeta("twitter:description", s.desc);
    // Hreflang canonical
    document.querySelectorAll("link[hreflang]").forEach(el => el.remove());
    Object.keys(SEO).forEach(lang => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = lang;
      link.href = `https://www.aigrowthpilot.app/?lang=${lang}`;
      document.head.appendChild(link);
    });
  }, [activeLang]);
}

/* ── Intersection observer hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/* ── Typewriter ── */
function Typewriter({ words, speed = 80, pause = 1800 }) {
  const [text, setText] = useState("");
  const [wIdx, setWIdx] = useState(0);
  const [cIdx, setCIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wIdx];
    const delay = deleting ? speed / 2 : cIdx === word.length ? pause : speed;
    const t = setTimeout(() => {
      if (!deleting && cIdx < word.length) { setText(word.slice(0, cIdx + 1)); setCIdx(c => c + 1); }
      else if (!deleting && cIdx === word.length) { setDeleting(true); }
      else if (deleting && cIdx > 0) { setText(word.slice(0, cIdx - 1)); setCIdx(c => c - 1); }
      else { setDeleting(false); setWIdx(i => (i + 1) % words.length); }
    }, delay);
    return () => clearTimeout(t);
  }, [text, wIdx, cIdx, deleting]);
  return <span>{text}<span style={{ opacity: Math.sin(Date.now() / 500) > 0 ? 1 : 0, color:"#ef4444" }}>|</span></span>;
}

/* ── Counter animation ── */
function Counter({ to, suffix = "", duration = 1500 }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView(0.3);
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── CSS injection ── */
function useStyles() {
  useEffect(() => {
    const id = "gp-landing-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes fadeUp   { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
      @keyframes scanline { 0%,100% { opacity:0.03; } 50% { opacity:0.07; } }
      @keyframes pulse    { 0%,100% { transform:scale(1); opacity:0.5; } 50% { transform:scale(1.05); opacity:0.8; } }
      @keyframes glow     { 0%,100% { box-shadow: 0 0 20px rgba(220,38,38,0.2); } 50% { box-shadow: 0 0 40px rgba(220,38,38,0.5), 0 0 80px rgba(220,38,38,0.1); } }
      @keyframes ticker   { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
      @keyframes gridMove { 0% { background-position:0 0; } 100% { background-position:40px 40px; } }
      @keyframes blink    { 0%,100% { opacity:1; } 50% { opacity:0; } }

      .gp-fade-up   { opacity:0; }
      .gp-fade-up.visible { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
      .gp-fade-in   { opacity:0; }
      .gp-fade-in.visible { animation: fadeIn 0.6s ease forwards; }

      .gp-btn-primary {
        padding: 16px 32px;
        background: linear-gradient(135deg,#dc2626,#991b1b);
        border: none; border-radius: 10px; color: #fff;
        font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px;
        cursor: pointer; letter-spacing: 0.5px;
        box-shadow: 0 4px 24px rgba(220,38,38,0.4);
        transition: all 0.2s ease; position: relative; overflow: hidden;
      }
      .gp-btn-primary::after {
        content:''; position:absolute; inset:0;
        background: linear-gradient(135deg,rgba(255,255,255,0.1),transparent);
        opacity:0; transition: opacity 0.2s;
      }
      .gp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(220,38,38,0.55); }
      .gp-btn-primary:hover::after { opacity:1; }

      .gp-btn-ghost {
        padding: 16px 32px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: #94a3b8;
        font-family: 'Syne', sans-serif; font-weight: 600; font-size: 15px;
        cursor: pointer; letter-spacing: 0.5px;
        transition: all 0.2s ease;
      }
      .gp-btn-ghost:hover { background:rgba(255,255,255,0.08); border-color:rgba(220,38,38,0.4); color:#fff; }

      .gp-feature-tab { cursor:pointer; transition:all 0.2s ease; }
      .gp-feature-tab:hover { opacity:1 !important; }

      .gp-pricing-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .gp-pricing-card:hover { transform: translateY(-4px); box-shadow: 0 24px 60px rgba(0,0,0,0.4) !important; }

      .gp-compare-row:hover td { background: rgba(220,38,38,0.04) !important; }

      .gp-platform-badge { transition: all 0.2s ease; }
      .gp-platform-badge:hover { transform:translateY(-3px); border-color:rgba(220,38,38,0.5) !important; }

      @media (max-width:768px) {
        .gp-hero-grid { grid-template-columns: 1fr !important; }
        .gp-features-tabs { flex-direction: column !important; }
        .gp-compare-table { font-size: 12px !important; }
        .gp-pricing-grid { grid-template-columns: 1fr !important; }
        .gp-nav-lang    { display: none !important; }
        .gp-nav-signin  { display: none !important; }
        .gp-nav-right   { gap: 6px !important; }
        .gp-hero-sub    { padding: 0 16px !important; }
        .gp-pricing-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
      }
      @media (max-width:480px) {
        .gp-nav-logo-text { display: none !important; }
        .gp-btn-primary   { font-size: 12px !important; padding: 8px 14px !important; }
        .gp-btn-ghost     { font-size: 12px !important; padding: 8px 10px !important; }
      }
    `;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);
}

/* ══ MAIN COMPONENT ══════════════════════════════════════════════════════════ */
export default function Index({ openApp, openLogin, openPricing, lang: propLang, setLang: propSetLang }) {
  const [lang, setLangState]        = useState(() => propLang || localStorage.getItem("gp_lang") || "en");
  const activeLang = propLang || lang;
  const l = ld[activeLang] || ld.en;
  const setLang = (l) => { setLangState(l); localStorage.setItem("gp_lang", l); if (propSetLang) propSetLang(l); };
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [yearly, setYearly]         = useState(false);
  const [activeTab, setActiveTab]   = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useGoogleFonts();
  useStyles();
  useSEO(activeLang);

  const handleLang = (l) => { setLang(l); localStorage.setItem("gp_lang", l); setShowLangMenu(false); };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ── animated sections ── */
  const [heroRef,     heroVisible]     = useInView(0.1);
  const [featRef,     featVisible]     = useInView(0.1);
  const [compareRef,  compareVisible]  = useInView(0.1);
  const [pricingRef,  pricingVisible]  = useInView(0.1);
  const [ctaRef,      ctaVisible]      = useInView(0.2);

  const PLATFORMS = [
    { icon:"in",  label:"LinkedIn",  color:"#0077b5" },
    { icon:"𝕏",   label:"X",         color:"#fff" },
    { icon:"🧵",  label:"Threads",   color:"#a855f7" },
    { icon:"📸",  label:"Instagram", color:"#e1306c" },
    { icon:"f",   label:"Facebook",  color:"#1877f2" },
    { icon:"🎵",  label:"TikTok",    color:"#ff0050" },
  ];

  const FEATURE_TABS = [
    { label:l.featTab0Label, icon:"✍️", gif:gifCreator,   desc:l.featTab0Desc },
    { label:l.featTab1Label, icon:"📊", gif:gifDashboard,  desc:l.featTab1Desc },
    { label:l.featTab2Label, icon:"🌍", gif:gifTrends,     desc:l.featTab2Desc },
    { label:l.featTab3Label, icon:"🔍", gif:gifAnalytics,  desc:l.featTab3Desc },
  ];

  const COMPARE = [
    { feature:l.compareFeatures[0],  gp:true,  taplio:false, supergrow:false, magicpost:false },
    { feature:l.compareFeatures[1],  gp:true,  taplio:true,  supergrow:true,  magicpost:true  },
    { feature:l.compareFeatures[2],  gp:true,  taplio:false, supergrow:false, magicpost:false },
    { feature:l.compareFeatures[3],  gp:true,  taplio:false, supergrow:false, magicpost:false },
    { feature:l.compareFeatures[4],  gp:true,  taplio:false, supergrow:false, magicpost:false },
    { feature:l.compareFeatures[5],  gp:true,  taplio:false, supergrow:false, magicpost:false },
    { feature:l.compareFeatures[6],  gp:true,  taplio:false, supergrow:false, magicpost:false },
    { feature:l.compareFeatures[7],  gp:true,  taplio:false, supergrow:true,  magicpost:false },
    { feature:l.compareFeatures[8],  gp:true,  taplio:false, supergrow:false, magicpost:false },
    { feature:l.compareFeatures[9],  gp:true,  taplio:false, supergrow:false, magicpost:false },
    { feature:l.compareFeatures[10], gp:true,  taplio:true,  supergrow:false, magicpost:false },
    { feature:l.compareFeatures[11], gp:"€19", taplio:"$69", supergrow:"$19", magicpost:"$27" },
  ];

  const PLANS = [
    { name:l.planFreeName||"Free",     price:0,  yearlyPrice:0,  color:"#475569", features:l.planFreeFeatures, cta:l.planFreeCta, action:openApp,     popular:false },
    { name:l.planProName||"Pro",       price:19, yearlyPrice:15, color:"#ef4444", features:l.planProFeatures,  cta:l.planProCta,  action:openPricing, popular:true  },
    { name:l.planBizName||"Business",  price:49, yearlyPrice:39, color:"#f97316", features:l.planBizFeatures,  cta:l.planBizCta,  action:openPricing, popular:false },
    { name:l.planAgyName||"Agency",    price:99, yearlyPrice:79, color:"#8b5cf6", features:l.planAgyFeatures,  cta:l.planAgyCta,  action:openPricing, popular:false },
  ];

  const px = typeof window !== "undefined" && window.innerWidth < 768 ? "20px" : "clamp(24px, 5vw, 80px)";

  /* ── ticker content ── */
  const TICKER = ["LinkedIn", "X (Twitter)", "Threads", "Instagram", "Facebook", "TikTok", "Viral Score", "Brand Memory", "Trend Radar", "Agency Mode", "30-day Planner", "Multi-format"];

  return (
    <div style={{ minHeight:"100vh", background:"#050a14", color:"#e2e8f0", fontFamily:"'Inter', sans-serif", overflowX:"hidden" }}>

      {/* ── GRID BACKGROUND ── */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:"linear-gradient(rgba(220,38,38,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.04) 1px, transparent 1px)",
        backgroundSize:"40px 40px",
        animation:"gridMove 8s linear infinite",
      }}/>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(220,38,38,0.06) 0%, transparent 70%)" }}/>

      {/* ── NAV ── */}
      <nav style={{
        position:"sticky", top:0, zIndex:100,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"0 clamp(20px,4vw,60px)", height:64,
        background: scrolled ? "rgba(5,10,20,0.97)" : "rgba(5,10,20,0.8)",
        backdropFilter:"blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(255,255,255,0.04)",
        transition:"all 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={logo} alt="GrowthPILOT" style={{ width:32, height:32, objectFit:"contain" }} />
          <span className="gp-nav-logo-text" style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:18, color:"#fff", letterSpacing:"-0.5px" }}>
            Growth<span style={{ color:"#ef4444" }}>PILOT</span>
          </span>
        </div>

        {/* Right */}
        <div className="gp-nav-right" style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Lang */}
          <div className="gp-nav-lang" style={{ position:"relative" }}>
            <button onClick={() => setShowLangMenu(!showLangMenu)}
              style={{ padding:"6px 10px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, color:"#64748b", cursor:"pointer", fontSize:12, fontFamily:"'DM Mono', monospace" }}>
              {LANGS.find(lx => lx.key === activeLang)?.flag} {activeLang.toUpperCase()}
            </button>
            {showLangMenu && (
              <div style={{ position:"absolute", top:40, right:0, background:"#0d1626", border:"1px solid rgba(220,38,38,0.2)", borderRadius:10, overflow:"hidden", zIndex:9999, minWidth:120, boxShadow:"0 20px 40px rgba(0,0,0,0.6)" }}>
                {LANGS.map(lx => (
                  <button key={lx.key} onClick={() => handleLang(lx.key)}
                    style={{ width:"100%", padding:"10px 14px", background: activeLang===lx.key ? "rgba(220,38,38,0.12)" : "transparent", border:"none", color: activeLang===lx.key ? "#ef4444":"#94a3b8", cursor:"pointer", textAlign:"left", fontSize:13, fontFamily:"'DM Mono', monospace" }}>
                    {lx.flag} {lx.key.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={openLogin} className="gp-btn-ghost gp-nav-signin" style={{ padding:"7px 12px", fontSize:12 }}>{l.navSignIn}</button>
          <button onClick={openApp} className="gp-btn-primary" style={{ padding:"7px 14px", fontSize:12, whiteSpace:"nowrap" }}>{l.navTryFree}</button>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <div style={{ background:"rgba(220,38,38,0.06)", borderBottom:"1px solid rgba(220,38,38,0.15)", overflow:"hidden", padding:"8px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", animation:"ticker 20s linear infinite", whiteSpace:"nowrap", width:"max-content" }}>
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} style={{ padding:"0 24px", fontFamily:"'DM Mono', monospace", fontSize:11, color:"#ef4444", letterSpacing:"2px", opacity:0.7 }}>
              {item} <span style={{ opacity:0.3 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ HERO ══ */}
      <section ref={heroRef} style={{ padding:"clamp(60px,8vh,120px) clamp(20px,5vw,80px) clamp(40px,6vh,80px)", position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto" }}>

        {/* Status badge */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:32 }}>
          <div className={`gp-fade-in ${heroVisible ? "visible":""}`}
            style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:20, padding:"6px 14px" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e", display:"inline-block", animation:"pulse 2s ease infinite" }}/>
            <span style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#22c55e", letterSpacing:"1.5px" }}>{l.liveBadge}</span>
          </div>
        </div>

        {/* Headline */}
        <div className={`gp-fade-up ${heroVisible ? "visible":""}`} style={{ textAlign:"center", marginBottom:24 }}>
          <h1 style={{
            fontFamily:"'Syne', sans-serif", fontWeight:800,
            fontSize:"clamp(40px, 6.5vw, 80px)",
            lineHeight:1.05, margin:0, letterSpacing:"-2px",
          }}>
            <span style={{ color:"#fff" }}>{l.heroTitle1} </span>
            <span style={{ color:"#ef4444", position:"relative" }}>
              multi-platform
              <svg style={{ position:"absolute", bottom:-8, left:0, width:"100%", height:4, overflow:"visible" }} viewBox="0 0 100 4" preserveAspectRatio="none">
                <path d="M0,2 Q25,0 50,2 Q75,4 100,2" stroke="#ef4444" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </svg>
            </span>
            <br/>
            <span style={{ color:"#fff" }}>{l.heroTitle3}</span>
          </h1>
        </div>

        {/* Typewriter sub */}
        <div className={`gp-fade-up ${heroVisible ? "visible":""}`} className="gp-hero-sub" style={{ textAlign:"center", marginBottom:40, animationDelay:"0.1s" }}>
          <p style={{ fontSize:"clamp(16px,2vw,20px)", color:"#64748b", margin:0, lineHeight:1.6 }}>
            {l.heroSub1}{" "}
            <span style={{ fontFamily:"'DM Mono', monospace", color:"#94a3b8" }}>
              <Typewriter words={["LinkedIn.", "X (Twitter).", "Threads.", "Instagram.", "Facebook.", "TikTok."]} />
            </span>
          </p>
          <p style={{ fontSize:"clamp(14px,1.5vw,17px)", color:"#475569", margin:"8px 0 0", lineHeight:1.6 }}>
            {l.heroSub2}
          </p>
        </div>

        {/* CTAs */}
        <div className={`gp-fade-up ${heroVisible ? "visible":""}`} style={{ display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap", marginBottom:64, animationDelay:"0.15s" }}>
          <button onClick={openApp}   className="gp-btn-primary" style={{ fontSize:14, padding:"14px 24px", whiteSpace:"nowrap" }}>{l.ctaStart}</button>
          <button onClick={openLogin} className="gp-btn-ghost" style={{ fontSize:14, padding:"14px 20px", whiteSpace:"nowrap" }}>{l.ctaSignIn}</button>
        </div>

        {/* Platform badges */}
        <div className={`gp-fade-up ${heroVisible ? "visible":""}`} style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap", marginBottom:80, animationDelay:"0.2s" }}>
          {PLATFORMS.map((p, i) => (
            <div key={i} className="gp-platform-badge" style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"8px 14px", background:"rgba(255,255,255,0.03)",
              border:"1px solid rgba(255,255,255,0.08)", borderRadius:8,
              fontFamily:"'DM Mono', monospace", fontSize:12, color:"#94a3b8",
            }}>
              <span style={{ fontSize:15 }}>{p.icon}</span>
              <span>{p.label}</span>
              <span style={{ color:"#22c55e", fontSize:10 }}>✓</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",
          gap:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:16, overflow:"hidden", maxWidth:800, margin:"0 auto",
        }}>
          {[
            { label:l.statGen, to:50000, suffix:"+" },
            { label:l.statPlatforms, to:6, suffix:"" },
            { label:l.statTypes, to:12, suffix:"+" },
            { label:l.statLangs, to:6, suffix:"" },
          ].map((s, i) => (
            <div key={i} style={{ padding:"28px 24px", textAlign:"center", background:"rgba(5,10,20,0.8)" }}>
              <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:"clamp(28px,3vw,36px)", color:"#ef4444", lineHeight:1 }}>
                <Counter to={s.to} suffix={s.suffix} />
              </div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#475569", marginTop:6, letterSpacing:"0.5px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURE TABS WITH GIFs ══ */}
      <section ref={featRef} style={{ padding:"clamp(60px,8vh,100px) clamp(20px,5vw,80px)", position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#ef4444", letterSpacing:"3px", marginBottom:12 }}>{l.featLabel}</div>
          <h2 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:"clamp(28px,4vw,48px)", margin:0, letterSpacing:"-1px" }}>
            {l.featTitle1} <span style={{ color:"#ef4444" }}>{l.featTitle2}</span>
          </h2>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:4, marginBottom:32, overflowX:"auto", maxWidth:700, margin:"0 auto 32px" }}>
          {FEATURE_TABS.map((tab, i) => (
            <button key={i} className="gp-feature-tab"
              onClick={() => setActiveTab(i)}
              style={{
                flex:1, padding:"10px 16px", background: activeTab===i ? "rgba(220,38,38,0.15)" : "transparent",
                border: activeTab===i ? "1px solid rgba(220,38,38,0.4)" : "1px solid transparent",
                borderRadius:8, color: activeTab===i ? "#ef4444" : "#475569",
                fontFamily:"'DM Mono', monospace", fontSize:12, cursor:"pointer",
                whiteSpace:"nowrap", letterSpacing:"0.5px",
                opacity: activeTab===i ? 1 : 0.6,
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* GIF display */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"center", maxWidth:1100, margin:"0 auto" }} className="gp-hero-grid">
          {/* Left: desc */}
          <div>
            <div style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#ef4444", letterSpacing:"2px", marginBottom:16 }}>
              MODULE {String(activeTab + 1).padStart(2,"0")} / {String(FEATURE_TABS.length).padStart(2,"0")}
            </div>
            <h3 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:"clamp(24px,3vw,36px)", margin:"0 0 16px", letterSpacing:"-0.5px" }}>
              {FEATURE_TABS[activeTab].label}
            </h3>
            <p style={{ color:"#64748b", fontSize:16, lineHeight:1.8, margin:"0 0 32px" }}>
              {FEATURE_TABS[activeTab].desc}
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {FEATURE_TABS.map((tab, i) => (
                <div key={i} onClick={() => setActiveTab(i)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:8,
                    background: activeTab===i ? "rgba(220,38,38,0.08)" : "transparent",
                    border: activeTab===i ? "1px solid rgba(220,38,38,0.2)" : "1px solid transparent",
                    cursor:"pointer", transition:"all 0.2s" }}>
                  <span style={{ fontSize:18 }}>{tab.icon}</span>
                  <span style={{ fontFamily:"'Syne', sans-serif", fontWeight:600, fontSize:14, color: activeTab===i ? "#fff":"#475569" }}>{tab.label}</span>
                  {activeTab===i && <span style={{ marginLeft:"auto", color:"#ef4444", fontSize:12 }}>▸</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Right: GIF */}
          <div style={{ position:"relative" }}>
            {/* Terminal frame */}
            <div style={{ background:"#0d1626", border:"1px solid rgba(220,38,38,0.2)", borderRadius:16, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)" }}>
              {/* Terminal bar */}
              <div style={{ background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"10px 16px", display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ display:"flex", gap:6 }}>
                  {["#ef4444","#f59e0b","#22c55e"].map((c,i) => <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c, opacity:0.6 }}/>)}
                </div>
                <span style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#334155", marginLeft:8 }}>aigrowthpilot.app / {FEATURE_TABS[activeTab].label.toLowerCase()}</span>
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s ease infinite" }}/>
                  <span style={{ fontFamily:"'DM Mono', monospace", fontSize:10, color:"#22c55e", letterSpacing:"1px" }}>LIVE</span>
                </div>
              </div>
              {/* GIF */}
              <img
                key={activeTab}
                src={FEATURE_TABS[activeTab].gif}
                alt={FEATURE_TABS[activeTab].label}
                style={{ width:"100%", display:"block", aspectRatio:"800/531", objectFit:"cover" }}
              />
            </div>
            {/* Glow */}
            <div style={{ position:"absolute", inset:-1, borderRadius:16, background:"transparent", boxShadow:"0 0 60px rgba(220,38,38,0.1)", pointerEvents:"none", animation:"glow 3s ease infinite" }}/>
          </div>
        </div>
      </section>

      {/* ══ VS COMPETITORS ══ */}
      <section ref={compareRef} style={{ padding:"clamp(60px,8vh,100px) clamp(20px,5vw,80px)", position:"relative", zIndex:1, background:"rgba(255,255,255,0.01)", borderTop:"1px solid rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#ef4444", letterSpacing:"3px", marginBottom:12 }}>{l.compareLabel}</div>
            <h2 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:"clamp(26px,4vw,44px)", margin:0, letterSpacing:"-1px" }}>
              {l.compareTitle1} <span style={{ color:"#ef4444" }}>{l.compareTitle2}</span>
            </h2>
            <p style={{ color:"#475569", fontSize:15, margin:"12px 0 0" }}>{l.compareSub}</p>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table className="gp-compare-table" style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'DM Mono', monospace", fontSize:13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign:"left", padding:"14px 16px", color:"#475569", fontWeight:500, borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:11, letterSpacing:"1px" }}>FEATURE</th>
                  {[
                    { name:"GrowthPILOT", highlight:true },
                    { name:"Taplio",      highlight:false },
                    { name:"Supergrow",   highlight:false },
                    { name:"MagicPost",   highlight:false },
                  ].map((col, i) => (
                    <th key={i} style={{
                      textAlign:"center", padding:"14px 16px", fontWeight:700, fontSize:12,
                      borderBottom:"1px solid rgba(255,255,255,0.06)", letterSpacing:"0.5px",
                      color: col.highlight ? "#ef4444" : "#475569",
                      background: col.highlight ? "rgba(220,38,38,0.05)" : "transparent",
                      borderLeft: col.highlight ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(255,255,255,0.04)",
                      borderRight: col.highlight ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(255,255,255,0.04)",
                    }}>{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={i} className="gp-compare-row" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"12px 16px", color:"#94a3b8", fontSize:12 }}>{row.feature}</td>
                    {[row.gp, row.taplio, row.supergrow, row.magicpost].map((val, j) => (
                      <td key={j} style={{
                        textAlign:"center", padding:"12px 16px",
                        background: j===0 ? "rgba(220,38,38,0.04)" : "transparent",
                        borderLeft: j===0 ? "1px solid rgba(220,38,38,0.15)" : "1px solid rgba(255,255,255,0.03)",
                        borderRight: j===0 ? "1px solid rgba(220,38,38,0.15)" : "1px solid rgba(255,255,255,0.03)",
                      }}>
                        {typeof val === "boolean"
                          ? <span style={{ color: val ? "#22c55e":"#ef4444", fontSize:16 }}>{val ? "✓":"✕"}</span>
                          : <span style={{ color: j===0 ? "#ef4444":"#475569", fontWeight:700, fontSize:13 }}>{val}</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign:"center", marginTop:40 }}>
            <button onClick={openApp} className="gp-btn-primary" style={{ fontSize:15, padding:"14px 32px" }}>
              {l.compareCta}
            </button>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section ref={pricingRef} style={{ padding:"clamp(60px,8vh,100px) clamp(20px,5vw,80px)", position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#ef4444", letterSpacing:"3px", marginBottom:12 }}>{l.pricingLabel}</div>
          <h2 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:"clamp(26px,4vw,44px)", margin:0, letterSpacing:"-1px" }}>
            {l.pricingTitle1} <span style={{ color:"#ef4444" }}>{l.pricingTitle2}</span> {l.pricingTitle3}
          </h2>
          <p style={{ color:"#475569", fontSize:15, margin:"12px 0 0" }}>{l.pricingSub}</p>

          {/* Toggle */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:12, marginTop:28, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"6px 16px" }}>
            <span style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color: !yearly?"#fff":"#475569" }}>{l.pricingMonthly}</span>
            <div onClick={() => setYearly(!yearly)} style={{ width:44, height:24, background:"rgba(220,38,38,0.3)", border:"1px solid rgba(220,38,38,0.5)", borderRadius:12, cursor:"pointer", position:"relative" }}>
              <div style={{ position:"absolute", top:2, width:18, height:18, background:"#ef4444", borderRadius:"50%", transition:"transform 0.2s", transform: yearly?"translateX(22px)":"translateX(2px)" }}/>
            </div>
            <span style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color: yearly?"#fff":"#475569" }}>
              {l.pricingYearly} <span style={{ background:"rgba(220,38,38,0.2)", border:"1px solid rgba(220,38,38,0.4)", borderRadius:4, padding:"1px 6px", fontSize:10, color:"#ef4444", fontWeight:700, marginLeft:4 }}>-20%</span>
            </span>
          </div>
        </div>

        <div className="gp-pricing-scroll" style={{ margin:"0 -8px", padding:"0 8px" }}>
        <div className="gp-pricing-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, maxWidth:1100, margin:"0 auto", alignItems:"start", minWidth:700 }}>
          {PLANS.map((plan, i) => {
            const price = yearly ? plan.yearlyPrice : plan.price;
            return (
              <div key={i} className="gp-pricing-card" style={{
                background:"#0d1626",
                border:`1px solid ${plan.popular ? plan.color : "rgba(255,255,255,0.07)"}`,
                borderRadius:16, padding:"28px 20px", position:"relative",
                boxShadow: plan.popular ? `0 0 40px ${plan.color}22` : "none",
              }}>
                {plan.popular && (
                  <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:plan.color, padding:"4px 14px", borderRadius:20, fontSize:10, fontWeight:800, color:"#fff", fontFamily:"'DM Mono', monospace", letterSpacing:"1px", whiteSpace:"nowrap" }}>
                    {l.mostPopular}
                  </div>
                )}
                <div style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:plan.color, letterSpacing:"2px", marginBottom:12 }}>{plan.name.toUpperCase()}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:20 }}>
                  <span style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:36, color:"#fff" }}>€{price}</span>
                  <span style={{ color:"#334155", fontSize:13 }}>/mo</span>
                </div>
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:20, marginBottom:24, display:"flex", flexDirection:"column", gap:10 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                      <span style={{ color:plan.color, fontSize:12, marginTop:2, flexShrink:0 }}>✓</span>
                      <span style={{ color:"#94a3b8", fontSize:13, lineHeight:1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={plan.action} className={plan.popular ? "gp-btn-primary" : "gp-btn-ghost"}
                  style={{ width:"100%", padding:"12px", fontSize:14,
                    ...(plan.popular ? { background:`linear-gradient(135deg,${plan.color},#991b1b)` } : {}) }}>
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>
        </div>

        <p style={{ textAlign:"center", color:"#334155", fontSize:13, marginTop:24, fontFamily:"'DM Mono', monospace" }}>
          {l.pricingNote}
        </p>
      </section>

      {/* ══ FAQ ══ */}
      <section style={{ padding:"clamp(48px,6vh,80px) clamp(20px,5vw,80px)", position:"relative", zIndex:1, maxWidth:720, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#ef4444", letterSpacing:"3px", marginBottom:12 }}>{l.faqLabel}</div>
          <h2 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:"clamp(24px,3vw,36px)", margin:0, letterSpacing:"-0.5px" }}>{l.faqTitle}</h2>
        </div>
        {(l.faqItems||[]).map((item, i) => (
          <details key={i} style={{ marginBottom:8, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, overflow:"hidden" }}>
            <summary style={{ padding:"16px 20px", cursor:"pointer", fontFamily:"'Syne', sans-serif", fontWeight:600, fontSize:15, color:"#e2e8f0", listStyle:"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              {item.q}
              <span style={{ color:"#ef4444", flexShrink:0, marginLeft:12 }}>+</span>
            </summary>
            <p style={{ padding:"0 20px 16px", color:"#64748b", fontSize:14, lineHeight:1.7, margin:0 }}>{item.a}</p>
          </details>
        ))}
      </section>

      {/* ══ CTA FINAL ══ */}
      <section ref={ctaRef} style={{ padding:"clamp(80px,10vh,120px) clamp(20px,5vw,80px)", textAlign:"center", position:"relative", zIndex:1, overflow:"hidden" }}>
        {/* Glow bg */}
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, background:"radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)", pointerEvents:"none" }}/>

        <div className={`gp-fade-up ${ctaVisible ? "visible":""}`}>
          <div style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#ef4444", letterSpacing:"3px", marginBottom:24 }}>{l.ctaFinalLabel}</div>
          <h2 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:"clamp(32px,5vw,64px)", margin:"0 0 16px", letterSpacing:"-2px", lineHeight:1.05 }}>
            {l.ctaFinalTitle1}<br/><span style={{ color:"#ef4444" }}>{l.ctaFinalTitle2}</span>
          </h2>
          <p style={{ color:"#475569", fontSize:"clamp(15px,2vw,18px)", margin:"0 0 48px", lineHeight:1.6 }}>
            {l.ctaFinalSub}
          </p>
          <button onClick={openApp} className="gp-btn-primary" style={{ fontSize:18, padding:"20px 52px", letterSpacing:"0.5px", animation:"glow 3s ease infinite" }}>
            {l.ctaFinalBtn}
          </button>
          <p style={{ color:"#334155", fontSize:13, marginTop:16, fontFamily:"'DM Mono', monospace" }}>
            {l.ctaFinalNote}
          </p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ padding:"32px clamp(20px,5vw,80px)", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"center", gap:16, position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={logo} alt="GrowthPILOT" style={{ width:28, height:28, objectFit:"contain" }} />
          <span style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:16, color:"#fff" }}>
            Growth<span style={{ color:"#ef4444" }}>PILOT</span>
          </span>
          <span style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:"#334155", marginLeft:8 }}>© 2026</span>
        </div>
        <div style={{ display:"flex", gap:20, alignItems:"center" }}>
          <a href="/termsofservice" style={{ fontFamily:"'DM Mono', monospace", color:"#334155", fontSize:12, textDecoration:"none" }}>{l.footerTerms}</a>
          <a href="/privacy"        style={{ fontFamily:"'DM Mono', monospace", color:"#334155", fontSize:12, textDecoration:"none" }}>{l.footerPrivacy}</a>
          <a href="mailto:team@aigrowthpilot.app" style={{ fontFamily:"'DM Mono', monospace", color:"#334155", fontSize:12, textDecoration:"none" }}>{l.footerContact}</a>
        </div>
      </footer>

    </div>
  );
}
