import { useState, useEffect } from "react";
import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

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
  const [activePanel,     setActivePanel]     = useState("generate");
  const [showHistory,     setShowHistory]     = useState(false);
  const [repurposeUrl,    setRepurposeUrl]    = useState("");
  const [repurposeText,   setRepurposeText]   = useState("");
  const [repurposing,     setRepurposing]     = useState(false);
  const [hooks,           setHooks]           = useState([]);
  const [hooksLoading,    setHooksLoading]    = useState(false);
  const [viralScore,      setViralScore]      = useState(null);
  const [scoring,         setScoring]         = useState(false);
  const [voiceStyle,      setVoiceStyle]      = useState(null);
  const [voiceLoaded,     setVoiceLoaded]     = useState(false);

  // ── Multi-format state ──────────────────────────────────────────────────────
  const [multiLoading,    setMultiLoading]    = useState(false);
  const [multiResult,     setMultiResult]     = useState(null); // { thread, newsletter, carouselSlides }
  const [multiTab,        setMultiTab]        = useState("thread"); // thread | newsletter | carousel
  const [copiedIdx,       setCopiedIdx]       = useState(null);

  const isPro = plan === "Pro" || plan === "Business";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  /* ── Voice learning ── */
  useEffect(() => {
    if (!token || voiceLoaded) return;
    fetch(`${API}/generate/voice-style`, { method:"POST", headers, body: JSON.stringify({ lang: trendsLang }) })
      .then(r => r.json())
      .then(d => { if (d.style) setVoiceStyle(d.style); setVoiceLoaded(true); })
      .catch(() => setVoiceLoaded(true));
  }, [token]);

  /* ── Repurpose simple (URL/texte → LinkedIn) ── */
  const repurpose = async () => {
    if (!repurposeUrl && !repurposeText) return;
    setRepurposing(true);
    try {
      const r = await fetch(`${API}/generate/repurpose`, {
        method:"POST", headers,
        body: JSON.stringify({ url: repurposeUrl || null, text: repurposeText || null, lang: trendsLang, voiceStyle }),
      });
      const d = await r.json();
      if (d.text) { setPost(d.text); setActivePanel("generate"); }
    } catch {}
    setRepurposing(false);
  };

  /* ── Repurpose multi-format (post → Thread + Newsletter + Carousel) ── */
  const repurposeMulti = async () => {
    if (!post || post.length < 30) return;
    setMultiLoading(true);
    setMultiResult(null);
    try {
      const r = await fetch(`${API}/generate/repurpose-multi`, {
        method:"POST", headers,
        body: JSON.stringify({ post, lang: trendsLang, voiceStyle }),
      });
      const d = await r.json();
      if (d.thread || d.newsletter || d.carouselSlides) {
        setMultiResult(d);
        setMultiTab("thread");
      }
    } catch {}
    setMultiLoading(false);
  };

  /* ── Hook Generator ── */
  const generateHooks = async () => {
    if (!topic) return;
    setHooksLoading(true);
    setHooks([]);
    try {
      const r = await fetch(`${API}/generate/hooks`, {
        method:"POST", headers,
        body: JSON.stringify({ topic, lang: trendsLang, voiceStyle }),
      });
      const d = await r.json();
      if (d.hooks) setHooks(d.hooks);
    } catch {}
    setHooksLoading(false);
  };

  /* ── Viral Score (auto 2s) ── */
  const scorePost = async (text) => {
    if (!text || text.length < 100) { setViralScore(null); return; }
    setScoring(true);
    try {
      const r = await fetch(`${API}/generate/viral-score`, {
        method:"POST", headers,
        body: JSON.stringify({ text, lang: trendsLang }),
      });
      const d = await r.json();
      if (d.score) setViralScore(d);
    } catch {}
    setScoring(false);
  };

  useEffect(() => {
    if (!post || post.length < 100) { setViralScore(null); return; }
    const t = setTimeout(() => scorePost(post), 2000);
    return () => clearTimeout(t);
  }, [post]);

  /* ── Copy tweet helper ── */
  const copyTweet = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  /* ── Copy all newsletter ── */
  const copyNewsletter = () => {
    if (!multiResult?.newsletter) return;
    const n = multiResult.newsletter;
    const full = `Subject: ${n.subject}\n\n${n.intro}\n\n${n.body}\n\n${n.cta}${n.ps ? `\n\nP.S. ${n.ps}` : ""}`;
    navigator.clipboard.writeText(full);
  };

  const panelBtn = (k) => ({
    flex:1, padding:"9px 4px", background:"transparent", border:"none",
    borderBottom: activePanel === k ? "2px solid #ef4444" : "2px solid transparent",
    color: activePanel === k ? "#ef4444" : "#475569",
    fontWeight:700, fontSize:10, letterSpacing:"1px", cursor:"pointer",
  });

  const multiTabBtn = (k) => ({
    flex:1, padding:"7px 4px", background:"transparent", border:"none",
    borderBottom: multiTab === k ? "2px solid #8b5cf6" : "2px solid transparent",
    color: multiTab === k ? "#8b5cf6" : "#475569",
    fontWeight:700, fontSize:10, letterSpacing:"1px", cursor:"pointer",
  });

  // ─── Styles locaux ──────────────────────────────────────────────────────────
  const s = {
    multiWrap:  { background:"rgba(139,92,246,0.05)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:12, overflow:"hidden", marginTop:4 },
    tweetCard:  { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"10px 12px", position:"relative" },
    copyBtn:    { position:"absolute", top:8, right:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"#64748b", fontSize:10, padding:"3px 8px", cursor:"pointer" },
    field:      { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"10px 14px", marginBottom:8 },
    fieldLabel: { color:"#8b5cf6", fontSize:9, fontWeight:700, letterSpacing:"1.5px", marginBottom:4 },
    fieldText:  { color:"#e2e8f0", fontSize:13, lineHeight:1.6 },
    slideCard:  { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"10px 14px", display:"flex", gap:12, alignItems:"flex-start" },
    slideNum:   { color:"#8b5cf6", fontSize:11, fontWeight:900, minWidth:20 },
    lockWrap:   { background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:10, padding:"16px", textAlign:"center" },
  };

  return (
    <>
      <PageHeader tabKey="create" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>

        {/* ── Colonne gauche ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {saveStatus && <div style={{ ...st.card, padding:"10px 14px", fontSize:13, color:"#22c55e" }}>{saveStatus}</div>}

          {/* Voice Learning badge */}
          {voiceStyle && (
            <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, padding:"8px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:18 }}>🧠</span>
              <div>
                <div style={{ color:"#818cf8", fontSize:10, fontWeight:700, letterSpacing:"1px" }}>{tr(trendsLang,"ui.voiceLearningActive")}</div>
                <div style={{ color:"#475569", fontSize:11, marginTop:1 }}>
                  {tr(trendsLang,"ui.voiceTone")}: {voiceStyle.tone} · {voiceStyle.avgSentenceLength} {tr(trendsLang,"ui.voiceSentences")}
                  {voiceStyle.usesNumbers  && ` · ${tr(trendsLang,"ui.voiceUsesNumbers")}`}
                  {voiceStyle.usesQuestions && ` · ${tr(trendsLang,"ui.voiceAsksQuestions")}`}
                </div>
              </div>
            </div>
          )}

          {/* Project */}
          <div style={{ ...st.card, marginTop:0, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>{tr(trendsLang,"ui.project")}</div>
            <input style={st.input} placeholder={tr(trendsLang,"ui.phSearchProject")} value={searchProject} onChange={e => setSearchProject(e.target.value)} />
            <select style={{ ...st.input, marginBottom:0, width:"100%", boxSizing:"border-box" }} value={selectedProject} onChange={e => selectProject(e.target.value)}>
              <option value="">{tr(trendsLang,"ui.selectProject")}</option>
              {filteredProjects.map(p => <option key={p.name}>{p.name}</option>)}
            </select>
            <input
              style={{ ...st.input, marginBottom:0, borderColor:"rgba(220,38,38,0.4)" }}
              placeholder={tr(trendsLang,"ui.phProjectTitle")}
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createProject()}
            />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px" }} onClick={createProject}>{tr(trendsLang,"buttons.createProject")}</button>
              <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px" }} onClick={duplicateProject}>{tr(trendsLang,"ui.duplicate")}</button>
            </div>
            {selectedProject && (
              <div style={{ display:"flex", gap:6 }}>
                <input style={{ ...st.input, marginBottom:0, flex:1 }} placeholder={tr(trendsLang,"ui.phRenameProject")} value={renameValue} onChange={e => setRenameValue(e.target.value)} />
                <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px 14px" }} onClick={renameProject}>{tr(trendsLang,"ui.rename")}</button>
                <button style={{ ...st.buttonDanger, margin:0, fontSize:12, padding:"10px 14px" }} onClick={() => deleteProject(selectedProject)}>✕</button>
              </div>
            )}
          </div>

          {/* ── Historique du projet ── */}
          {selectedProject && projectPosts && projectPosts.length > 0 && (
            <div style={{ ...st.card, marginTop:0, padding:0, overflow:"hidden" }}>
              <button
                onClick={() => setShowHistory(h => !h)}
                style={{ width:"100%", padding:"12px 16px", background:"transparent", border:"none", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>📋</span>
                  <span style={{ color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"1.5px" }}>HISTORIQUE DU PROJET</span>
                  <span style={{ background:"rgba(220,38,38,0.15)", color:"#ef4444", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>{projectPosts.length}</span>
                </div>
                <span style={{ color:"#475569", fontSize:12 }}>{showHistory ? "▲" : "▼"}</span>
              </button>
              {showHistory && (
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", maxHeight:280, overflowY:"auto" }}>
                  {projectPosts.map((p, i) => (
                    <div
                      key={p.id || i}
                      onClick={() => setPost(p.content)}
                      style={{ padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer", transition:"background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(220,38,38,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}
                    >
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                        <span style={{ color:"#94a3b8", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"70%" }}>
                          {p.title || "Untitled"}
                        </span>
                        <span style={{ color:"#334155", fontSize:10, flexShrink:0 }}>
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ color:"#475569", fontSize:11, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {p.content?.slice(0, 80)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Panel switcher */}
          <div style={{ ...st.card, marginTop:0, padding:0, overflow:"hidden" }}>
            <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <button style={panelBtn("generate")}  onClick={() => setActivePanel("generate")}>✍️ {tr(trendsLang,"ui.panelGenerate")}</button>
              <button style={panelBtn("repurpose")} onClick={() => setActivePanel("repurpose")}>🔗 {tr(trendsLang,"ui.panelRepurpose")}</button>
              <button style={panelBtn("hooks")}     onClick={() => setActivePanel("hooks")}>⚡ {tr(trendsLang,"ui.panelHooks")}</button>
            </div>
            <div style={{ padding:16 }}>

              {/* Generate */}
              {activePanel === "generate" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <input
                    style={{ ...st.input, marginBottom:0 }}
                    placeholder={tr(trendsLang,"ui.phTopic")}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !loading && generate()}
                  />
                  <button style={{ ...st.button, margin:0, width:"100%", opacity: loading ? 0.7:1 }} disabled={loading} onClick={generate}>
                    {loading ? tr(trendsLang,"ui.aiWriting") : tr(trendsLang,"ui.generateBtn")}
                    {voiceStyle && !loading && " 🧠"}
                  </button>
                  {topic && (
                    <button
                      style={{ ...st.buttonSecondary, margin:0, width:"100%", fontSize:12, padding:"10px" }}
                      onClick={() => { setActivePanel("hooks"); generateHooks(); }}
                      disabled={hooksLoading}
                    >
                      {hooksLoading ? `⏳ ${tr(trendsLang,"ui.generating")}...` : `⚡ ${tr(trendsLang,"ui.generate5hooksBtn")}`}
                    </button>
                  )}
                </div>
              )}

              {/* Repurpose simple */}
              {activePanel === "repurpose" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>{tr(trendsLang,"ui.pasteUrl")}</div>
                  <input
                    style={{ ...st.input, marginBottom:0 }}
                    placeholder={tr(trendsLang,"ui.pasteUrlPlaceholder")}
                    value={repurposeUrl}
                    onChange={e => setRepurposeUrl(e.target.value)}
                  />
                  <div style={{ color:"#334155", fontSize:11, textAlign:"center" }}>— {tr(trendsLang,"ui.orPasteText")} —</div>
                  <textarea
                    style={{ ...st.textarea, minHeight:80, fontSize:12 }}
                    placeholder={tr(trendsLang,"ui.pasteTextPlaceholder")}
                    value={repurposeText}
                    onChange={e => setRepurposeText(e.target.value)}
                  />
                  <button
                    style={{ ...st.button, margin:0, width:"100%", opacity: repurposing ? 0.7:1 }}
                    disabled={repurposing || (!repurposeUrl && !repurposeText)}
                    onClick={repurpose}
                  >
                    {repurposing ? `⏳ ${tr(trendsLang,"ui.repurposing")}...` : `🔗 ${tr(trendsLang,"ui.repurposeBtn")}`}
                    {voiceStyle && !repurposing && " 🧠"}
                  </button>
                  <div style={{ color:"#334155", fontSize:11 }}>✓ YouTube · ✓ Articles · ✓ Blog posts · ✓ Transcripts</div>
                </div>
              )}

              {/* Hooks */}
              {activePanel === "hooks" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <input
                    style={{ ...st.input, marginBottom:0 }}
                    placeholder={tr(trendsLang,"ui.phTopic")}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                  <button
                    style={{ ...st.button, margin:0, width:"100%", opacity: hooksLoading ? 0.7:1 }}
                    disabled={hooksLoading || !topic}
                    onClick={generateHooks}
                  >
                    {hooksLoading ? `⏳ ${tr(trendsLang,"ui.generating")}...` : `⚡ ${tr(trendsLang,"ui.generate5hooksBtn")}`}
                  </button>
                  {hooks.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
                      {hooks.map((h, i) => (
                        <div
                          key={i}
                          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"10px 12px", cursor:"pointer" }}
                          onClick={() => { setPost(h + "\n\n"); setActivePanel("generate"); }}
                        >
                          <div style={{ color:"#ef4444", fontSize:9, fontWeight:700, letterSpacing:"1px", marginBottom:4 }}>HOOK {i+1} — {tr(trendsLang,"ui.clickToUse")}</div>
                          <div style={{ color:"#e2e8f0", fontSize:13, lineHeight:1.5 }}>{h}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:12 }}>
            <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang,"ui.output")}</h3>
            <textarea
              style={{ ...st.textarea, height: isMobile ? 200:280, minHeight:"unset", flex:"none", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", resize:"none", background:"#0f172a", overflowY:"auto" }}
              placeholder={tr(trendsLang,"ui.outputPlaceholder")}
              value={post}
              onChange={e => setPost(e.target.value)}
            />
            {post && (
              <>
                <div style={{ display:"flex", gap:8, color:"#64748b", fontSize:12 }}>
                  <span>{postMetrics.words} {tr(trendsLang,"ui.words")}</span><span>·</span>
                  <span>{postMetrics.chars} {tr(trendsLang,"ui.chars")}</span><span>·</span>
                  <span>{postMetrics.readTime} {tr(trendsLang,"ui.minRead")}</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {[
                    [tr(trendsLang,"buttons.save"),    savePost],
                    [tr(trendsLang,"buttons.copy"),    copyPost],
                    [tr(trendsLang,"buttons.export"),  exportPost],
                    [tr(trendsLang,"buttons.analyze"), analyze],
                    [tr(trendsLang,"buttons.plan"),    generatePlanner],
                  ].map(([label,fn]) => (
                    <button key={label} style={{ ...st.button, margin:0, fontSize:12, padding:"10px 14px" }} onClick={fn}>{label}</button>
                  ))}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {[
                    [tr(trendsLang,"ui.tplViral"),     "viral"],
                    [tr(trendsLang,"ui.tplAuthority"), "authority"],
                    [tr(trendsLang,"ui.tplStory"),     "story"],
                    [tr(trendsLang,"ui.tplHook"),      "hook"],
                    [tr(trendsLang,"ui.tplShort"),     "short"],
                    [tr(trendsLang,"ui.tplCta"),       "cta"],
                  ].map(([label,mode]) => (
                    <button key={label} style={{ ...st.buttonSecondary, margin:0, fontSize:12, padding:"10px 14px" }} onClick={() => rewrite(mode)}>{label}</button>
                  ))}
                </div>

                {/* ── Repurpose Multi-format ──────────────────────────────── */}
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ color:"#8b5cf6", fontSize:10, fontWeight:700, letterSpacing:"1.5px" }}>
                        🔄 {tr(trendsLang,"create.multiFormat")}
                      </span>
                      {!isPro && (
                        <span style={{ background:"rgba(239,68,68,0.15)", color:"#ef4444", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10, letterSpacing:"1px" }}>
                          PRO
                        </span>
                      )}
                    </div>
                    <span style={{ color:"#334155", fontSize:10 }}>{tr(trendsLang,"create.multiFormatDesc")}</span>
                  </div>

                  {/* Gate Free */}
                  {!isPro ? (
                    <div style={s.lockWrap}>
                      <div style={{ fontSize:24, marginBottom:8 }}>🔒</div>
                      <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:700, marginBottom:4 }}>{tr(trendsLang,"create.multiLockTitle")}</div>
                      <div style={{ color:"#475569", fontSize:12, marginBottom:12 }}>{tr(trendsLang,"create.multiLockDesc")}</div>
                      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                        <span style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:6, color:"#64748b", fontSize:11, padding:"6px 12px" }}>🐦 {tr(trendsLang,"create.multiThread")}</span>
                        <span style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:6, color:"#64748b", fontSize:11, padding:"6px 12px" }}>📧 {tr(trendsLang,"create.multiNewsletter")}</span>
                        <span style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:6, color:"#64748b", fontSize:11, padding:"6px 12px" }}>🎠 {tr(trendsLang,"create.multiCarousel")}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        style={{ ...st.button, margin:0, width:"100%", background:"linear-gradient(135deg,#7c3aed,#6d28d9)", opacity: multiLoading ? 0.7:1 }}
                        disabled={multiLoading || !post || post.length < 30}
                        onClick={repurposeMulti}
                      >
                        {multiLoading
                          ? `⏳ ${tr(trendsLang,"create.multiGenerating")}...`
                          : `🔄 ${tr(trendsLang,"create.multiBtn")}`
                        }
                        {voiceStyle && !multiLoading && " 🧠"}
                      </button>

                      {/* Résultats */}
                      {multiResult && (
                        <div style={s.multiWrap}>
                          {/* Onglets */}
                          <div style={{ display:"flex", borderBottom:"1px solid rgba(139,92,246,0.2)" }}>
                            <button style={multiTabBtn("thread")}     onClick={() => setMultiTab("thread")}>🐦 {tr(trendsLang,"create.multiThread")}</button>
                            <button style={multiTabBtn("newsletter")} onClick={() => setMultiTab("newsletter")}>📧 {tr(trendsLang,"create.multiNewsletter")}</button>
                            <button style={multiTabBtn("carousel")}   onClick={() => setMultiTab("carousel")}>🎠 {tr(trendsLang,"create.multiCarousel")}</button>
                          </div>

                          <div style={{ padding:12 }}>

                            {/* Thread X */}
                            {multiTab === "thread" && (
                              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                <div style={{ color:"#475569", fontSize:10, marginBottom:4 }}>
                                  {tr(trendsLang,"create.multiThreadDesc")} — {multiResult.thread?.length || 0} {tr(trendsLang,"create.multiTweets")}
                                </div>
                                {(multiResult.thread || []).map((tweet, i) => (
                                  <div key={i} style={s.tweetCard}>
                                    <div style={{ color:"#64748b", fontSize:9, fontWeight:700, letterSpacing:"1px", marginBottom:4 }}>
                                      {i === 0 ? "🎯 HOOK" : i === (multiResult.thread.length - 1) ? "📌 CTA" : `TWEET ${i + 1}`}
                                    </div>
                                    <div style={{ color:"#e2e8f0", fontSize:12, lineHeight:1.6, paddingRight:48 }}>{tweet}</div>
                                    <div style={{ color:"#475569", fontSize:9, marginTop:4 }}>{tweet.length}/280</div>
                                    <button style={s.copyBtn} onClick={() => copyTweet(tweet, i)}>
                                      {copiedIdx === i ? "✓" : tr(trendsLang,"create.multiCopy")}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Newsletter */}
                            {multiTab === "newsletter" && multiResult.newsletter && (
                              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                <button
                                  style={{ ...st.buttonSecondary, margin:0, fontSize:11, padding:"7px 14px", alignSelf:"flex-end" }}
                                  onClick={copyNewsletter}
                                >
                                  {tr(trendsLang,"create.multiCopyAll")}
                                </button>
                                {[
                                  ["create.multiSubject",   multiResult.newsletter.subject],
                                  ["create.multiPreheader", multiResult.newsletter.preheader],
                                  ["create.multiIntro",     multiResult.newsletter.intro],
                                  ["create.multiBody",      multiResult.newsletter.body],
                                  ["create.multiCta",       multiResult.newsletter.cta],
                                  ...(multiResult.newsletter.ps ? [["create.multiPs", multiResult.newsletter.ps]] : []),
                                ].map(([key, val]) => val && (
                                  <div key={key} style={s.field}>
                                    <div style={s.fieldLabel}>{tr(trendsLang, key).toUpperCase()}</div>
                                    <div style={s.fieldText}>{val}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Carousel */}
                            {multiTab === "carousel" && (
                              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                <div style={{ color:"#475569", fontSize:10, marginBottom:4 }}>
                                  {multiResult.carouselSlides?.length || 0} {tr(trendsLang,"create.multiSlides")}
                                </div>
                                {(multiResult.carouselSlides || []).map((slide) => (
                                  <div key={slide.slide} style={s.slideCard}>
                                    <div style={s.slideNum}>{slide.slide}</div>
                                    <div style={{ flex:1 }}>
                                      <div style={{ color:"#8b5cf6", fontSize:9, fontWeight:700, letterSpacing:"1px", marginBottom:4 }}>
                                        {slide.type?.toUpperCase()}
                                      </div>
                                      <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:700, marginBottom:4 }}>{slide.headline}</div>
                                      {slide.subheadline && <div style={{ color:"#94a3b8", fontSize:11 }}>{slide.subheadline}</div>}
                                      {slide.body        && <div style={{ color:"#94a3b8", fontSize:11, lineHeight:1.5 }}>{slide.body}</div>}
                                      {slide.action      && <div style={{ color:"#8b5cf6", fontSize:11, fontWeight:700 }}>→ {slide.action}</div>}
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
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"1.5px" }}>⚡ {tr(trendsLang,"ui.viralScore")}</div>
                {scoring && <div style={{ color:"#475569", fontSize:11 }}>{tr(trendsLang,"ui.analyzing")}...</div>}
                {viralScore && (
                  <div style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20,
                    background:`rgba(${viralScore.prediction==="VIRAL"?"52,211,153":viralScore.prediction==="HIGH"?"96,165,250":viralScore.prediction==="MEDIUM"?"251,191,36":"239,68,68"},0.15)`,
                    color: PRED_COLOR[viralScore.prediction] || "#f59e0b" }}>
                    {viralScore.prediction}
                  </div>
                )}
              </div>
              {viralScore && (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px", marginBottom:12 }}>
                    {[[tr(trendsLang,"ui.vsOverall"),viralScore.score],[tr(trendsLang,"ui.vsHook"),viralScore.hook],[tr(trendsLang,"ui.vsEmotion"),viralScore.emotion],[tr(trendsLang,"ui.vsValue"),viralScore.value]].map(([label,val]) => (
                      <div key={label}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ color:"#64748b", fontSize:10, fontWeight:700 }}>{label.toUpperCase()}</span>
                          <span style={{ color: SCORE_COLOR(val), fontSize:10, fontWeight:700 }}>{val}</span>
                        </div>
                        <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                          <div style={{ width:`${val}%`, height:"100%", background: SCORE_COLOR(val), borderRadius:2, transition:"width 0.5s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {viralScore.tip && (
                    <div style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.15)", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#fbbf24", marginBottom:8 }}>
                      💡 {viralScore.tip}
                    </div>
                  )}
                  {viralScore.bestTime && (
                    <div style={{ fontSize:11, color:"#475569" }}>
                      🕐 {tr(trendsLang,"ui.bestTimeToPost")}: <span style={{ color:"#94a3b8", fontWeight:600 }}>{viralScore.bestTime}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
