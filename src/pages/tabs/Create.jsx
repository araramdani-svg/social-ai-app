import { useState, useEffect } from "react";
import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";
import { motion, AnimatePresence } from "framer-motion";

const API = "https://social-ai-app-production.up.railway.app";

const SCORE_COLOR = (s) => s >= 75 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";
const PRED_COLOR  = { VIRAL:"#22c55e", HIGH:"#60a5fa", MEDIUM:"#f59e0b", LOW:"#ef4444" };

export default function Create({
  trendsLang, isMobile, token, plan,
  post, setPost, topic, setTopic, projectTitle, setProjectTitle,
  searchProject, setSearchProject, selectedProject, filteredProjects,
  renameValue, setRenameValue, saveStatus, loading,
  postMetrics,
  savePost, copyPost, exportPost, analyze, generatePlanner,
  generate, rewrite, createProject, duplicateProject, renameProject, deleteProject, selectProject,
  projectPosts,
}) {
  const [activePanel,   setActivePanel]   = useState("generate");
  const [showHistory,   setShowHistory]   = useState(false);
  const [showRename,    setShowRename]    = useState(false);
  const [repurposeUrl,  setRepurposeUrl]  = useState("");
  const [repurposeText, setRepurposeText] = useState("");
  const [repurposing,   setRepurposing]   = useState(false);
  const [hooks,         setHooks]         = useState([]);
  const [hooksLoading,  setHooksLoading]  = useState(false);
  const [viralScore,    setViralScore]    = useState(null);
  const [scoring,       setScoring]       = useState(false);
  const [voiceStyle,    setVoiceStyle]    = useState(null);
  const [voiceLoaded,   setVoiceLoaded]   = useState(false);
  const [multiLoading,  setMultiLoading]  = useState(false);
  const [multiResult,   setMultiResult]   = useState(null);
  const [multiTab,      setMultiTab]      = useState("thread");
  const [copiedIdx,     setCopiedIdx]     = useState(null);
  const [imgLoading,    setImgLoading]    = useState(false);
  const [imgResult,     setImgResult]     = useState(null);
  const [imgFormat,     setImgFormat]     = useState("square");
  const [imgType,       setImgType]       = useState("illustrative");
  const [imgTab,        setImgTab]        = useState("illustrative");
  const [mediaLoading,  setMediaLoading]  = useState(false);
  const [mediaResult,   setMediaResult]   = useState(null);
  const [mediaTab,      setMediaTab]      = useState("photo");
  const [selectedMedia, setSelectedMedia] = useState(null);

  const isPro = plan === "Pro" || plan === "Business" || plan === "Agency";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const generateImage = async (type) => {
    if (!post || post.length < 30) return;
    setImgLoading(true);
    setImgResult(null);
    try {
      const route = type === "visual" ? "/generate/visual" : "/generate/image";
      const body  = type === "visual"
        ? { post, format: imgFormat }
        : { post, format: imgFormat, style: imgType };
      const r = await fetch(`${API}${route}`, { method:"POST", headers, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.imageUrl) setImgResult({ ...d, type });
    } catch {}
    setImgLoading(false);
  };

  const searchMedia = async () => {
    if (!post || post.length < 30) return;
    setMediaLoading(true);
    setMediaResult(null);
    setSelectedMedia(null);
    try {
      const r = await fetch(`${API}/generate/media`, { method:"POST", headers, body: JSON.stringify({ post, type: "both" }) });
      const d = await r.json();
      setMediaResult(d);
    } catch {}
    setMediaLoading(false);
  };

  // Voice learning
  useEffect(() => {
    if (!token || voiceLoaded) return;
    fetch(`${API}/generate/voice-style`, { method:"POST", headers, body: JSON.stringify({ lang: trendsLang }) })
      .then(r => r.json())
      .then(d => { if (d.style) setVoiceStyle(d.style); setVoiceLoaded(true); })
      .catch(() => setVoiceLoaded(true));
  }, [token]);

  // Viral score auto
  useEffect(() => {
    if (!post || post.length < 100) { setViralScore(null); return; }
    const t = setTimeout(async () => {
      setScoring(true);
      try {
        const r = await fetch(`${API}/generate/viral-score`, { method:"POST", headers, body: JSON.stringify({ text: post, lang: trendsLang }) });
        const d = await r.json();
        if (d.score) setViralScore(d);
      } catch {}
      setScoring(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [post]);

  const repurpose = async () => {
    if (!repurposeUrl && !repurposeText) return;
    setRepurposing(true);
    try {
      const r = await fetch(`${API}/generate/repurpose`, { method:"POST", headers, body: JSON.stringify({ url: repurposeUrl || null, text: repurposeText || null, lang: trendsLang, voiceStyle }) });
      const d = await r.json();
      if (d.text) { setPost(d.text); setActivePanel("generate"); }
    } catch {}
    setRepurposing(false);
  };

  const repurposeMulti = async () => {
    if (!post || post.length < 30) return;
    setMultiLoading(true); setMultiResult(null);
    try {
      const r = await fetch(`${API}/generate/repurpose-multi`, { method:"POST", headers, body: JSON.stringify({ post, lang: trendsLang, voiceStyle }) });
      const d = await r.json();
      if (d.thread || d.newsletter || d.carouselSlides) { setMultiResult(d); setMultiTab("thread"); }
    } catch {}
    setMultiLoading(false);
  };

  const generateHooks = async () => {
    if (!topic) return;
    setHooksLoading(true); setHooks([]);
    try {
      const r = await fetch(`${API}/generate/hooks`, { method:"POST", headers, body: JSON.stringify({ topic, lang: trendsLang, voiceStyle }) });
      const d = await r.json();
      if (d.hooks) setHooks(d.hooks);
    } catch {}
    setHooksLoading(false);
  };

  const copyTweet = (text, idx) => { navigator.clipboard.writeText(text).then(() => { setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500); }); };
  const copyNewsletter = () => {
    if (!multiResult?.newsletter) return;
    const n = multiResult.newsletter;
    navigator.clipboard.writeText(`Subject: ${n.subject}\n\n${n.intro}\n\n${n.body}\n\n${n.cta}${n.ps ? `\n\nP.S. ${n.ps}` : ""}`);
  };

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const chip = (active) => ({
    flex:1, padding:"8px 6px", background: active ? "rgba(220,38,38,0.12)" : "transparent",
    border:"none", borderBottom: active ? "2px solid #ef4444" : "2px solid transparent",
    color: active ? "#ef4444" : "#475569", fontWeight:700, fontSize:10,
    letterSpacing:"1px", cursor:"pointer", transition:"all 0.15s",
  });

  const rewriteChip = (label, mode, color="#64748b") => (
    <motion.button
      key={mode} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
      style={{ padding:"6px 12px", borderRadius:20, border:`1px solid rgba(255,255,255,0.08)`, background:"rgba(255,255,255,0.03)", color, fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:"0.5px" }}
      onClick={() => rewrite(mode)}
    >{label}</motion.button>
  );

  return (
    <>
      <PageHeader tabKey="create" trendsLang={trendsLang} isMobile={isMobile} />

      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "340px 1fr", gap:14, alignItems:"start" }}>

        <div style={{ display:"flex", flexDirection:"column", gap:10, position: isMobile ? "static" : "sticky", top:0, maxHeight: isMobile ? "auto" : "100vh", overflowY: isMobile ? "visible" : "auto" }}>

          {voiceStyle && (
            <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
              style={{ background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16 }}>🧠</span>
              <div>
                <div style={{ color:"#818cf8", fontSize:9, fontWeight:700, letterSpacing:"1.5px" }}>{tr(trendsLang,"ui.voiceLearningActive")}</div>
                <div style={{ color:"#475569", fontSize:10, marginTop:1 }}>
                  {voiceStyle.tone} · {voiceStyle.avgSentenceLength} {tr(trendsLang,"ui.voiceSentences")}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Projet ───────────────────────────────────────────────────── */}
          <div style={{ ...st.card, marginTop:0, padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>{tr(trendsLang,"ui.project")}</div>
              {selectedProject && (
                <button onClick={() => setShowRename(r => !r)} style={{ background:"transparent", border:"none", color:"#475569", fontSize:10, cursor:"pointer" }}>
                  {showRename ? "✕" : "✏️"}
                </button>
              )}
            </div>

            <input
              style={{ ...st.input, marginBottom:8, fontSize:11 }}
              placeholder={tr(trendsLang,"ui.phSearchProject")}
              value={searchProject}
              onChange={e => setSearchProject(e.target.value)}
            />
            <select
              style={{ ...st.input, marginBottom:8, width:"100%", boxSizing:"border-box", fontSize:11 }}
              value={selectedProject}
              onChange={e => selectProject(e.target.value)}
            >
              <option value="">{tr(trendsLang,"ui.selectProject")}</option>
              {filteredProjects.map(p => <option key={p.name}>{p.name}</option>)}
            </select>

            {/* Créer nouveau projet */}
            <div style={{ display:"flex", gap:6 }}>
              <input
                style={{ ...st.input, marginBottom:0, flex:1, fontSize:11, borderColor:"rgba(220,38,38,0.35)" }}
                placeholder={tr(trendsLang,"ui.phProjectTitle")}
                value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createProject()}
              />
              <button style={{ ...st.button, margin:0, fontSize:11, padding:"10px 12px", flexShrink:0 }} onClick={createProject}>+</button>
            </div>

            {/* Actions projet */}
            {selectedProject && (
              <div style={{ display:"flex", gap:6, marginTop:8 }}>
                <button style={{ ...st.buttonSecondary, margin:0, flex:1, fontSize:10, padding:"8px" }} onClick={duplicateProject}>
                  {tr(trendsLang,"ui.duplicate")}
                </button>
                <button style={{ ...st.buttonDanger, margin:0, fontSize:10, padding:"8px 12px" }} onClick={() => deleteProject(selectedProject)}>✕</button>
              </div>
            )}

            {/* Rename inline */}
            <AnimatePresence>
              {showRename && selectedProject && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  style={{ overflow:"hidden", marginTop:8 }}>
                  <div style={{ display:"flex", gap:6 }}>
                    <input
                      style={{ ...st.input, marginBottom:0, flex:1, fontSize:11 }}
                      placeholder={tr(trendsLang,"ui.phRenameProject")}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                    />
                    <button style={{ ...st.button, margin:0, fontSize:11, padding:"10px 12px" }} onClick={() => { renameProject(); setShowRename(false); }}>
                      {tr(trendsLang,"ui.rename")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Historique du projet ──────────────────────────────────────── */}
          <AnimatePresence>
            {selectedProject && projectPosts && projectPosts.length > 0 && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ ...st.card, marginTop:0, padding:0, overflow:"hidden" }}>
                <button onClick={() => setShowHistory(h => !h)}
                  style={{ width:"100%", padding:"12px 16px", background:"transparent", border:"none", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13 }}>📋</span>
                    <span style={{ color:"#64748b", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>HISTORIQUE</span>
                    <span style={{ background:"rgba(220,38,38,0.15)", color:"#ef4444", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>
                      {projectPosts.length}
                    </span>
                  </div>
                  <span style={{ color:"#334155", fontSize:10 }}>{showHistory ? "▲" : "▼"}</span>
                </button>
                <AnimatePresence>
                  {showHistory && (
                    <motion.div initial={{ height:0 }} animate={{ height:"auto" }} exit={{ height:0 }}
                      style={{ overflow:"hidden", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ maxHeight:220, overflowY:"auto" }}>
                        {projectPosts.map((p, i) => (
                          <motion.div key={p.id || i} whileHover={{ background:"rgba(220,38,38,0.05)" }}
                            onClick={() => setPost(p.content)}
                            style={{ padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                              <span style={{ color:"#94a3b8", fontSize:11, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"65%" }}>
                                {p.title || "Untitled"}
                              </span>
                              <span style={{ color:"#334155", fontSize:9, flexShrink:0 }}>
                                {new Date(p.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ color:"#475569", fontSize:10, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {p.content?.slice(0, 70)}...
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Panneau génération ─────────────────────────────────────────── */}
          <div style={{ ...st.card, marginTop:0, padding:0, overflow:"hidden" }}>
            <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <button style={chip(activePanel==="generate")}  onClick={() => setActivePanel("generate")}>✍️ {tr(trendsLang,"ui.panelGenerate")}</button>
              <button style={chip(activePanel==="repurpose")} onClick={() => setActivePanel("repurpose")}>🔗 {tr(trendsLang,"ui.panelRepurpose")}</button>
              <button style={chip(activePanel==="hooks")}     onClick={() => setActivePanel("hooks")}>⚡ {tr(trendsLang,"ui.panelHooks")}</button>
            </div>

            <div style={{ padding:14 }}>
              {/* Generate */}
              {activePanel === "generate" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <input
                    style={{ ...st.input, marginBottom:0, fontSize:12 }}
                    placeholder={tr(trendsLang,"ui.phTopic")}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !loading && generate()}
                  />
                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale:0.98 }}
                    style={{ ...st.button, margin:0, width:"100%", opacity: loading ? 0.7 : 1, fontSize:13 }}
                    disabled={loading} onClick={generate}
                  >
                    {loading ? tr(trendsLang,"ui.aiWriting") : tr(trendsLang,"ui.generateBtn")}
                    {voiceStyle && !loading && " 🧠"}
                  </motion.button>
                  {topic && (
                    <button
                      style={{ ...st.buttonSecondary, margin:0, width:"100%", fontSize:11, padding:"9px" }}
                      onClick={() => { setActivePanel("hooks"); generateHooks(); }}
                      disabled={hooksLoading}
                    >
                      {hooksLoading ? `⏳ ${tr(trendsLang,"ui.generating")}...` : `⚡ ${tr(trendsLang,"ui.generate5hooksBtn")}`}
                    </button>
                  )}
                </div>
              )}

              {/* Repurpose */}
              {activePanel === "repurpose" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <input
                    style={{ ...st.input, marginBottom:0, fontSize:11 }}
                    placeholder={tr(trendsLang,"ui.pasteUrlPlaceholder")}
                    value={repurposeUrl}
                    onChange={e => setRepurposeUrl(e.target.value)}
                  />
                  <div style={{ color:"#334155", fontSize:10, textAlign:"center" }}>— {tr(trendsLang,"ui.orPasteText")} —</div>
                  <textarea
                    style={{ ...st.textarea, minHeight:70, fontSize:11 }}
                    placeholder={tr(trendsLang,"ui.pasteTextPlaceholder")}
                    value={repurposeText}
                    onChange={e => setRepurposeText(e.target.value)}
                  />
                  <button
                    style={{ ...st.button, margin:0, width:"100%", opacity: repurposing ? 0.7 : 1, fontSize:12 }}
                    disabled={repurposing || (!repurposeUrl && !repurposeText)}
                    onClick={repurpose}
                  >
                    {repurposing ? `⏳ ${tr(trendsLang,"ui.repurposing")}...` : `🔗 ${tr(trendsLang,"ui.repurposeBtn")}`}
                    {voiceStyle && !repurposing && " 🧠"}
                  </button>
                  <div style={{ color:"#334155", fontSize:10 }}>✓ YouTube · ✓ Articles · ✓ Blog · ✓ Transcripts</div>
                </div>
              )}

              {/* Hooks */}
              {activePanel === "hooks" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <input
                    style={{ ...st.input, marginBottom:0, fontSize:11 }}
                    placeholder={tr(trendsLang,"ui.phTopic")}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                  <button
                    style={{ ...st.button, margin:0, width:"100%", opacity: hooksLoading ? 0.7 : 1, fontSize:12 }}
                    disabled={hooksLoading || !topic}
                    onClick={generateHooks}
                  >
                    {hooksLoading ? `⏳ ${tr(trendsLang,"ui.generating")}...` : `⚡ ${tr(trendsLang,"ui.generate5hooksBtn")}`}
                  </button>
                  {hooks.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:2 }}>
                      {hooks.map((h, i) => (
                        <motion.div key={i} whileHover={{ borderColor:"rgba(220,38,38,0.3)" }}
                          style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 12px", cursor:"pointer" }}
                          onClick={() => { setPost(h + "\n\n"); setActivePanel("generate"); }}>
                          <div style={{ color:"#ef4444", fontSize:9, fontWeight:700, letterSpacing:"1px", marginBottom:3 }}>HOOK {i+1} — {tr(trendsLang,"ui.clickToUse")}</div>
                          <div style={{ color:"#e2e8f0", fontSize:12, lineHeight:1.5 }}>{h}</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ COLONNE DROITE ══════════════════════════════════════════════════ */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {saveStatus && (
            <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
              style={{ padding:"9px 14px", borderRadius:8, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", color:"#22c55e", fontSize:12, fontWeight:600 }}>
              {saveStatus}
            </motion.div>
          )}

          {/* Textarea output */}
          <div style={{ ...st.card, marginTop:0, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>{tr(trendsLang,"ui.output")}</div>
              {post && (
                <div style={{ display:"flex", gap:12, color:"#334155", fontSize:10 }}>
                  <span>{postMetrics.words} {tr(trendsLang,"ui.words")}</span>
                  <span>{postMetrics.chars} {tr(trendsLang,"ui.chars")}</span>
                  <span>{postMetrics.readTime} {tr(trendsLang,"ui.minRead")}</span>
                </div>
              )}
            </div>

            <textarea
              style={{
                ...st.textarea,
                height: isMobile ? 220 : 300,
                minHeight:"unset", flex:"none",
                borderRadius:10,
                border:"1px solid rgba(220,38,38,0.1)",
                resize:"none",
                background:"rgba(15,23,42,0.8)",
                overflowY:"auto",
                fontSize:13,
                lineHeight:1.7,
              }}
              placeholder={tr(trendsLang,"ui.outputPlaceholder")}
              value={post}
              onChange={e => setPost(e.target.value)}
            />

            {/* Actions */}
            {post && (
              <>
                {/* Actions principales */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {[
                    [tr(trendsLang,"buttons.save"),    savePost,    "#22c55e", "rgba(34,197,94,0.12)"],
                    [tr(trendsLang,"buttons.copy"),    copyPost,    "#64748b", "rgba(255,255,255,0.04)"],
                    [tr(trendsLang,"buttons.export"),  exportPost,  "#64748b", "rgba(255,255,255,0.04)"],
                    [tr(trendsLang,"buttons.analyze"), analyze,     "#f59e0b", "rgba(245,158,11,0.1)"],
                    [tr(trendsLang,"buttons.plan"),    generatePlanner, "#8b5cf6", "rgba(139,92,246,0.1)"],
                  ].map(([label, fn, color, bg]) => (
                    <motion.button key={label} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${color}30`, background:bg, color, fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:"0.5px" }}
                      onClick={fn}>{label}
                    </motion.button>
                  ))}
                </div>

                {/* Rewrite chips */}
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:10 }}>
                  <div style={{ color:"#334155", fontSize:9, fontWeight:700, letterSpacing:"1.5px", marginBottom:8 }}>RÉÉCRITURE</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {[
                      [tr(trendsLang,"ui.tplViral"),     "viral",     "#ef4444"],
                      [tr(trendsLang,"ui.tplAuthority"), "authority", "#f59e0b"],
                      [tr(trendsLang,"ui.tplStory"),     "story",     "#8b5cf6"],
                      [tr(trendsLang,"ui.tplHook"),      "hook",      "#22c55e"],
                      [tr(trendsLang,"ui.tplShort"),     "short",     "#60a5fa"],
                      [tr(trendsLang,"ui.tplCta"),       "cta",       "#f97316"],
                    ].map(([label, mode, color]) => rewriteChip(label, mode, color))}
                  </div>
                </div>

                {/* Multi-format */}
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:10 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ color:"#8b5cf6", fontSize:9, fontWeight:700, letterSpacing:"1.5px" }}>🔄 {tr(trendsLang,"create.multiFormat")}</span>
                      {!isPro && <span style={{ background:"rgba(239,68,68,0.15)", color:"#ef4444", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>PRO</span>}
                    </div>
                    <span style={{ color:"#334155", fontSize:10 }}>{tr(trendsLang,"create.multiFormatDesc")}</span>
                  </div>

                  {!isPro ? (
                    <div style={{ background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.12)", borderRadius:10, padding:14, textAlign:"center" }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>🔒</div>
                      <div style={{ color:"#94a3b8", fontSize:12, fontWeight:700, marginBottom:4 }}>{tr(trendsLang,"create.multiLockTitle")}</div>
                      <div style={{ color:"#475569", fontSize:11, marginBottom:10 }}>{tr(trendsLang,"create.multiLockDesc")}</div>
                      <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                        {["🐦 Thread","📧 Newsletter","🎠 Carousel"].map(l => (
                          <span key={l} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, color:"#475569", fontSize:10, padding:"5px 10px" }}>{l}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                        style={{ ...st.button, margin:0, width:"100%", background:"linear-gradient(135deg,#7c3aed,#6d28d9)", opacity: multiLoading ? 0.7 : 1, fontSize:12 }}
                        disabled={multiLoading || !post || post.length < 30}
                        onClick={repurposeMulti}
                      >
                        {multiLoading ? `⏳ ${tr(trendsLang,"create.multiGenerating")}...` : `🔄 ${tr(trendsLang,"create.multiBtn")}`}
                        {voiceStyle && !multiLoading && " 🧠"}
                      </motion.button>

                      {multiResult && (
                        <div style={{ background:"rgba(139,92,246,0.05)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:10, overflow:"hidden", marginTop:8 }}>
                          <div style={{ display:"flex", borderBottom:"1px solid rgba(139,92,246,0.15)" }}>
                            {[["thread","🐦 Thread"],["newsletter","📧 Newsletter"],["carousel","🎠 Carousel"]].map(([k,l]) => (
                              <button key={k} style={{ flex:1, padding:"8px", background:"transparent", border:"none", borderBottom: multiTab===k ? "2px solid #8b5cf6" : "2px solid transparent", color: multiTab===k ? "#8b5cf6" : "#475569", fontWeight:700, fontSize:10, cursor:"pointer" }} onClick={() => setMultiTab(k)}>{l}</button>
                            ))}
                          </div>
                          <div style={{ padding:12 }}>
                            {multiTab === "thread" && (
                              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                <div style={{ color:"#475569", fontSize:10, marginBottom:2 }}>{multiResult.thread?.length || 0} tweets</div>
                                {(multiResult.thread || []).map((tweet, i) => (
                                  <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 12px", position:"relative" }}>
                                    <div style={{ color:"#64748b", fontSize:9, fontWeight:700, letterSpacing:"1px", marginBottom:3 }}>{i===0?"🎯 HOOK":i===(multiResult.thread.length-1)?"📌 CTA":`TWEET ${i+1}`}</div>
                                    <div style={{ color:"#e2e8f0", fontSize:12, lineHeight:1.5, paddingRight:40 }}>{tweet}</div>
                                    <div style={{ color:"#475569", fontSize:9, marginTop:3 }}>{tweet.length}/280</div>
                                    <button style={{ position:"absolute", top:8, right:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"#64748b", fontSize:10, padding:"3px 8px", cursor:"pointer" }} onClick={() => copyTweet(tweet, i)}>{copiedIdx===i?"✓":"copy"}</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {multiTab === "newsletter" && multiResult.newsletter && (
                              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                <button style={{ ...st.buttonSecondary, margin:0, fontSize:10, padding:"6px 12px", alignSelf:"flex-end" }} onClick={copyNewsletter}>{tr(trendsLang,"create.multiCopyAll")}</button>
                                {[["create.multiSubject",multiResult.newsletter.subject],["create.multiIntro",multiResult.newsletter.intro],["create.multiBody",multiResult.newsletter.body],["create.multiCta",multiResult.newsletter.cta]].map(([key,val]) => val && (
                                  <div key={key} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 12px" }}>
                                    <div style={{ color:"#8b5cf6", fontSize:9, fontWeight:700, letterSpacing:"1px", marginBottom:3 }}>{tr(trendsLang, key).toUpperCase()}</div>
                                    <div style={{ color:"#e2e8f0", fontSize:12, lineHeight:1.5 }}>{val}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {multiTab === "carousel" && (
                              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                <div style={{ color:"#475569", fontSize:10, marginBottom:2 }}>{multiResult.carouselSlides?.length || 0} slides</div>
                                {(multiResult.carouselSlides || []).map((slide) => (
                                  <div key={slide.slide} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 12px", display:"flex", gap:10 }}>
                                    <div style={{ color:"#8b5cf6", fontSize:11, fontWeight:900, minWidth:20 }}>{slide.slide}</div>
                                    <div>
                                      <div style={{ color:"#8b5cf6", fontSize:9, fontWeight:700, letterSpacing:"1px", marginBottom:3 }}>{slide.type?.toUpperCase()}</div>
                                      <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:700, marginBottom:3 }}>{slide.headline}</div>
                                      {slide.body && <div style={{ color:"#94a3b8", fontSize:11 }}>{slide.body}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Viral Score */}
          {(viralScore || scoring) && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>⚡ {tr(trendsLang,"ui.viralScore")}</div>
                {scoring && <div style={{ color:"#475569", fontSize:10 }}>{tr(trendsLang,"ui.analyzing")}...</div>}
                {viralScore && (
                  <div style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${PRED_COLOR[viralScore.prediction] || "#f59e0b"}20`, color: PRED_COLOR[viralScore.prediction] || "#f59e0b" }}>
                    {viralScore.prediction}
                  </div>
                )}
              </div>
              {viralScore && (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px", marginBottom:10 }}>
                    {[[tr(trendsLang,"ui.vsOverall"),viralScore.score],[tr(trendsLang,"ui.vsHook"),viralScore.hook],[tr(trendsLang,"ui.vsEmotion"),viralScore.emotion],[tr(trendsLang,"ui.vsValue"),viralScore.value]].map(([label,val]) => (
                      <div key={label}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ color:"#475569", fontSize:9, fontWeight:700 }}>{label.toUpperCase()}</span>
                          <span style={{ color: SCORE_COLOR(val), fontSize:10, fontWeight:700 }}>{val}</span>
                        </div>
                        <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                          <motion.div initial={{ width:0 }} animate={{ width:`${val}%` }} transition={{ duration:0.6 }}
                            style={{ height:"100%", background: SCORE_COLOR(val), borderRadius:2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {viralScore.tip && (
                    <div style={{ background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.15)", borderRadius:8, padding:"8px 12px", fontSize:11, color:"#fbbf24" }}>
                      💡 {viralScore.tip}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
          {/* ── Image Generator ───────────────────────────────────────────── */}
          {post && post.length >= 30 && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>🖼️ {tr(trendsLang,"ui.imageGen") || "IMAGE GENERATOR"}</div>
                {!isPro && <span style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, color:"#ef4444", fontSize:9, fontWeight:700, padding:"2px 8px" }}>PRO+</span>}
              </div>

              {!isPro ? (
                <div style={{ textAlign:"center", padding:"12px 0", color:"#475569", fontSize:12 }}>
                  🔒 {tr(trendsLang,"ui.imageGenLock") || "Upgrade to Pro to generate images"}
                </div>
              ) : (
                <>
                  {/* Tabs type */}
                  <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                    {[["illustrative","🎨 Illustrative"],["visual","💬 Citation"]].map(([k,l]) => (
                      <button key={k}
                        style={{ flex:1, padding:"7px 6px", borderRadius:8, border:`1px solid ${imgTab===k?"rgba(239,68,68,0.5)":"rgba(255,255,255,0.08)"}`, background: imgTab===k?"rgba(239,68,68,0.1)":"transparent", color: imgTab===k?"#ef4444":"#475569", fontSize:10, fontWeight:700, cursor:"pointer" }}
                        onClick={() => setImgTab(k)}
                      >{l}</button>
                    ))}
                  </div>

                  {/* Style (illustrative seulement) */}
                  {imgTab === "illustrative" && (
                    <div style={{ display:"flex", gap:4, marginBottom:10 }}>
                      {[["illustrative","Modern"],["abstract","Abstract"],["photo","Photo"]].map(([k,l]) => (
                        <button key={k}
                          style={{ flex:1, padding:"5px 4px", borderRadius:6, border:`1px solid ${imgType===k?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.06)"}`, background: imgType===k?"rgba(239,68,68,0.08)":"transparent", color: imgType===k?"#ef4444":"#475569", fontSize:9, fontWeight:700, cursor:"pointer" }}
                          onClick={() => setImgType(k)}
                        >{l}</button>
                      ))}
                    </div>
                  )}

                  {/* Format */}
                  <div style={{ display:"flex", gap:4, marginBottom:12 }}>
                    {[["square","⬛ Carré 1:1"],["linkedin","▬ LinkedIn"]].map(([k,l]) => (
                      <button key={k}
                        style={{ flex:1, padding:"5px 4px", borderRadius:6, border:`1px solid ${imgFormat===k?"rgba(139,92,246,0.4)":"rgba(255,255,255,0.06)"}`, background: imgFormat===k?"rgba(139,92,246,0.08)":"transparent", color: imgFormat===k?"#a78bfa":"#475569", fontSize:9, fontWeight:700, cursor:"pointer" }}
                        onClick={() => setImgFormat(k)}
                      >{l}</button>
                    ))}
                  </div>

                  {/* Bouton générer */}
                  <motion.button
                    whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                    style={{ ...st.button, margin:0, width:"100%", fontSize:12, opacity: imgLoading ? 0.7 : 1,
                      background: imgTab === "visual"
                        ? "linear-gradient(135deg,#0f172a,#1e293b)"
                        : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                      border: imgTab === "visual" ? "1px solid rgba(239,68,68,0.3)" : "none",
                    }}
                    disabled={imgLoading}
                    onClick={() => generateImage(imgTab)}
                  >
                    {imgLoading ? "⏳ Generating..." : imgTab === "visual" ? "💬 Generate Quote Visual" : "🎨 Generate Image"}
                  </motion.button>

                  {/* Résultat */}
                  {imgResult && (
                    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                      style={{ marginTop:12, borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
                      <img
                        src={imgResult.imageUrl}
                        alt="Generated visual"
                        style={{ width:"100%", display:"block", borderRadius:10 }}
                      />
                      {imgResult.quote && (
                        <div style={{ padding:"8px 12px", background:"rgba(0,0,0,0.3)", fontSize:10, color:"#64748b", fontStyle:"italic" }}>
                          "{imgResult.quote}"
                        </div>
                      )}
                      {imgResult.coreIdea && (
                        <div style={{ padding:"8px 12px", background:"rgba(0,0,0,0.3)", fontSize:10, color:"#64748b" }}>
                          💡 {imgResult.coreIdea}
                        </div>
                      )}
                      <a
                        href={imgResult.imageUrl}
                        download={`growthpilot-${imgTab}-${imgFormat}.${imgTab==="visual"?"svg":"png"}`}
                        style={{ display:"block", textAlign:"center", padding:"10px", background:"rgba(239,68,68,0.1)", color:"#ef4444", fontSize:11, fontWeight:700, textDecoration:"none" }}
                      >
                        ⬇️ {tr(trendsLang,"ui.downloadImage") || "Download"}
                      </a>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
          {/* ── Media Library — Pexels + Unsplash ────────────────────────── */}
          {post && post.length >= 30 && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>📸 {tr(trendsLang,"ui.mediaLibrary") || "MEDIA LIBRARY"}</div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ color:"#334155", fontSize:9 }}>Pexels · Unsplash</span>
                </div>
              </div>

              {/* Bouton recherche */}
              <motion.button
                whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                style={{ ...st.button, margin:0, width:"100%", fontSize:12, opacity: mediaLoading ? 0.7 : 1,
                  background:"linear-gradient(135deg,#0369a1,#0c4a6e)" }}
                disabled={mediaLoading}
                onClick={searchMedia}
              >
                {mediaLoading ? "⏳ Searching..." : "🔍 Find relevant photos & videos"}
              </motion.button>

              {/* Mots-clés détectés */}
              {mediaResult?.keywords && (
                <div style={{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" }}>
                  {mediaResult.keywords.map(k => (
                    <span key={k} style={{ background:"rgba(3,105,161,0.1)", border:"1px solid rgba(3,105,161,0.3)", borderRadius:10, color:"#38bdf8", fontSize:9, fontWeight:700, padding:"2px 8px" }}>
                      #{k}
                    </span>
                  ))}
                </div>
              )}

              {/* Tabs photo/vidéo */}
              {mediaResult && (
                <>
                  <div style={{ display:"flex", gap:6, marginTop:10, marginBottom:8 }}>
                    {[["photo",`📷 Photos (${mediaResult.photos?.length || 0})`],["video",`🎬 Vidéos (${mediaResult.videos?.length || 0})`]].map(([k,l]) => (
                      <button key={k}
                        style={{ flex:1, padding:"6px", borderRadius:8, border:`1px solid ${mediaTab===k?"rgba(3,105,161,0.5)":"rgba(255,255,255,0.08)"}`, background: mediaTab===k?"rgba(3,105,161,0.1)":"transparent", color: mediaTab===k?"#38bdf8":"#475569", fontSize:10, fontWeight:700, cursor:"pointer" }}
                        onClick={() => setMediaTab(k)}
                      >{l}</button>
                    ))}
                  </div>

                  {/* Grille photos */}
                  {mediaTab === "photo" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {(mediaResult.photos || []).map(photo => (
                        <div key={photo.id}
                          onClick={() => setSelectedMedia(selectedMedia?.id === photo.id ? null : photo)}
                          style={{ position:"relative", borderRadius:8, overflow:"hidden", cursor:"pointer",
                            border: selectedMedia?.id === photo.id ? "2px solid #38bdf8" : "2px solid transparent",
                            aspectRatio:"16/9",
                          }}
                        >
                          <img src={photo.thumb} alt={photo.alt} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                          <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(0,0,0,0.6)", padding:"4px 6px", fontSize:8, color:"#94a3b8" }}>
                            {photo.source} · {photo.author}
                          </div>
                          {selectedMedia?.id === photo.id && (
                            <div style={{ position:"absolute", top:6, right:6, background:"#38bdf8", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"#000" }}>✓</div>
                          )}
                        </div>
                      ))}
                      {(mediaResult.photos || []).length === 0 && (
                        <div style={{ gridColumn:"1/-1", textAlign:"center", color:"#475569", fontSize:12, padding:16 }}>No photos found</div>
                      )}
                    </div>
                  )}

                  {/* Grille vidéos */}
                  {mediaTab === "video" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {(mediaResult.videos || []).map(video => (
                        <div key={video.id}
                          onClick={() => setSelectedMedia(selectedMedia?.id === video.id ? null : video)}
                          style={{ position:"relative", borderRadius:8, overflow:"hidden", cursor:"pointer",
                            border: selectedMedia?.id === video.id ? "2px solid #38bdf8" : "2px solid transparent",
                            aspectRatio:"16/9",
                          }}
                        >
                          <img src={video.thumb} alt="video" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ background:"rgba(0,0,0,0.6)", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>▶️</div>
                          </div>
                          <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(0,0,0,0.6)", padding:"4px 6px", fontSize:8, color:"#94a3b8" }}>
                            {video.duration}s · {video.author}
                          </div>
                          {selectedMedia?.id === video.id && (
                            <div style={{ position:"absolute", top:6, right:6, background:"#38bdf8", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"#000" }}>✓</div>
                          )}
                        </div>
                      ))}
                      {(mediaResult.videos || []).length === 0 && (
                        <div style={{ gridColumn:"1/-1", textAlign:"center", color:"#475569", fontSize:12, padding:16 }}>No videos found</div>
                      )}
                    </div>
                  )}

                  {/* Media sélectionné — actions */}
                  {selectedMedia && (
                    <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                      style={{ marginTop:10, background:"rgba(3,105,161,0.06)", border:"1px solid rgba(3,105,161,0.2)", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ color:"#38bdf8", fontSize:10, fontWeight:700, marginBottom:6 }}>
                        ✓ {selectedMedia.type === "video" ? "Vidéo" : "Photo"} sélectionnée
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <a href={selectedMedia.url} target="_blank" rel="noreferrer"
                          style={{ flex:1, textAlign:"center", padding:"7px", background:"rgba(3,105,161,0.15)", border:"1px solid rgba(3,105,161,0.3)", borderRadius:8, color:"#38bdf8", fontSize:10, fontWeight:700, textDecoration:"none" }}>
                          ⬇️ Download
                        </a>
                        <a href={selectedMedia.link} target="_blank" rel="noreferrer"
                          style={{ flex:1, textAlign:"center", padding:"7px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"#475569", fontSize:10, fontWeight:700, textDecoration:"none" }}>
                          🔗 Source
                        </a>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
