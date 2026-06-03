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

// Modules secondaires enrichis avec descriptions
const MODULES = [
  { key:"dashboard",    icon:"📊", color:"#3b82f6",  descKey:"ui.modDashboard"    },
  { key:"memory",       icon:"🧠", color:"#8b5cf6",  descKey:"ui.modMemory"       },
  { key:"carousel",     icon:"🎠", color:"#f97316",  descKey:"ui.modCarousel"     },
  { key:"ghostwrite",   icon:"✨", color:"#ec4899",  descKey:"ui.modGhostwrite"   },
  { key:"autorepost",   icon:"🔄", color:"#22c55e",  descKey:"ui.modAutorepost"   },
  { key:"scheduler",    icon:"⏰", color:"#f59e0b",  descKey:"ui.modScheduler"    },
  { key:"autopost",     icon:"🚀", color:"#ef4444",  descKey:"ui.modAutopost"     },
  { key:"analyze",      icon:"🔍", color:"#60a5fa",  descKey:"ui.modAnalyze"      },
  { key:"planner",      icon:"🗓️", color:"#a78bfa",  descKey:"ui.modPlanner"      },
  { key:"publish",      icon:"📤", color:"#34d399",  descKey:"ui.modPublish"      },
  { key:"team",         icon:"👥", color:"#fb923c",  descKey:"ui.modTeam"         },
  { key:"integrations", icon:"🔗", color:"#94a3b8",  descKey:"ui.modIntegrations" },
];

export default function Home({ trendsLang, isMobile, setTab, stats, userPlan, firstName, displayName }) {

  const greeting = GREETING(trendsLang);
  const name = displayName ? `, ${displayName}` : firstName ? `, ${firstName}` : "";
  const plan     = userPlan?.plan     || "Free";
  const interval = userPlan?.interval || null;
  const periodEnd        = userPlan?.current_period_end  || null;
  const paymentFailed    = userPlan?.payment_failed      || false;
  const gracePeriodEnds  = userPlan?.grace_period_ends_at|| null;

  const planColor = plan === "Agency" ? "#ec4899" : plan === "Business" ? "#a855f7" : plan === "Pro" ? "#ef4444" : "#475569";
  const planIcon  = plan === "Agency" ? "🏢" : plan === "Business" ? "💎" : plan === "Pro" ? "⚡" : "🆓";

  // Calcul jours restants
  const daysLeft = (() => {
    const end = gracePeriodEnds || periodEnd;
    if (!end) return null;
    const diff = new Date(end) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const daysColor = daysLeft === null ? planColor
    : daysLeft <= 3  ? "#ef4444"
    : daysLeft <= 7  ? "#f59e0b"
    : daysLeft <= 14 ? "#f97316"
    : "#22c55e";

  const intervalLabel = interval === "year"
    ? tr(trendsLang, "ui.annual")    || "Annual"
    : interval === "month"
    ? tr(trendsLang, "ui.monthly")   || "Monthly"
    : null;

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
          paddingRight: isMobile ? 20 : 90,
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

        {/* Badge plan + subscription info */}
        <div style={{
          display:"flex", flexDirection:"column", gap:8, alignItems: isMobile ? "flex-start" : "flex-end",
          flexShrink:0,
        }}>
          {/* Ligne 1 : Plan + interval */}
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:`rgba(${plan==="Agency"?"236,72,153":plan==="Business"?"168,85,247":plan==="Pro"?"220,38,38":"71,85,105"},0.1)`,
              border:`1px solid ${planColor}30`,
              borderRadius:20, padding:"6px 14px",
            }}>
              <span style={{ fontSize:14 }}>{planIcon}</span>
              <span style={{ color:planColor, fontSize:12, fontWeight:700, letterSpacing:"1px" }}>{plan.toUpperCase()}</span>
            </div>
            {intervalLabel && (
              <div style={{
                display:"inline-flex", alignItems:"center", gap:4,
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:20, padding:"5px 10px",
              }}>
                <span style={{ fontSize:10 }}>{interval === "year" ? "📅" : "🗓️"}</span>
                <span style={{ color:"#64748b", fontSize:11, fontWeight:600 }}>{intervalLabel}</span>
              </div>
            )}
          </div>

          {/* Ligne 2 : Décompte jours + alerte paiement */}
          {paymentFailed && gracePeriodEnds && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.35)",
              borderRadius:10, padding:"5px 12px", cursor:"pointer",
            }} onClick={() => setTab("profile")}>
              <span style={{ fontSize:12 }}>⚠️</span>
              <span style={{ color:"#ef4444", fontSize:11, fontWeight:700 }}>
                {tr(trendsLang,"ui.paymentFailed") || "Payment failed"} — {daysLeft}j grace
              </span>
            </div>
          )}

          {!paymentFailed && daysLeft !== null && plan !== "Free" && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              background:`${daysColor}12`, border:`1px solid ${daysColor}35`,
              borderRadius:10, padding:"5px 12px",
            }}>
              <span style={{ fontSize:12 }}>
                {daysLeft <= 3 ? "🔴" : daysLeft <= 7 ? "🟠" : daysLeft <= 14 ? "🟡" : "🟢"}
              </span>
              <span style={{ color:daysColor, fontSize:11, fontWeight:700 }}>
                {daysLeft === 0
                  ? tr(trendsLang,"ui.expirestoday")    || "Expires today"
                  : daysLeft === 1
                  ? tr(trendsLang,"ui.expiresTomorrow")  || "Expires tomorrow"
                  : `${daysLeft} ${tr(trendsLang,"ui.daysLeft") || "days left"}`}
              </span>
              {daysLeft <= 7 && (
                <span
                  onClick={e => { e.stopPropagation(); setTab("profile"); }}
                  style={{ color:daysColor, fontSize:10, fontWeight:800, cursor:"pointer", textDecoration:"underline", marginLeft:2 }}>
                  {tr(trendsLang,"ui.renew") || "Renew →"}
                </span>
              )}
            </div>
          )}

          {plan === "Free" && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)",
              borderRadius:10, padding:"5px 12px", cursor:"pointer",
            }} onClick={() => setTab("profile")}>
              <span style={{ color:"#ef4444", fontSize:11, fontWeight:700 }}>
                {tr(trendsLang,"ui.upgradeNow") || "Upgrade →"}
              </span>
            </div>
          )}

          {/* Stats */}
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
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: isMobile ? 8 : 10,
        }}>
          {MODULES.map(({ key, icon, color, descKey }, i) => (
            <motion.div
              key={key}
              initial={{ opacity:0, scale:0.95 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.25, delay: 0.2 + i * 0.04 }}
              whileHover={{ y:-3, background:`${color}10`, borderColor:`${color}40`, boxShadow:`0 6px 20px ${color}18` }}
              onClick={() => setTab(key)}
              style={{
                background:"rgba(255,255,255,0.02)",
                border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:14,
                padding: isMobile ? "14px 12px" : "16px 14px",
                cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                transition:"all 0.18s ease",
                textAlign:"center",
              }}
            >
              {/* Icone dans bulle colorée */}
              <div style={{
                width:44, height:44, borderRadius:12,
                background:`${color}15`,
                border:`1px solid ${color}25`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, flexShrink:0,
              }}>
                {icon}
              </div>
              {/* Nom */}
              <span style={{ color:"#e2e8f0", fontSize: isMobile ? 10 : 11, fontWeight:800, letterSpacing:"0.5px" }}>
                {tr(trendsLang, `nav.${key}`)}
              </span>
              {/* Description */}
              <span style={{ color:"#475569", fontSize: isMobile ? 9 : 10, lineHeight:1.4, fontWeight:500 }}>
                {tr(trendsLang, descKey) || ""}
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
