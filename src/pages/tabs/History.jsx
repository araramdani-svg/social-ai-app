import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function History({ trendsLang, isMobile, history, projects, loadHistory, setPost, setTab }) {
  return (
    <>
      <PageHeader tabKey="history" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <button style={{ ...st.button, margin:0, alignSelf:"flex-start" }} onClick={loadHistory}>{tr(trendsLang, "ui.loadHistory")}</button>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.totalPosts")}</div>
              <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{history.length}</div>
            </div>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.statProjects")}</div>
              <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{projects.length}</div>
            </div>
          </div>
        </div>

        <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto", maxHeight: isMobile ? 300 : "unset" }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.contentHistory")}</h3>
          {history.length === 0 && <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang, "ui.noHistoryLoaded")}</p>}
          {history.map((h, i) => (
            <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12, cursor:"pointer" }}
              onClick={() => { setPost(h.content); setTab("create"); }}>
              <div style={{ color:"#ef4444", fontSize:12, fontWeight:700, marginBottom:4 }}>{h.title || "Untitled"}</div>
              <p style={{ color:"#94a3b8", fontSize:12, lineHeight:1.5 }}>{h.content?.slice(0,120)}...</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
