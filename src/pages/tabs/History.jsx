import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

const API = "https://social-ai-app-production.up.railway.app";

export default function History({ trendsLang, isMobile, history, projects, loadHistory, setPost, setTab, token }) {

  const [activeTab,    setActiveTab]    = useState("posts");
  const [userActions,  setUserActions]  = useState([]);
  const [actionsPage,  setActionsPage]  = useState(1);
  const [actionsPages, setActionsPages] = useState(1);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [filterAction, setFilterAction] = useState("");
  const [deleteModal,  setDeleteModal]  = useState(null); // post id à supprimer
  const [assignedPosts,    setAssignedPosts]    = useState([]);
  const [assignedLoading,  setAssignedLoading]  = useState(false);
  const [assignedLoaded,   setAssignedLoaded]   = useState(false);
  const [comments,         setComments]         = useState({});
  const [commentsOpen,     setCommentsOpen]     = useState({});
  const [commentsLoading,  setCommentsLoading]  = useState({});
  const [commentInput,     setCommentInput]     = useState({});
  const [commentPosting,   setCommentPosting]   = useState(null);
  const [clients,          setClients]          = useState([]);
  const [linkingPost,      setLinkingPost]      = useState(null); // postId en cours de liaison

  const ACTION_COLORS = {
    register: "#22c55e", login: "#3b82f6", verify_email: "#22c55e",
    onboarding_done: "#8b5cf6", reset_password: "#f97316", change_password: "#f97316",
    change_email_request: "#f59e0b", change_email: "#f97316", delete_account: "#ef4444",
    generate_post: "#ef4444", save_post: "#22c55e", delete_post: "#ef4444",
    copy_post: "#64748b", rewrite_post: "#f59e0b", analyze_post: "#8b5cf6",
    generate_image: "#8b5cf6", attach_media: "#38bdf8",
    create_project: "#3b82f6", delete_project: "#ef4444",
    rename_project: "#f59e0b", save_brand_memory: "#8b5cf6",
    calendar_add_card: "#22c55e", calendar_delete_card: "#ef4444",
    calendar_move_card: "#f59e0b", calendar_edit_card: "#64748b",
    calendar_import_post: "#8b5cf6", update_profile: "#3b82f6",
    watch_search: "#22c55e", cancel_subscription: "#ef4444",
    plan_upgrade: "#22c55e", plan_downgrade: "#f59e0b",
    publish_post: "#3b82f6",
    scheduler_add: "#8b5cf6", scheduler_delete: "#ef4444",
    account_banned: "#ef4444", account_unbanned: "#22c55e",
    quota_reset: "#f59e0b",
    team_update_plan: "#8b5cf6", team_view_logs: "#64748b",
    team_role_updated: "#8b5cf6", team_removed: "#ef4444", team_joined: "#22c55e",
    team_invite: "#3b82f6", team_member_joined: "#22c55e", quota_exceeded: "#ef4444",
    post_assigned: "#60a5fa", post_assigned_to_me: "#60a5fa", team_view_assigned_posts: "#64748b",
    // Team — nouvelles actions
    post_approved:               "#22c55e",
    post_rejected:               "#ef4444",
    post_comment_added:          "#60a5fa",
    post_comment_deleted:        "#ef4444",
    post_linked_to_client:       "#a78bfa",
    post_unlinked_from_client:   "#64748b",
    team_calendar_add:           "#22c55e",
    team_calendar_move:          "#f59e0b",
    team_calendar_delete:        "#ef4444",
    team_calendar_published:     "#3b82f6",
    team_permissions_updated:    "#8b5cf6",
    agency_analytics_view:       "#ec4899",
    // Webhooks
    webhook_subscribed:          "#38bdf8",
    webhook_deleted:             "#ef4444",
    // Billing
    subscription_renewed:            "#22c55e",
    payment_failed:                  "#ef4444",
    renewal_reminder_3d:             "#f59e0b",
    renewal_reminder_30d:            "#f97316",
    grace_period_warning_24h:        "#ef4444",
    grace_period_expired_downgrade:  "#ef4444",
    winback_7d:                      "#8b5cf6",
    winback_30d:                     "#8b5cf6",
    winback_90d:                     "#8b5cf6",
    override_expired:                "#f59e0b",
    // Notifications
    notif_read:                  "#64748b",
  };

  const getActionLabel = (action) => tr(trendsLang, `ui.actionLabels.${action}`) || action;
  const getActionColor = (action) => ACTION_COLORS[action] || "#94a3b8";

  // Compatibilité avec le filtre dropdown
  const USER_ACTION_LABELS = Object.fromEntries(
    Object.keys(ACTION_COLORS).map(key => [key, { label: getActionLabel(key), color: getActionColor(key) }])
  );

  // Charger les clients agency disponibles pour liaison
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/agency/clients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.clients)) setClients(d.clients); })
      .catch(() => {});
  }, [token]);

  const linkClient = async (postId, clientId) => {
    setLinkingPost(postId);
    try {
      const r = await fetch(`${API}/team/posts/${postId}/link-client`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ client_id: clientId || null }),
      });
      const d = await r.json();
      if (d.success) {
        // Mettre à jour localement dans history
        loadHistory();
        console.log(`[History] post ${postId} linked to client ${clientId || "none"}`);
      } else {
        console.error("[History] linkClient error:", d.error);
      }
    } catch (err) {
      console.error("[History] linkClient fetch error:", err.message);
    }
    setLinkingPost(null);
  };

  const fetchAssignedPosts = async () => {
    setAssignedLoading(true);
    try {
      const r = await fetch(`${API}/team/my-assigned-posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      setAssignedPosts(d.posts || []);
      setAssignedLoaded(true);
      console.log(`[History] fetchAssignedPosts → ${d.posts?.length || 0} posts`);
    } catch (err) {
      console.error("[History] fetchAssignedPosts error:", err.message);
    }
    setAssignedLoading(false);
  };

  const fetchComments = async (postId) => {
    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const r = await fetch(`${API}/team/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      setComments(prev => ({ ...prev, [postId]: d.comments || [] }));
    } catch (err) {
      console.error("[History] fetchComments error:", err.message);
    }
    setCommentsLoading(prev => ({ ...prev, [postId]: false }));
  };

  const toggleComments = (postId) => {
    const isOpen = commentsOpen[postId];
    setCommentsOpen(prev => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen && !comments[postId]) fetchComments(postId);
  };

  const postComment = async (postId) => {
    const content = (commentInput[postId] || "").trim();
    if (!content) return;
    setCommentPosting(postId);
    try {
      const r = await fetch(`${API}/team/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const d = await r.json();
      if (d.success) {
        setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), d.comment] }));
        setCommentInput(prev => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error("[History] postComment error:", err.message);
    }
    setCommentPosting(null);
  };

  const deleteComment = async (postId, commentId) => {
    try {
      const r = await fetch(`${API}/team/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) {
        setComments(prev => ({ ...prev, [postId]: prev[postId].filter(c => c.id !== commentId) }));
      }
    } catch (err) {
      console.error("[History] deleteComment error:", err.message);
    }
  };

  const loadUserActions = async (p = 1) => {
    setActionsLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (filterAction) params.append("action", filterAction);
      const r = await fetch(`${API}/auth/user-actions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      setUserActions(d.logs || []);
      setActionsPages(d.pages || 1);
      setActionsPage(p);
    } catch {}
    setActionsLoading(false);
  };

  useEffect(() => {
    if (activeTab === "actions") loadUserActions(1);
    if (activeTab === "team" && !assignedLoaded) fetchAssignedPosts();
  }, [activeTab, filterAction]);

  const [search,       setSearch]       = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterProject,setFilterProject]= useState("all");
  const [filterScore,  setFilterScore]  = useState("all");
  const [filterMedia,  setFilterMedia]  = useState("all");
  const [sortBy,       setSortBy]       = useState("recent");
  const [copiedIdx,    setCopiedIdx]    = useState(null);
  const [deletingId,   setDeletingId]   = useState(null);
  const [loaded,       setLoaded]       = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);

  useEffect(() => {
    if (!loaded) { loadHistory(); setLoaded(true); }
  }, []);

  const projectNames = useMemo(() => {
    return [...new Set(history.map(h => h.project_name).filter(Boolean))];
  }, [history]);

  const filtered = useMemo(() => {
    let result = history.filter(h => {
      // Recherche texte
      if (search && !h.title?.toLowerCase().includes(search.toLowerCase()) && !h.content?.toLowerCase().includes(search.toLowerCase())) return false;
      // Période
      if (filterPeriod !== "all") {
        const age = Date.now() - new Date(h.created_at).getTime();
        if (filterPeriod === "today"  && age > 86400000)      return false;
        if (filterPeriod === "week"   && age > 7*86400000)    return false;
        if (filterPeriod === "month"  && age > 30*86400000)   return false;
      }
      // Projet
      if (filterProject !== "all" && h.project_name !== filterProject) return false;
      // Score viral
      if (filterScore !== "all") {
        const s = h.viral_score || 0;
        if (filterScore === "high"   && s < 70)          return false;
        if (filterScore === "medium" && (s < 50||s>=70)) return false;
        if (filterScore === "low"    && s >= 50)         return false;
      }
      // Média
      if (filterMedia === "with"    && !h.media_url) return false;
      if (filterMedia === "without" && h.media_url)  return false;
      return true;
    });

    // Tri
    if (sortBy === "recent")  result = result.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "oldest")  result = result.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === "score")   result = result.sort((a,b) => (b.viral_score||0) - (a.viral_score||0));

    return result;
  }, [history, search, filterPeriod, filterProject, filterScore, filterMedia, sortBy]);

  // Grouper par date
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(h => {
      const age = Date.now() - new Date(h.created_at).getTime();
      const days = Math.floor(age / 86400000);
      const key = days === 0 ? "today" : days === 1 ? "yesterday" : days < 7 ? "week" : days < 30 ? "month" : "older";
      if (!groups[key]) groups[key] = [];
      groups[key].push(h);
    });
    return groups;
  }, [filtered]);

  const groupLabels = {
    today:     { en:"Today", fr:"Aujourd'hui", es:"Hoy", de:"Heute", it:"Oggi", pt:"Hoje" },
    yesterday: { en:"Yesterday", fr:"Hier", es:"Ayer", de:"Gestern", it:"Ieri", pt:"Ontem" },
    week:      { en:"This week", fr:"Cette semaine", es:"Esta semana", de:"Diese Woche", it:"Questa settimana", pt:"Esta semana" },
    month:     { en:"This month", fr:"Ce mois", es:"Este mes", de:"Diesen Monat", it:"Questo mese", pt:"Este mês" },
    older:     { en:"Older", fr:"Plus ancien", es:"Más antiguo", de:"Älter", it:"Più vecchio", pt:"Mais antigo" },
  };

  const getGroupLabel = (key) => groupLabels[key]?.[trendsLang] || groupLabels[key]?.en || key;

  const hasActiveFilters = filterPeriod !== "all" || filterProject !== "all" || filterScore !== "all" || filterMedia !== "all" || sortBy !== "recent";

  const resetFilters = () => {
    setFilterPeriod("all"); setFilterProject("all");
    setFilterScore("all"); setFilterMedia("all"); setSortBy("recent"); setSearch("");
  };

  const copyPost = (content, idx) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  const loadInCreate = (content) => { setPost(content); setTab("create"); };

  const confirmDelete = (id) => setDeleteModal(id);

  const deletePost = async () => {
    if (!deleteModal) return;
    const id = deleteModal;
    setDeleteModal(null);
    setDeletingId(id);
    try {
      await fetch(`${API}/auth/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      try {
        await fetch(`${API}/auth/user-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "delete_post", details: { post_id: id } }),
        });
      } catch {}
      loadHistory();
    } catch {}
    setDeletingId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  const scoreColor = (s) => s >= 70 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel = (s) => s >= 70 ? "HIGH" : s >= 50 ? "MED" : "LOW";

  const selectStyle = {
    background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:8,
    color:"white", fontSize:11, padding:"7px 10px", cursor:"pointer", outline:"none",
  };

  return (
    <>
      {/* ── Modale confirmation suppression ── */}
      {deleteModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
          <div style={{ background:"#0f172a", border:"1px solid rgba(239,68,68,0.3)", borderRadius:16, padding:"32px 28px", maxWidth:380, width:"90%", boxShadow:"0 25px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🗑️</div>
              <div>
                <div style={{ color:"white", fontWeight:700, fontSize:15 }}>Delete Post</div>
                <div style={{ color:"#64748b", fontSize:11, marginTop:2 }}>This action cannot be undone</div>
              </div>
            </div>
            <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.6, marginBottom:24 }}>
              This post will be permanently deleted. Continue?
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={() => setDeleteModal(null)}
                style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"#94a3b8", fontSize:13, fontWeight:600, cursor:"pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={deletePost}
                style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#dc2626,#b91c1c)", color:"white", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(220,38,38,0.3)" }}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader tabKey="history" trendsLang={trendsLang} isMobile={isMobile} />

      {/* ── Onglets ── */}
      <div style={{ display:"flex", gap:4, marginBottom:14, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <button
          style={{ padding:"10px 20px", background:"none", border:"none", borderBottom: activeTab==="posts" ? "2px solid #ef4444" : "2px solid transparent", color: activeTab==="posts" ? "#ef4444" : "#475569", fontWeight:700, fontSize:12, cursor:"pointer", letterSpacing:"0.5px" }}
          onClick={() => setActiveTab("posts")}
        >✍️ {tr(trendsLang,"ui.myPosts")}</button>
        <button
          style={{ padding:"10px 20px", background:"none", border:"none", borderBottom: activeTab==="actions" ? "2px solid #8b5cf6" : "2px solid transparent", color: activeTab==="actions" ? "#8b5cf6" : "#475569", fontWeight:700, fontSize:12, cursor:"pointer", letterSpacing:"0.5px" }}
          onClick={() => setActiveTab("actions")}
        >📊 {tr(trendsLang,"ui.myActions")}</button>
        <button
          style={{ padding:"10px 20px", background:"none", border:"none", borderBottom: activeTab==="team" ? "2px solid #60a5fa" : "2px solid transparent", color: activeTab==="team" ? "#60a5fa" : "#475569", fontWeight:700, fontSize:12, cursor:"pointer", letterSpacing:"0.5px", display:"flex", alignItems:"center", gap:6 }}
          onClick={() => setActiveTab("team")}
        >
          {tr(trendsLang,"ui.team.tabMyTeamPosts") || "🎯 TEAM"}
          {assignedPosts.length > 0 && (
            <span style={{ background:"#60a5fa", color:"#fff", borderRadius:"50%", padding:"1px 5px", fontSize:9, fontWeight:800 }}>{assignedPosts.length}</span>
          )}
        </button>
      </div>

      {/* ── Onglet Mes Actions ── */}
      {activeTab === "actions" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", gap:8 }}>
            <select
              style={{ background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:8, color:"white", fontSize:11, padding:"8px 12px", cursor:"pointer", flex:1 }}
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
            >
              <option value="">🔍 {tr(trendsLang,"ui.allActions")}</option>
              {Object.entries(USER_ACTION_LABELS).map(([key, {label}]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              style={{ padding:"8px 14px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"#64748b", fontSize:11, cursor:"pointer" }}
              onClick={() => loadUserActions(1)}
            >🔄</button>
          </div>

          <div style={{ ...st.card, marginTop:0, padding:0, overflow:"hidden" }}>
            {actionsLoading ? (
              <div style={{ textAlign:"center", padding:40, color:"#475569" }}>{tr(trendsLang,"ui.loading")}</div>
            ) : userActions.length === 0 ? (
              <div style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
                <div style={{ color:"#475569", fontSize:13 }}>{tr(trendsLang,"ui.noActions")}</div>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                    {[tr(trendsLang,"ui.date"), tr(trendsLang,"ui.action"), tr(trendsLang,"ui.details")].map(h => (
                      <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userActions.map(log => {
                    const cfg = USER_ACTION_LABELS[log.action] || { label: log.action, color:"#94a3b8" };
                    return (
                      <tr key={log.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding:"12px 16px", color:"#475569", fontSize:11, whiteSpace:"nowrap" }}>
                          {new Date(log.created_at).toLocaleString(trendsLang === "fr" ? "fr-FR" : trendsLang === "de" ? "de-DE" : trendsLang === "es" ? "es-ES" : trendsLang === "it" ? "it-IT" : trendsLang === "pt" ? "pt-PT" : "en-GB")}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ background:`${cfg.color}15`, border:`1px solid ${cfg.color}40`, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, color:cfg.color }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11 }}>
                          {log.details ? (() => { try { const d = typeof log.details === "string" ? JSON.parse(log.details) : log.details; return JSON.stringify(d).slice(0, 80); } catch { return String(log.details).slice(0, 80); } })() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {actionsPages > 1 && (
            <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
              {Array.from({ length: actionsPages }, (_, i) => i + 1).map(p => (
                <button key={p}
                  style={{ width:32, height:32, borderRadius:8, border:`1px solid ${actionsPage===p?"rgba(139,92,246,0.4)":"rgba(255,255,255,0.1)"}`, background: actionsPage===p?"rgba(139,92,246,0.15)":"rgba(255,255,255,0.04)", color: actionsPage===p?"#a78bfa":"#64748b", fontSize:12, cursor:"pointer" }}
                  onClick={() => loadUserActions(p)}
                >{p}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Mes Posts ── */}
      {activeTab === "posts" && (<>

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap:10, marginBottom:14 }}>
        {[
          { icon:"✍️", label: tr(trendsLang,"ui.totalPosts"),    value: history.length,   color:"#ef4444" },
          { icon:"📁", label: tr(trendsLang,"ui.statProjects"),  value: projects.length,  color:"#8b5cf6" },
          { icon:"📅", label: tr(trendsLang,"ui.thisWeekLabel"), value: history.filter(h => h.created_at && Date.now()-new Date(h.created_at).getTime() < 7*86400000).length, color:"#22c55e" },
          { icon:"🔍", label: tr(trendsLang,"ui.filteredLabel"), value: filtered.length,  color:"#f59e0b" },
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

      {/* ── Barre recherche + filtres ── */}
      <div style={{ ...st.card, marginTop:0, padding:"14px 16px", marginBottom:14 }}>
        {/* Ligne 1 : Search + toggle filtres */}
        <div style={{ display:"flex", gap:8, marginBottom: showFilters ? 12 : 0 }}>
          <input
            style={{ ...st.input, marginBottom:0, flex:1, fontSize:12 }}
            placeholder={`🔍 ${tr(trendsLang,"ui.searchPosts")}`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${hasActiveFilters ? "rgba(220,38,38,0.4)" : "rgba(255,255,255,0.1)"}`, background: hasActiveFilters ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.04)", color: hasActiveFilters ? "#ef4444" : "#64748b", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}
            onClick={() => setShowFilters(!showFilters)}
          >
            ⚙️ {tr(trendsLang,"ui.filters")} {hasActiveFilters && "●"}
          </button>
          <button
            style={{ padding:"8px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#64748b", fontSize:11, cursor:"pointer", flexShrink:0 }}
            onClick={loadHistory}
          >🔄</button>
        </div>

        {/* Ligne 2 : Filtres dépliables */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", paddingTop:4 }}>

              <select style={selectStyle} value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
                <option value="all">📅 Toute période</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>

              <select style={selectStyle} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                <option value="all">📁 Tous projets</option>
                {projectNames.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select style={selectStyle} value={filterScore} onChange={e => setFilterScore(e.target.value)}>
                <option value="all">⚡ Tous scores</option>
                <option value="high">🟢 High (70+)</option>
                <option value="medium">🟡 Medium (50-70)</option>
                <option value="low">🔴 Low (&lt;50)</option>
              </select>

              <select style={selectStyle} value={filterMedia} onChange={e => setFilterMedia(e.target.value)}>
                <option value="all">🖼️ Tous médias</option>
                <option value="with">Avec média</option>
                <option value="without">Sans média</option>
              </select>

              <select style={selectStyle} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="recent">↓ Plus récent</option>
                <option value="oldest">↑ Plus ancien</option>
                <option value="score">⚡ Meilleur score</option>
              </select>

              {hasActiveFilters && (
                <button onClick={resetFilters} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)", color:"#ef4444", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                  ✕ Reset
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Liste des posts groupés ── */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {filtered.length === 0 ? (
          <div style={{ ...st.card, marginTop:0, textAlign:"center", padding:"48px 20px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ color:"#475569", fontSize:14, fontWeight:700, marginBottom:6 }}>
              {search || hasActiveFilters ? "Aucun post ne correspond à ces filtres" : tr(trendsLang,"ui.noHistoryLoaded")}
            </div>
            <div style={{ color:"#334155", fontSize:12 }}>
              {hasActiveFilters ? <button onClick={resetFilters} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:12, fontWeight:700 }}>Réinitialiser les filtres</button> : tr(trendsLang,"ui.generateSave")}
            </div>
          </div>
        ) : (
          ["today","yesterday","week","month","older"].map(groupKey => {
            const posts = grouped[groupKey];
            if (!posts?.length) return null;
            return (
              <div key={groupKey}>
                {/* Label du groupe */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <div style={{ color:"#334155", fontSize:10, fontWeight:700, letterSpacing:"1.5px", whiteSpace:"nowrap" }}>
                    {getGroupLabel(groupKey).toUpperCase()}
                  </div>
                  <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.04)" }} />
                  <div style={{ color:"#334155", fontSize:10 }}>{posts.length} post{posts.length > 1 ? "s" : ""}</div>
                </div>

                {/* Posts du groupe */}
                <div style={{ ...st.card, marginTop:0, padding: isMobile ? 10 : 16, display:"flex", flexDirection:"column", gap:6 }}>
                  <AnimatePresence>
                    {posts.map((h, i) => (
                      <motion.div key={h.id || i}
                        initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                        transition={{ duration:0.2, delay: i * 0.02 }}
                        whileHover={{ background:"rgba(220,38,38,0.03)" }}
                        style={{
                          padding:"12px 14px", borderRadius:10,
                          border:"1px solid rgba(255,255,255,0.05)",
                          background:"rgba(255,255,255,0.01)",
                          transition:"background 0.15s",
                        }}
                      >
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>

                          {/* Thumbnail */}
                          {h.media_url && (
                            <div style={{ flexShrink:0, width:48, height:48, borderRadius:8, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
                              <img src={h.media_url} alt="media" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                            </div>
                          )}

                          {/* Contenu */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                              <span style={{ color:"#e2e8f0", fontSize:12, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth: isMobile ? 140 : 280 }}>
                                {h.title || h.content?.split(" ").slice(0,5).join(" ") + "..." || tr(trendsLang,"ui.untitledLabel")}
                              </span>
                              {h.project_name && (
                                <span style={{ background:"rgba(139,92,246,0.12)", color:"#a78bfa", fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:8, flexShrink:0 }}>
                                  📁 {h.project_name}
                                </span>
                              )}
                              {h.viral_score > 0 && (
                                <span style={{ background:`${scoreColor(h.viral_score)}15`, border:`1px solid ${scoreColor(h.viral_score)}40`, color:scoreColor(h.viral_score), fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:8, flexShrink:0 }}>
                                  ⚡ {h.viral_score} {scoreLabel(h.viral_score)}
                                </span>
                              )}
                            </div>
                            <p style={{ color:"#64748b", fontSize:11, lineHeight:1.5, margin:0, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                              {h.content?.slice(0, 140)}...
                            </p>
                          </div>

                          {/* Date + Actions */}
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                            <span style={{ color:"#334155", fontSize:10 }}>{formatDate(h.created_at)}</span>
                            {/* Badge client si lié */}
                            {h.client_id && clients.length > 0 && (() => {
                              const c = clients.find(cl => cl.id === h.client_id);
                              return c ? (
                                <span style={{ background:`${c.color}15`, border:`1px solid ${c.color}40`, color:c.color, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:10, maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                  🏢 {c.name}
                                </span>
                              ) : null;
                            })()}
                            <div style={{ display:"flex", gap:4 }}>
                              {/* Dropdown client */}
                              {clients.length > 0 && (
                                <select
                                  value={h.client_id || ""}
                                  disabled={linkingPost === h.id}
                                  onChange={e => linkClient(h.id, e.target.value || null)}
                                  onClick={e => e.stopPropagation()}
                                  title={tr(trendsLang,"ui.team.linkToClient") || "Link to client"}
                                  style={{ background:"#0f172a", border:`1px solid ${h.client_id ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius:6, padding:"3px 6px", color: h.client_id ? "#a78bfa" : "#475569", fontSize:9, outline:"none", cursor:"pointer", maxWidth:80, opacity: linkingPost === h.id ? 0.6 : 1 }}
                                >
                                  <option value="">🏢 —</option>
                                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              )}
                              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                                style={{ padding:"4px 8px", borderRadius:6, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color: copiedIdx===h.id ? "#22c55e" : "#64748b", fontSize:10, fontWeight:700, cursor:"pointer" }}
                                onClick={() => copyPost(h.content, h.id)}
                              >
                                {copiedIdx === h.id ? "✓" : tr(trendsLang,"ui.copyBtn")}
                              </motion.button>
                              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                                style={{ padding:"4px 8px", borderRadius:6, border:"1px solid rgba(220,38,38,0.2)", background:"rgba(220,38,38,0.08)", color:"#ef4444", fontSize:10, fontWeight:700, cursor:"pointer" }}
                                onClick={() => loadInCreate(h.content)}
                              >
                                {tr(trendsLang,"ui.editBtn")} →
                              </motion.button>
                              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                                style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${commentsOpen[h.id] ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.08)"}`, background: commentsOpen[h.id] ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.03)", color: commentsOpen[h.id] ? "#60a5fa" : "#64748b", fontSize:10, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}
                                onClick={() => toggleComments(h.id)}
                              >
                                💬 {comments[h.id]?.length || ""}
                              </motion.button>
                              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                                style={{ padding:"4px 8px", borderRadius:6, border:"1px solid rgba(239,68,68,0.15)", background:"rgba(239,68,68,0.05)", color:"#475569", fontSize:10, cursor:"pointer", opacity: deletingId===h.id ? 0.5 : 1 }}
                                onClick={() => confirmDelete(h.id)}
                                disabled={deletingId===h.id}
                              >
                                🗑️
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        {/* ── Panel commentaires ── */}
                        {commentsOpen[h.id] && (
                          <div style={{ marginTop:10, borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:10 }}>
                            {commentsLoading[h.id] ? (
                              <div style={{ color:"#475569", fontSize:11, textAlign:"center", padding:6 }}>⏳</div>
                            ) : (
                              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:8 }}>
                                {(comments[h.id] || []).length === 0 && (
                                  <div style={{ color:"#334155", fontSize:11, textAlign:"center", padding:"6px 0" }}>{tr(trendsLang,"ui.team.noComments") || "No comments yet"}</div>
                                )}
                                {(comments[h.id] || []).map(c => (
                                  <div key={c.id} style={{ display:"flex", gap:7, alignItems:"flex-start" }}>
                                    <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(96,165,250,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800, color:"#60a5fa", flexShrink:0 }}>
                                      {(c.display_name || c.first_name || c.email || "?")[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex:1, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:7, padding:"6px 9px" }}>
                                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                                        <span style={{ color:"#60a5fa", fontSize:9, fontWeight:700 }}>{c.display_name || c.first_name || c.email?.split("@")[0]}</span>
                                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                          <span style={{ color:"#334155", fontSize:9 }}>{new Date(c.created_at).toLocaleString()}</span>
                                          <button onClick={() => deleteComment(h.id, c.id)} style={{ background:"none", border:"none", color:"#475569", fontSize:9, cursor:"pointer", padding:0, lineHeight:1 }}>✕</button>
                                        </div>
                                      </div>
                                      <div style={{ color:"#94a3b8", fontSize:11, lineHeight:1.5 }}>{c.content}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div style={{ display:"flex", gap:5 }}>
                              <input
                                value={commentInput[h.id] || ""}
                                onChange={e => setCommentInput(prev => ({ ...prev, [h.id]: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && !e.shiftKey && postComment(h.id)}
                                placeholder={tr(trendsLang,"ui.team.commentPlaceholder") || "Add a comment..."}
                                style={{ flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:7, padding:"6px 9px", color:"#e2e8f0", fontSize:11, outline:"none", fontFamily:"inherit" }}
                              />
                              <button
                                onClick={() => postComment(h.id)}
                                disabled={commentPosting === h.id || !commentInput[h.id]?.trim()}
                                style={{ background:"linear-gradient(135deg,#60a5fa,#3b82f6)", border:"none", borderRadius:7, color:"#fff", fontSize:10, fontWeight:700, padding:"6px 11px", cursor:"pointer", opacity: commentPosting === h.id || !commentInput[h.id]?.trim() ? 0.5 : 1 }}
                              >{commentPosting === h.id ? "⏳" : tr(trendsLang,"ui.team.send") || "Send"}</button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
      </div>
      </>)}
      {/* ── Onglet Team (posts assignés au membre) ── */}
      {activeTab === "team" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:14 }}>🎯 {tr(trendsLang,"ui.team.myAssignedPosts") || "Posts assigned to me"}</div>
              <div style={{ color:"#475569", fontSize:12, marginTop:2 }}>{tr(trendsLang,"ui.team.myAssignedDesc") || "Posts your team owner assigned to you for review"}</div>
            </div>
            <button
              onClick={fetchAssignedPosts}
              style={{ padding:"7px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#64748b", fontSize:11, cursor:"pointer" }}
            >🔄</button>
          </div>

          {assignedLoading ? (
            <div style={{ textAlign:"center", padding:40, color:"#475569" }}>{tr(trendsLang,"ui.loading") || "Loading..."}</div>
          ) : assignedPosts.length === 0 ? (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"48px 24px", textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
              <div style={{ color:"#475569", fontSize:14, fontWeight:700, marginBottom:6 }}>{tr(trendsLang,"ui.team.noAssignedPosts") || "No posts assigned yet"}</div>
              <div style={{ color:"#334155", fontSize:12 }}>{tr(trendsLang,"ui.team.noAssignedDesc") || "Your team owner will assign posts here for you to review."}</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {assignedPosts.map(p => {
                const statusColors = {
                  pending_approval: "#f59e0b",
                  approved: "#22c55e",
                  rejected: "#ef4444",
                };
                const statusColor = statusColors[p.approval_status] || "#64748b";
                const statusEmoji = {
                  pending_approval: "⏳",
                  approved: "✅",
                  rejected: "❌",
                }[p.approval_status] || "📄";
                return (
                  <div key={p.id} style={{
                    background:"rgba(96,165,250,0.04)",
                    border:"1px solid rgba(96,165,250,0.15)",
                    borderLeft:`3px solid #60a5fa`,
                    borderRadius:10,
                    padding:"14px 16px",
                  }}>
                    {/* Header card */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:700, marginBottom:2 }}>
                          {p.title || p.content?.split(" ").slice(0,6).join(" ") + "..."}
                        </div>
                        <div style={{ color:"#64748b", fontSize:10 }}>
                          {tr(trendsLang,"ui.team.by") || "by"} {p.author_name || p.author_email}
                          {p.project_name && <span style={{ marginLeft:6, background:"rgba(139,92,246,0.12)", color:"#a78bfa", fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:6 }}>📁 {p.project_name}</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                        <span style={{ background:`${statusColor}15`, border:`1px solid ${statusColor}40`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:statusColor }}>
                          {statusEmoji} {(p.approval_status || "draft").toUpperCase().replace("_", " ")}
                        </span>
                        {p.viral_score > 0 && (
                          <span style={{ fontSize:10, color: p.viral_score >= 70 ? "#22c55e" : p.viral_score >= 50 ? "#f59e0b" : "#ef4444", fontWeight:700 }}>
                            ⚡ {p.viral_score}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Media */}
                    {p.media_url && (
                      <img src={p.media_url} alt="" style={{ width:"100%", maxHeight:100, objectFit:"cover", borderRadius:6, marginBottom:8 }} />
                    )}

                    {/* Contenu */}
                    <p style={{ color:"#94a3b8", fontSize:12, lineHeight:1.5, margin:"0 0 10px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
                      {p.content?.slice(0, 280)}{p.content?.length > 280 ? "..." : ""}
                    </p>

                    {/* Actions */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ color:"#334155", fontSize:10 }}>
                        {new Date(p.updated_at || p.created_at).toLocaleDateString()}
                      </span>
                      <div style={{ display:"flex", gap:6 }}>
                        <button
                          onClick={() => { navigator.clipboard.writeText(p.content || ""); }}
                          style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#64748b", fontSize:10, fontWeight:700, cursor:"pointer" }}
                        >{tr(trendsLang,"ui.copyBtn") || "Copy"}</button>
                        <button
                          onClick={() => { setPost(p.content); setTab("create"); }}
                          style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(220,38,38,0.2)", background:"rgba(220,38,38,0.08)", color:"#ef4444", fontSize:10, fontWeight:700, cursor:"pointer" }}
                        >{tr(trendsLang,"ui.editBtn") || "Edit"} →</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </>
  );
}
