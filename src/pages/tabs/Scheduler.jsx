import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Scheduler({
  trendsLang, isMobile,
  scheduleDate, setScheduleDate, scheduleTime, setScheduleTime,
  scheduledPosts, publishLog, schedulePost
}) {
  return (
    <>
      <PageHeader tabKey="scheduler" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px", marginBottom:4 }}>{tr(trendsLang, "ui.selectDate")}</p>
          <input style={st.input} type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
          <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px", marginBottom:4 }}>{tr(trendsLang, "ui.selectTime")}</p>
          <input style={st.input} type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
          <button style={{ ...st.button, margin:0, alignSelf:"flex-start", marginTop:8 }} onClick={schedulePost}>{tr(trendsLang, "ui.schedulePost")}</button>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.scheduled")}</div>
              <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{scheduledPosts.length}</div>
            </div>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.published")}</div>
              <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
            </div>
          </div>
        </div>

        <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto", maxHeight: isMobile ? 300 : "unset" }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.publishQueue")}</h3>
          {scheduledPosts.length === 0 && <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang, "ui.noPostsScheduled")}</p>}
          {scheduledPosts.map((s, i) => (
            <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"#ef4444", fontSize:12, fontWeight:700 }}>{s.date} · {s.time}</span>
                <span style={{ color:"#22c55e", fontSize:11, fontWeight:700 }}>{tr(trendsLang, "ui.scheduled")}</span>
              </div>
              <p style={{ color:"#94a3b8", fontSize:13 }}>{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
