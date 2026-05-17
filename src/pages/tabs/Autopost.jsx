import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Autopost({
  trendsLang, isMobile,
  post, autoPlatform, setAutoPlatform, autoPosts, publishLog,
  linkedinStatus, threadsStatus, twitterStatus, facebookStatus,
  autoPublish, postToTwitter, twitterPosting, postToFacebook, facebookPosting,
  showToast
}) {
  const copyAndOpen = (url) => {
    if (post) { navigator.clipboard.writeText(post); showToast(tr(trendsLang,"messages.copied")); }
    window.open(url, "_blank");
  };

  const DIRECT_PLATFORMS = [
    { id:"LINKEDIN",  label:"LinkedIn",  icon:"in", color:"#0077b5", connected: linkedinStatus?.connected },
    { id:"THREADS",   label:"Threads",   icon:"🧵", color:"#000",    connected: threadsStatus?.connected },
    { id:"X",         label:"X",         icon:"𝕏",  color:"#000",    connected: twitterStatus?.connected },
    { id:"FACEBOOK",  label:"Facebook",  icon:"f",  color:"#1877f2", connected: facebookStatus?.connected },
  ];

  const handleAutoPublish = () => {
    if (autoPlatform === "X" && twitterStatus?.connected) {
      postToTwitter();
    } else if (autoPlatform === "FACEBOOK" && facebookStatus?.connected) {
      postToFacebook();
    } else {
      autoPublish();
    }
  };

  return (
    <>
      <PageHeader tabKey="autopost" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px" }}>{tr(trendsLang,"ui.selectPlatform")}</p>

          {/* Sélecteur de plateforme */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {DIRECT_PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setAutoPlatform(p.id)}
                style={{
                  ...st.button, margin:0,
                  background: autoPlatform === p.id ? `linear-gradient(135deg,${p.color},${p.color}dd)` : "transparent",
                  border: autoPlatform === p.id ? "none" : "1px solid rgba(220,38,38,0.3)",
                  color: autoPlatform === p.id ? "#fff" : "#ef4444",
                  opacity: p.connected ? 1 : 0.5,
                  display:"flex", alignItems:"center", gap:6,
                }}
              >
                <span style={{ fontSize:14 }}>{p.icon}</span>
                {p.label} {p.connected ? "✓" : "🔗"}
              </button>
            ))}
          </div>

          {/* Info X thread */}
          {autoPlatform === "X" && twitterStatus?.connected && (
            <div style={{ background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#94a3b8" }}>
              💡 {tr(trendsLang,"integrations.xThreadTip")}
            </div>
          )}

          {/* X non connecté */}
          {autoPlatform === "X" && !twitterStatus?.connected && (
            <div style={{ background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#ef4444" }}>
              ⚠️ {tr(trendsLang,"integrations.xNotConnected")}
            </div>
          )}

          <button
            style={{ ...st.button, margin:0, alignSelf:"flex-start", opacity: (autoPlatform === "X" && !twitterStatus?.connected) ? 0.4 : 1 }}
            onClick={handleAutoPublish}
            disabled={autoPlatform === "X" && !twitterStatus?.connected}
          >
            {(twitterPosting && autoPlatform === "X") || (facebookPosting && autoPlatform === "FACEBOOK") ? tr(trendsLang,"buttons.publishing") : tr(trendsLang,"ui.queuePost")}
          </button>

          {/* Copy & Open manuel */}
          <div style={{ ...st.card, marginTop:0, padding:16 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:10 }}>COPY & POST</div>
            <p style={{ color:"#475569", fontSize:12, marginBottom:12, lineHeight:1.5 }}>{tr(trendsLang,"ui.copyPostDesc")}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Instagram",  icon:"📸", url:"https://www.instagram.com" },
                { label:"Facebook",   icon:"f",  url:"https://www.facebook.com" },
                { label:"TikTok",     icon:"🎵", url:"https://www.tiktok.com" },
              ].map(p => (
                <button
                  key={p.label}
                  style={{ ...st.buttonSecondary, margin:0, display:"flex", alignItems:"center", gap:8, justifyContent:"space-between" }}
                  onClick={() => copyAndOpen(p.url)}
                >
                  <span>{p.icon} {p.label}</span>
                  <span style={{ fontSize:11, color:"#64748b" }}>Copy & Open →</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang,"ui.queued")}</div>
              <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{autoPosts.length}</div>
            </div>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang,"ui.published")}</div>
              <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
            </div>
          </div>
        </div>

        {/* File d'attente */}
        <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto", maxHeight: isMobile ? 300:"unset" }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang,"ui.autoQueue")}</h3>
          {autoPosts.length === 0 && <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang,"ui.noPostsQueued")}</p>}
          {autoPosts.map((p, i) => (
            <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"#ef4444", fontSize:12, fontWeight:700 }}>{p.platform}</span>
                <span style={{ color: p.status==="Sent" ? "#22c55e":"#f59e0b", fontSize:11, fontWeight:700 }}>{p.status}</span>
              </div>
              <p style={{ color:"#94a3b8", fontSize:13 }}>{p.content}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
