import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

const API = "https://social-ai-app-production.up.railway.app";

export default function History({ trendsLang, isMobile, history, projects, loadHistory, setPost, setTab, token }) {

  const [search,        setSearch]        = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [copiedIdx,     setCopiedIdx]     = useState(null);
  const [loaded,        setLoaded]        = useState(false);

  // Auto-load au montage
  useEffect(() => {
    if (!loaded) {
      loadHistory();
      setLoaded(true);
    }
  }, []);

  // Projets uniques dans l'historique
  const projectNames = useMemo(() => {
    const names = [...new Set(history.map(h => h.project_name).filter(Boolean))];
    return names;
  }, [history]);

  // Filtrage
  const filtered = useMemo(() => {
    return history.filter(h => {
      const matchSearch  = !search || h.title?.toLowerCase().includes(search.toLowerCase()) || h.content?.toLowerCase().includes(search.toLowerCase());
      const matchProject = filterProject === "all" || h.project_name === filterProject;
      return matchSearch && matchProject;
    });
  }, [history, search, filterProject]);

  const copyPost = (content, idx) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  const loadInCreate = (content) => {
    setPost(content);
    setTab("create");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return tr(trendsLang, "ui.todayLabel");
    if (days === 1) return tr(trendsLang, "ui.yesterdayLabel");
    if (days < 7)  return `${days}${tr(trendsLang, "ui.daysAgoLabel")}`;
    return d.toLocaleDateString();
  };

  return (
    <>
      <PageHeader tabKey="history" trendsLang={trendsLang} isMobile={isMobile} />

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap:10, marginBottom:14 }}>
        {[
          { icon:"✍️", label: tr(trendsLang,"ui.totalPosts"),   value: history.length,    color:"#ef4444" },
          { icon:"📁", label: tr(trendsLang,"ui.statProjects"), value: projects.length,   color:"#8b5cf6" },
          { icon:"📅", label: tr(trendsLang,"ui.thisWeekLabel"),                      value: history.filter(h => h.created_at && Date.now()-new Date(h.created_at).getTime() < 7*86400000).length, color:"#22c55e" },
          { icon:"🔍", label: tr(trendsLang,"ui.filteredLabel"),                       value: filtered.length,   color:"#f59e0b" },
        ].map(({ icon, label, value, color }) => (
          <motion.div key={label} whileHover={{ y:-3 }}
            style={{ ...st.card, marginTop:0, padding:"14px 16px", borderLeft:`3px solid ${color}40` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"1.5px" }}>{label.toUpperCase()}</div>
              <span style={{ fontSize:14 }}>{icon}</span>
            </div>
            <div style={{ color, fontSize:28, fontWeight:900, lineHeight:1 }}>{value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Barre recherche + filtre ──────────────────────────────────────── */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <input
          style={{ ...st.input, marginBottom:0, flex:1, minWidth:200, fontSize:12 }}
          placeholder={`🔍 ${tr(trendsLang,"ui.searchPosts")}`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{ ...st.input, marginBottom:0, fontSize:12, minWidth:160 }}
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
        >
          <option value="all">📁 {tr(trendsLang,"ui.statProjects") || "All projects"}</option>
          {projectNames.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          style={{ ...st.buttonSecondary, margin:0, fontSize:11, padding:"10px 16px", whiteSpace:"nowrap" }}
          onClick={loadHistory}
        >
          🔄 {tr(trendsLang,"ui.loadHistory") || "Refresh"}
        </button>
      </div>

      {/* ── Liste des posts ───────────────────────────────────────────────── */}
      <div style={{ ...st.card, marginTop:0, padding: isMobile ? 12 : 20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>
            {tr(trendsLang,"ui.contentHistory") || "CONTENT HISTORY"}
          </div>
          {filtered.length > 0 && (
            <div style={{ color:"#334155", fontSize:10 }}>{filtered.length} post{filtered.length > 1 ? "s" : ""}</div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 20px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ color:"#475569", fontSize:14, fontWeight:700, marginBottom:6 }}>
              {search || filterProject !== "all" ? tr(trendsLang,"ui.noPostsMatch") : tr(trendsLang,"ui.noHistoryLoaded")}
            </div>
            <div style={{ color:"#334155", fontSize:12 }}>
              {search || filterProject !== "all" ? tr(trendsLang,"ui.tryFilters") : tr(trendsLang,"ui.generateSave")}
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <AnimatePresence>
              {filtered.map((h, i) => (
                <motion.div key={h.id || i}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.2, delay: i * 0.03 }}
                  whileHover={{ background:"rgba(220,38,38,0.03)" }}
                  style={{
                    padding:"14px 16px", borderRadius:12,
                    border:"1px solid rgba(255,255,255,0.06)",
                    background:"rgba(255,255,255,0.01)",
                    transition:"background 0.15s",
                  }}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>

                    {/* Thumbnail média */}
                    {h.media_url && (
                      <div style={{ flexShrink:0, width:56, height:56, borderRadius:8, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
                        <img src={h.media_url} alt="media" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                    )}

                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Titre + projet */}
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ color:"#e2e8f0", fontSize:13, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth: isMobile ? 160 : 300 }}>
                          {h.title || tr(trendsLang,"ui.untitledLabel")}
                        </span>
                        {h.project_name && (
                          <span style={{ background:"rgba(139,92,246,0.12)", color:"#a78bfa", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10, letterSpacing:"0.5px", flexShrink:0 }}>
                            📁 {h.project_name}
                          </span>
                        )}
                      </div>

                      {/* Aperçu contenu */}
                      <p style={{ color:"#64748b", fontSize:12, lineHeight:1.5, margin:0,
                        overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                        {h.content?.slice(0, 160)}...
                      </p>
                    </div>

                    </div>

                    {/* Date + actions */}
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                      <span style={{ color:"#334155", fontSize:10 }}>{formatDate(h.created_at)}</span>
                      <div style={{ display:"flex", gap:6 }}>
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color: copiedIdx===i ? "#22c55e" : "#64748b", fontSize:10, fontWeight:700, cursor:"pointer" }}
                          onClick={() => copyPost(h.content, i)}
                        >
                          {copiedIdx === i ? "✓" : tr(trendsLang,"ui.copyBtn")}
                        </motion.button>
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(220,38,38,0.2)", background:"rgba(220,38,38,0.08)", color:"#ef4444", fontSize:10, fontWeight:700, cursor:"pointer" }}
                          onClick={() => loadInCreate(h.content)}
                        >
                          {tr(trendsLang,"ui.editBtn")} →
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
