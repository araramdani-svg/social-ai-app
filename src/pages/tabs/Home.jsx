import { motion } from "framer-motion";
import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

const GREETING = (lang) => {
  const h = new Date().getHours();
  const key = h < 12 ? "ui.goodMorning" : h < 18 ? "ui.goodAfternoon" : "ui.goodEvening";
  return tr(lang, key);
};

const TODAY = (lang) => {
  const localeMap = { fr:"fr-FR", es:"es-ES", de:"de-DE", it:"it-IT", pt:"pt-BR" };
  return new Date().toLocaleDateString(localeMap[lang] || "en-US", { weekday:"long", month:"long", day:"numeric" });
};

// Actions principales — mises en avant
const SPOTLIGHT = [
  { key:"create",   icon:"✍️", color:"#ef4444", gradient:"linear-gradient(135deg,rgba(220,38,38,0.15),rgba(220,38,38,0.05))", border:"rgba(220,38,38,0.3)",  descKey:"ui.qlCreate",   descFallback:"Generate strategic authority content" },
  { key:"calendar", icon:"📅", color:"#8b5cf6", gradient:"linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05))", border:"rgba(139,92,246,0.3)", descKey:"ui.qlCalendar", descFallback:"Plan and schedule your content" },
  { key:"trends",   icon:"🌍", color:"#22c55e", gradient:"linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.05))", border:"rgba(34,197,94,0.3)",   descKey:"ui.qlTrends",   descFallback:"Discover viral topics in real time" },
];

// Modules secondaires
const MODULES = [
  { key:"dashboard",  icon:"📊" },
  { key:"memory",     icon:"🧠" },
  { key:"carousel",   icon:"🎠" },
  { key:"ghostwrite", icon:"✨" },
  { key:"autorepost", icon:"🔄" },
  { key:"scheduler",  icon:"⏰" },
  { key:"autopost",   icon:"🚀" },
  { key:"analyze",    icon:"🔍" },
  { key:"planner",    icon:"🗓️" },
  { key:"publish",    icon:"📤" },
  { key:"team",       icon:"👥" },
  { key:"integrations", icon:"🔗" },
];

export default function Home({ trendsLang, isMobile, setTab, stats, userPlan, firstName, displayName }) {

  const greeting = GREETING(trendsLang);
  const name = displayName ? `, ${displayName}` : firstName ? `, ${firstName}` : "";
  const plan = userPlan?.plan || "Free";

  const planColor = plan === "Business" ? "#a855f7" : plan === "Pro" ? "#ef4444" : "#475569";
  const planIcon  = plan === "Business" ? "💎" : plan === "Pro" ? "⚡" : "🆓";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: isMobile ? 12 : 16 }}>

      {/* ── Hero personnalisé ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity:0, y:-8 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.4 }}
        style={{
          background:"linear-gradient(135deg,rgba(220,38,38,0.06),rgba(15,23,42,0))",
          border:"1px solid rgba(220,38,38,0.12)",
          borderRadius:16,
          padding: isMobile ? "20px 20px" : "28px 32px",
          display:"flex",
          justifyContent:"space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap:16,
        }}
      >
        <div>
          <div style={{ color:"#64748b", fontSize:12, letterSpacing:"0.5px", marginBottom:6 }}>{TODAY(trendsLang)}</div>
          <h1 style={{ margin:0, fontSize: isMobile ? 20 : 26, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.5px" }}>
            {greeting}{name} 👋
          </h1>
          <p style={{ margin:"8px 0 0", color:"#64748b", fontSize: isMobile ? 13 : 14 }}>
            {stats?.posts > 0
              ? `${stats.posts} ${tr(trendsLang,"ui.heroPosts")}`
              : tr(trendsLang,"ui.heroReady")}
          </p>
        </div>

        {/* Badge plan + quota */}
        <div style={{
          display:"flex", flexDirection:"row", gap:16, alignItems:"center", justifyContent: isMobile ? "flex-start" : "flex-end",
          flexShrink:0, flexWrap:"wrap",
        }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:`rgba(${plan==="Business"?"168,85,247":plan==="Pro"?"220,38,38":"71,85,105"},0.1)`,
            border:`1px solid ${planColor}30`,
            borderRadius:20, padding:"6px 14px",
          }}>
            <span style={{ fontSize:14 }}>{planIcon}</span>
            <span style={{ color:planColor, fontSize:12, fontWeight:700, letterSpacing:"1px" }}>{plan.toUpperCase()}</span>
          </div>
          {stats?.posts !== undefined && (
            <div style={{ color:"#334155", fontSize:11, letterSpacing:"0.5px" }}>
              {stats.posts} {tr(trendsLang,"ui.statPosts").toLowerCase()} · {stats.projects || 0} {tr(trendsLang,"ui.statProjects").toLowerCase()}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Actions Spotlight ─────────────────────────────────────────────── */}
      <div>
        <div style={{ color:"#475569", fontSize:10, fontWeight:700, letterSpacing:"2px", marginBottom:10 }}>
          {tr(trendsLang,"ui.quickActions")}
        </div>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:10 }}>
          {SPOTLIGHT.map(({ key, icon, color, gradient, border, descKey, descFallback }, i) => (
            <motion.div
              key={key}
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.35, delay: i * 0.08 }}
              whileHover={{ y:-3, boxShadow:`0 8px 24px ${border}40` }}
              onClick={() => setTab(key)}
              style={{
                background: gradient,
                border:`1px solid ${border}`,
                borderRadius:14,
                padding: isMobile ? "16px 18px" : "20px 24px",
                cursor:"pointer",
                display:"flex", alignItems:"center", gap:14,
              }}
            >
              <div style={{
                width:44, height:44, borderRadius:12,
                background:`${border}30`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, flexShrink:0,
              }}>
                {icon}
              </div>
              <div>
                <div style={{ color, fontSize:13, fontWeight:800, letterSpacing:"1px", marginBottom:3 }}>
                  {tr(trendsLang, `nav.${key}`)}
                </div>
                <div style={{ color:"#475569", fontSize:12, lineHeight:1.4 }}>
                  {tr(trendsLang, descKey) || descFallback}
                </div>
              </div>
              <div style={{ marginLeft:"auto", color:"#334155", fontSize:18 }}>›</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Modules secondaires ───────────────────────────────────────────── */}
      <div>
        <div style={{ color:"#475569", fontSize:10, fontWeight:700, letterSpacing:"2px", marginBottom:10 }}>
          {tr(trendsLang,"ui.allModules")}
        </div>
        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(6,1fr)",
          gap:8,
        }}>
          {MODULES.map(({ key, icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity:0, scale:0.95 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.25, delay: 0.2 + i * 0.04 }}
              whileHover={{ y:-2, background:"rgba(220,38,38,0.08)", borderColor:"rgba(220,38,38,0.3)" }}
              onClick={() => setTab(key)}
              style={{
                background:"rgba(255,255,255,0.02)",
                border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:12,
                padding: isMobile ? "12px 8px" : "14px 10px",
                cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                transition:"all 0.15s ease",
              }}
            >
              <span style={{ fontSize: isMobile ? 20 : 22 }}>{icon}</span>
              <span style={{ color:"#64748b", fontSize: isMobile ? 9 : 10, fontWeight:700, letterSpacing:"0.8px", textAlign:"center" }}>
                {tr(trendsLang, `nav.${key}`)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CTA bas de page ───────────────────────────────────────────────── */}
      {!isMobile && (
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:0.5 }}
          style={{
            background:"rgba(255,255,255,0.01)",
            border:"1px solid rgba(255,255,255,0.05)",
            borderRadius:14,
            padding:"20px 28px",
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:20,
          }}
        >
          <div>
            <div style={{ color:"#e2e8f0", fontSize:14, fontWeight:700, marginBottom:4 }}>
              {tr(trendsLang, "ui.readyDeployment")}
            </div>
            <div style={{ color:"#475569", fontSize:13 }}>{tr(trendsLang, "ui.createOptimize")}</div>
          </div>
          <button
            style={{ ...st.button, margin:0, whiteSpace:"nowrap", padding:"12px 28px", fontSize:13 }}
            onClick={() => setTab("create")}
          >
            {tr(trendsLang, "ui.startMission")} →
          </button>
        </motion.div>
      )}
    </div>
  );
}
