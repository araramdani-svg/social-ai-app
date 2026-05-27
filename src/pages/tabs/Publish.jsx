import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Publish({
  trendsLang, isMobile,
  post, publishLog, autoPosts, publishStatus,
  linkedinStatus, twitterStatus, facebookStatus,
  publish, postToTwitter, postToFacebook, twitterPosting, facebookPosting,
  attachedMedia, showToast
}) {
  const copyAndOpen = (url) => {
    if (post) { navigator.clipboard.writeText(post); showToast(tr(trendsLang, "messages.copied")); }
    window.open(url, "_blank");
  };

  return (
    <>
      <PageHeader tabKey="publish center" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px" }}>{tr(trendsLang, "ui.selectPublish")}</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button style={{ ...st.button, margin:0, opacity: linkedinStatus?.connected ? 1 : 0.5 }} onClick={() => publish("LINKEDIN")}>
              in LinkedIn {linkedinStatus?.connected ? "✓" : "🔗"}
            </button>
            <button style={{ ...st.button, margin:0, opacity: twitterStatus?.connected ? 1 : 0.5, background:"linear-gradient(135deg,#000,#1a1a1a)" }} onClick={() => twitterStatus?.connected ? postToTwitter() : null} disabled={twitterPosting}>
              𝕏 {twitterPosting ? tr(trendsLang,"buttons.publishing") : "X (Twitter)"} {twitterStatus?.connected ? "✓" : "🔗"}
            </button>
            <button style={{ ...st.button, margin:0, opacity: facebookStatus?.connected ? 1 : 0.5, background:"linear-gradient(135deg,#1877f2,#0d5cbf)" }} onClick={() => facebookStatus?.connected ? postToFacebook() : null} disabled={facebookPosting}>
              f {facebookPosting ? tr(trendsLang,"buttons.publishing") : "Facebook"} {facebookStatus?.connected ? "✓" : "🔗"}
            </button>
            <button style={{ ...st.button, margin:0, background:"linear-gradient(135deg,#000,#1a1a1a)", opacity:0.5 }} onClick={() => copyAndOpen("https://www.threads.net")}>
              🧵 Threads 🔗
            </button>
          </div>

          {publishStatus && (
            <div style={{ ...st.card, marginTop:0, padding:"12px 16px", borderLeft:"3px solid #22c55e" }}>
              <span style={{ color:"#22c55e", fontSize:13 }}>✓ {publishStatus}</span>
            </div>
          )}

          <div style={{ ...st.card, marginTop:0, padding:16 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:10 }}>COPY & POST</div>
            <p style={{ color:"#475569", fontSize:12, marginBottom:12, lineHeight:1.5 }}>{tr(trendsLang, "ui.copyPostDesc")}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Instagram",  icon:"📸", url:"https://www.instagram.com" },
                { label:"Facebook",   icon:"f",  url:"https://www.facebook.com" },
                { label:"TikTok",     icon:"🎵", url:"https://www.tiktok.com" },
                { label:"X (Twitter)",icon:"𝕏",  url:"https://twitter.com/compose/tweet" },
                { label:"Threads",    icon:"🧵", url:"https://www.threads.net" },
              ].map(p => (
                <button key={p.label} style={{ ...st.buttonSecondary, margin:0, display:"flex", alignItems:"center", gap:8, justifyContent:"space-between" }}
                  onClick={() => copyAndOpen(p.url)}>
                  <span>{p.icon} {p.label}</span>
                  <span style={{ fontSize:11, color:"#64748b" }}>{tr(trendsLang,"ui.copyAndOpen") || "Copy & Open"} →</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.published")}</div>
              <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
            </div>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.queued")}</div>
              <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{autoPosts.length}</div>
            </div>
          </div>

          <div style={{ ...st.card, marginTop:0 }}>
            <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:12 }}>{tr(trendsLang, "ui.postPreview")}</h3>
            {attachedMedia && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, background:"rgba(56,189,248,0.07)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:8, padding:"8px 10px" }}>
                <img src={attachedMedia.media_url} alt="media" style={{ width:36, height:36, objectFit:"cover", borderRadius:6, flexShrink:0 }} />
                <div>
                  <div style={{ color:"#38bdf8", fontSize:10, fontWeight:700 }}>🖼️ {tr(trendsLang,"ui.mediaAttached")}</div>
                  <div style={{ color:"#475569", fontSize:9 }}>{attachedMedia.media_source} · {attachedMedia.media_type}</div>
                </div>
              </div>
            )}
            <p style={{ color: post ? "#94a3b8" : "#334155", fontSize:13, lineHeight:1.6 }}>
              {post ? post.slice(0,300)+(post.length>300?"...":"") : tr(trendsLang, "ui.noContentGenerated")}
            </p>
          </div>
        </div>

        <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto", maxHeight: isMobile ? 300 : "calc(100vh - 180px)" }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.publishLog")}</h3>
          {publishLog.length === 0 && <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang, "ui.noPublications")}</p>}
          {publishLog.map((p, i) => (
            <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:"#ef4444", fontSize:12, fontWeight:700 }}>{p.dest}</span>
                <span style={{ color:"#22c55e", fontSize:11, fontWeight:700 }}>{tr(trendsLang, "ui.published")}</span>
              </div>
              <p style={{ color:"#475569", fontSize:11 }}>{p.date}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
