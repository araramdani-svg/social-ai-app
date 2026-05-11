import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Planner({ trendsLang, isMobile, planner, scheduledPosts, generatePlanner }) {
  return (
    <>
      <PageHeader tabKey="planner" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ ...st.card, marginTop:0, padding:16 }}>
            <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "ui.howToUse")}</div>
            <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.6 }}>{tr(trendsLang, "ui.howToUseDesc")}</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.plannedPosts")}</div>
              <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{planner.length}</div>
            </div>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.scheduled")}</div>
              <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{scheduledPosts.length}</div>
            </div>
          </div>
          <button style={{ ...st.button, margin:0, alignSelf:"flex-start" }} onClick={generatePlanner}>Generate 30-day plan</button>
        </div>

        <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:10, overflowY:"auto", maxHeight: isMobile ? 300 : "calc(100vh - 260px)" }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.roadmap30")}</h3>
          {planner.length === 0 && <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang, "ui.noPlanGenerated")}</p>}
          {planner.map((p, i) => (
            <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:10 }}>
              <div style={{ color:"#ef4444", fontSize:11, fontWeight:700, marginBottom:4 }}>DAY {i+1}</div>
              <p style={{ color:"#94a3b8", fontSize:13 }}>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
