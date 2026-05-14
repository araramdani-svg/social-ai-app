import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Insights({ trendsLang, isMobile, insights, stats, linkedinStatus, threadsStatus }) {
  return (
    <>
      <PageHeader tabKey="insights" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              [tr(trendsLang, "ui.bestProject"), insights.bestProject,  "#ef4444"],
              [tr(trendsLang, "ui.topPlatform"), insights.topPlatform,  "#3b82f6"],
              [tr(trendsLang, "ui.cadence"),     insights.cadence,      "#f59e0b"],
              [tr(trendsLang, "ui.statAvgScore"),stats.avgScore || "—", "#22c55e"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ ...st.card, marginTop:0, padding:16 }}>
                <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{label}</div>
                <div style={{ color, fontSize:18, fontWeight:800 }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ ...st.card, marginTop:0, padding:20, borderLeft:"3px solid #3b82f6" }}>
            <div style={{ color:"#3b82f6", fontSize:11, letterSpacing:"1.5px", marginBottom:12 }}>{tr(trendsLang, "ui.aiRecommendation")}</div>
            <p style={{ color:"#94a3b8", fontSize:14, lineHeight:1.8 }}>{insights.recommendation}</p>
            <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
              {[
                "Post 3x per week on LinkedIn for maximum reach",
                "Use hook-first format to boost engagement",
                "Add a CTA to every post to drive conversions",
                "Repurpose top posts on Threads and X",
              ].map((tip, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ color:"#ef4444", fontSize:12, marginTop:2 }}>▸</span>
                  <span style={{ color:"#64748b", fontSize:13 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:16 }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.platformPerformance")}</h3>
          {[
            { platform:"LinkedIn", score: linkedinStatus.connected ? stats.avgScore||0 : 0, color:"#0077b5" },
            { platform:"Threads",  score: threadsStatus.connected  ? Math.max(0,(stats.avgScore||0)-20) : 0, color:"#a855f7" },
            { platform:"X",        score: 0, color:"#1da1f2" },
          ].map((p, i) => (
            <div key={i}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"#94a3b8", fontSize:13 }}>{p.platform}</span>
                <span style={{ color:p.color, fontSize:13, fontWeight:700 }}>{p.score}/100</span>
              </div>
              <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:4, height:6 }}>
                <div style={{ width:`${p.score}%`, height:"100%", borderRadius:4, background:p.color }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop:8, borderTop:"1px solid rgba(220,38,38,0.1)", paddingTop:16 }}>
            <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:12 }}>{tr(trendsLang, "ui.growthSignals")}</h3>
            {[
              { signal:tr(trendsLang,"ui.signalEngagement"), value: stats.posts > 0 ? "+?" : "N/A" },
              { signal:tr(trendsLang,"ui.signalReach"),       value: stats.published > 0 ? "+?" : "N/A" },
              { signal:tr(trendsLang,"ui.signalCtr"),         value: "N/A" },
              { signal:tr(trendsLang,"ui.signalFollowers"),   value: "N/A" },
            ].map((g, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color:"#64748b", fontSize:13 }}>{g.signal}</span>
                <span style={{ color:"#64748b", fontSize:13, fontWeight:700 }}>{g.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
