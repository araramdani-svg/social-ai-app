import { motion } from "framer-motion";
import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Home({ trendsLang, isMobile, setTab }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, overflow:"hidden" }}>
      <PageHeader tabKey="home" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0,1fr))", gap:6 }}>
        {[
          ["create",     tr(trendsLang, "ui.qlCreate"),     "✍️"],
          ["dashboard",  tr(trendsLang, "ui.qlDashboard"),  "📊"],
          ["memory",     tr(trendsLang, "ui.qlMemory"),     "🧠"],
          ["carousel",   tr(trendsLang, "carousel.subtitle"), "🎠"],
          ["ghostwrite", tr(trendsLang, "ghostwrite.subtitle"), "✨"],
          ["autorepost", tr(trendsLang, "autorepost.subtitle"), "🔄"],
          ["scheduler",  tr(trendsLang, "ui.qlScheduler"),  "📅"],
          ["autopost",   tr(trendsLang, "ui.qlAutopost"),   "🚀"],
          ["analyze",    tr(trendsLang, "ui.qlAnalyze"),    "🔍"],
          ["planner",    tr(trendsLang, "ui.qlPlanner"),    "🗓️"],
          ["publish",    tr(trendsLang, "ui.qlPublish"),    "📤"],
          ["team",       tr(trendsLang, "ui.qlTeam"),       "👥"],
        ].map(([key, desc, icon]) => (
          <motion.div
            key={key}
            whileHover={{ y: -4, borderColor: "#dc2626" }}
            onClick={() => setTab(key)}
            style={{ ...st.card, marginTop:0, padding: isMobile ? "10px 12px" : "12px 16px", cursor:"pointer" }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontSize: isMobile ? 16 : 18 }}>{icon}</span>
              <h2 style={{ margin:0, fontSize: isMobile ? 12 : 14, color:"#ef4444", textShadow:"none", letterSpacing:"1.5px" }}>
                {tr(trendsLang, `nav.${key}`)}
              </h2>
            </div>
            {!isMobile && <p style={{ color:"#d4d4d8", fontSize:12, lineHeight:1.4 }}>{desc}</p>}
          </motion.div>
        ))}
      </div>
      <div style={{ ...st.card, marginTop:4, padding: isMobile ? "14px 16px" : "16px 20px" }}>
        <h2 style={{ color:"#ef4444", textShadow:"none", letterSpacing:"1.5px", fontSize: isMobile ? 14 : 16 }}>
          {tr(trendsLang, "ui.readyDeployment")}
        </h2>
        <p style={{ marginTop:10, fontSize: isMobile ? 13 : 14 }}>{tr(trendsLang, "ui.createOptimize")}</p>
        <button style={{ ...st.button, marginTop:12 }} onClick={() => setTab("create")}>
          {tr(trendsLang, "ui.startMission")}
        </button>
      </div>
    </div>
  );
}
