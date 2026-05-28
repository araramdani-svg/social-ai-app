import { useState, useEffect, useCallback } from "react";
import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

const API = "https://social-ai-app-production.up.railway.app";

export default function Scheduler({
  trendsLang, isMobile, token,
  scheduleDate, setScheduleDate, scheduleTime, setScheduleTime,
  scheduledPosts, setScheduledPosts, publishLog,
  history,
}) {
  const [selectedPostId, setSelectedPostId] = useState("");
  const [dbPosts,        setDbPosts]        = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [deleting,       setDeleting]       = useState(null);
  const [view,           setView]           = useState("list"); // "list" | "calendar"

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  const logAction = useCallback((action, details = {}) => {
    if (!token) return;
    fetch(`${API}/auth/user-log`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ action, details }),
    }).catch(() => {});
  }, [token, authHeaders]);

  // Charger les posts planifiés depuis DB
  const loadScheduled = useCallback(async () => {
    try {
      const r = await fetch(`${API}/calendar/scheduled`, { headers: authHeaders() });
      const d = await r.json();
      if (Array.isArray(d)) setDbPosts(d);
    } catch {}
  }, [authHeaders]);

  useEffect(() => { loadScheduled(); }, [loadScheduled]);

  const selectedPost = history?.find(p => String(p.id) === String(selectedPostId));

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime || !selectedPostId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/calendar`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title:    selectedPost?.title || selectedPost?.content?.slice(0, 60) || "Post",
          content:  selectedPost?.content || "",
          col:      "scheduled",
          platform: "LinkedIn",
          media_url: selectedPost?.media_url || null,
          scheduled_at: `${scheduleDate}T${scheduleTime}:00`,
        }),
      });
      const d = await r.json();
      if (d.id || d.success) {
        logAction("scheduler_add", { post_id: selectedPostId, date: scheduleDate, time: scheduleTime });
        setSelectedPostId("");
        setScheduleDate("");
        setScheduleTime("");
        await loadScheduled();
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API}/calendar/${id}`, { method: "DELETE", headers: authHeaders() });
      logAction("scheduler_delete", { id });
      await loadScheduled();
    } catch {}
    setDeleting(null);
  };

  // Grouper par date pour vue calendrier 30 jours
  const next30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const postsByDate = dbPosts.reduce((acc, p) => {
    const date = p.scheduled_at?.split("T")[0] || p.created_at?.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(p);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(trendsLang === "fr" ? "fr-FR" : trendsLang === "de" ? "de-DE" : trendsLang === "es" ? "es-ES" : trendsLang === "it" ? "it-IT" : trendsLang === "pt" ? "pt-PT" : "en-GB", { weekday:"short", day:"numeric", month:"short" });
  };

  return (
    <>
      <PageHeader tabKey="scheduler" trendsLang={trendsLang} isMobile={isMobile} />

      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>

        {/* ── Panneau gauche : formulaire ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Sélection du post */}
          <div style={{ ...st.card, marginTop:0, padding:16 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:10 }}>
              {tr(trendsLang,"scheduler.selectPost") || "SELECT A POST"}
            </div>
            <select
              style={{ ...st.input, marginBottom:0, cursor:"pointer" }}
              value={selectedPostId}
              onChange={e => setSelectedPostId(e.target.value)}
            >
              <option value="">{tr(trendsLang,"scheduler.choosePosts") || "-- Choose a post --"}</option>
              {(history || []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.title || p.content?.slice(0, 60) || "Untitled"}
                </option>
              ))}
            </select>

            {/* Preview du post sélectionné */}
            {selectedPost && (
              <div style={{ marginTop:12, padding:10, background:"rgba(255,255,255,0.02)", borderRadius:8, border:"1px solid rgba(255,255,255,0.06)" }}>
                {selectedPost.media_url && (
                  <img src={selectedPost.media_url} alt="" style={{ width:"100%", height:80, objectFit:"cover", borderRadius:6, marginBottom:8 }} />
                )}
                <p style={{ color:"#94a3b8", fontSize:12, lineHeight:1.5, margin:0 }}>
                  {selectedPost.content?.slice(0, 120)}...
                </p>
                {selectedPost.score > 0 && (
                  <span style={{ color:"#22c55e", fontSize:10, fontWeight:700, marginTop:6, display:"block" }}>
                    ⚡ Score {selectedPost.score}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Date & Heure */}
          <div style={{ ...st.card, marginTop:0, padding:16 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:10 }}>
              {tr(trendsLang,"scheduler.dateTime") || "DATE & TIME"}
            </div>
            <p style={{ color:"#64748b", fontSize:11, marginBottom:4 }}>{tr(trendsLang,"ui.selectDate")}</p>
            <input style={{ ...st.input, marginBottom:8 }} type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
            <p style={{ color:"#64748b", fontSize:11, marginBottom:4 }}>{tr(trendsLang,"ui.selectTime")}</p>
            <input style={{ ...st.input, marginBottom:0 }} type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
          </div>

          <button
            style={{ ...st.button, margin:0, opacity: (!scheduleDate || !scheduleTime || !selectedPostId || loading) ? 0.5 : 1 }}
            onClick={handleSchedule}
            disabled={!scheduleDate || !scheduleTime || !selectedPostId || loading}
          >
            {loading ? "⏳ ..." : tr(trendsLang,"ui.schedulePost")}
          </button>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang,"ui.scheduled")}</div>
              <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{dbPosts.length}</div>
            </div>
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang,"ui.published")}</div>
              <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
            </div>
          </div>
        </div>

        {/* ── Panneau droit : liste / calendrier 30j ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* Toggle vue */}
          <div style={{ display:"flex", gap:6 }}>
            {["list","calendar"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:"6px 14px", borderRadius:8, border:"none", fontSize:11, fontWeight:700, cursor:"pointer",
                background: view === v ? "linear-gradient(135deg,#ef4444,#dc2626)" : "rgba(255,255,255,0.05)",
                color: view === v ? "white" : "#64748b",
              }}>
                {v === "list"
                  ? (tr(trendsLang,"scheduler.viewList") || "📋 List")
                  : (tr(trendsLang,"scheduler.view30days") || "📅 30 Days")}
              </button>
            ))}
          </div>

          {/* Vue liste */}
          {view === "list" && (
            <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:10, overflowY:"auto", maxHeight: isMobile ? 300 : "calc(100vh - 260px)" }}>
              <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>
                {tr(trendsLang,"ui.publishQueue") || "PUBLICATION QUEUE"}
              </h3>
              {dbPosts.length === 0 && (
                <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang,"ui.noPostsScheduled")}</p>
              )}
              {dbPosts.map(p => (
                <div key={p.id} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12, display:"flex", gap:10 }}>
                  {p.media_url && (
                    <img src={p.media_url} alt="" style={{ width:48, height:48, objectFit:"cover", borderRadius:6, flexShrink:0 }} />
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ color:"#ef4444", fontSize:11, fontWeight:700 }}>
                        {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : p.created_at?.slice(0,16)}
                      </span>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        style={{ background:"none", border:"none", color:"#ef4444", fontSize:12, cursor:"pointer", opacity: deleting === p.id ? 0.5 : 1 }}
                      >🗑️</button>
                    </div>
                    <p style={{ color:"#94a3b8", fontSize:12, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {p.title || p.content?.slice(0, 80)}
                    </p>
                    <span style={{ color:"#22c55e", fontSize:10, fontWeight:700 }}>
                      ✓ {tr(trendsLang,"ui.scheduled")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vue calendrier 30 jours */}
          {view === "calendar" && (
            <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:6, overflowY:"auto", maxHeight: isMobile ? 300 : "calc(100vh - 260px)" }}>
              <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:4 }}>
                {tr(trendsLang,"scheduler.next30days") || "NEXT 30 DAYS"}
              </h3>
              {next30Days.map(date => {
                const posts = postsByDate[date] || [];
                return (
                  <div key={date} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", alignItems:"flex-start" }}>
                    <div style={{ width:70, flexShrink:0 }}>
                      <div style={{ color: posts.length ? "#ef4444" : "#334155", fontSize:10, fontWeight:700 }}>
                        {formatDate(date)}
                      </div>
                    </div>
                    <div style={{ flex:1 }}>
                      {posts.length === 0 ? (
                        <span style={{ color:"#1e293b", fontSize:11 }}>—</span>
                      ) : posts.map(p => (
                        <div key={p.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          {p.media_url && <img src={p.media_url} alt="" style={{ width:24, height:24, objectFit:"cover", borderRadius:4 }} />}
                          <span style={{ color:"#94a3b8", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>
                            {p.title || p.content?.slice(0,40)}
                          </span>
                          <span style={{ color:"#22c55e", fontSize:9, fontWeight:700, flexShrink:0 }}>✓</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
