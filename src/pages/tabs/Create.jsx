import { useState, useEffect } from "react";
import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

const API = "https://social-ai-app-production.up.railway.app";

const SCORE_COLOR = (s) => s >= 75 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";
const PRED_COLOR  = { VIRAL:"#22c55e", HIGH:"#60a5fa", MEDIUM:"#f59e0b", LOW:"#ef4444" };

export default function Create({
  trendsLang, isMobile, token,
  post, setPost, topic, setTopic, projectTitle, setProjectTitle,
  searchProject, setSearchProject, selectedProject, filteredProjects,
  renameValue, setRenameValue, saveStatus, loading,
  postMetrics,
  savePost, copyPost, exportPost, analyze, generatePlanner,
  generate, rewrite, createProject, duplicateProject, renameProject, deleteProject, selectProject,
}) {
  const [activePanel,   setActivePanel]   = useState("generate");
  const [repurposeUrl,  setRepurposeUrl]  = useState("");
  const [repurposeText, setRepurposeText] = useState("");
  const [repurposing,   setRepurposing]   = useState(false);
  const [hooks,         setHooks]         = useState([]);
  const [hooksLoading,  setHooksLoading]  = useState(false);
  const [viralScore,    setViralScore]    = useState(null);
  const [scoring,       setScoring]       = useState(false);
  const [voiceStyle,    setVoiceStyle]    = useState(null);
  const [voiceLoaded,   setVoiceLoaded]   = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  /* ── Voice learning — charge au montage ── */
  useEffect(() => {
    if (!token || voiceLoaded) return;
    fetch(`${API}/generate/voice-style`, { method: "POST", headers })
      .then(r => r.json())
      .then(d => { if (d.style) setVoiceStyle(d.style); setVoiceLoaded(true); })
      .catch(() => setVoiceLoaded(true));
  }, [token]);

  /* ── Repurposing ── */
  const repurpose = async () => {
    if (!repurposeUrl && !repurposeText) return;
    setRepurposing(true);
    try {
      const r = await fetch(`${API}/generate/repurpose`, {
        method: "POST", headers,
        body: JSON.stringify({ url: repurposeUrl || null, text: repurposeText || null, lang: trendsLang, voiceStyle }),
      });
      const d = await r.json();
      if (d.text) { setPost(d.text); setActivePanel("generate"); }
    } catch {}
    setRepurposing(false);
  };

  /* ── Hook Generator ── */
  const generateHooks = async () => {
    if (!topic) return;
    setHooksLoading(true);
    setHooks([]);
    try {
      const r = await fetch(`${API}/generate/hooks`, {
        method: "POST", headers,
        body: JSON.stringify({ topic, lang: trendsLang, voiceStyle }),
      });
      const d = await r.json();
      if (d.hooks) setHooks(d.hooks);
    } catch {}
    setHooksLoading(false);
  };

  /* ── Viral Score (auto après 2s) ── */
  const scorePost = async (text) => {
    if (!text || text.length < 100) { setViralScore(null); return; }
    setScoring(true);
    try {
      const r = await fetch(`${API}/generate/viral-score`, {
        method: "POST", headers,
        body: JSON.stringify({ text }),
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

  const panelBtn = (k) => ({
    flex: 1, padding: "9px 4px", background: "transparent", border: "none",
    borderBottom: activePanel === k ? "2px solid #ef4444" : "2px solid transparent",
    color: activePanel === k ? "#ef4444" : "#475569",
    fontWeight: 700, fontSize: 10, letterSpacing: "1px", cursor: "pointer",
  });

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
                <div style={{ color:"#818cf8", fontSize:10, fontWeight:700, letterSpacing:"1px" }}>VOICE LEARNING ACTIVE</div>
                <div style={{ color:"#475569", fontSize:11, marginTop:1 }}>
                  Tone: {voiceStyle.tone} · {voiceStyle.avgSentenceLength} sentences
                  {voiceStyle.usesNumbers && " · uses numbers"}
                  {voiceStyle.usesQuestions && " · asks questions"}
                </div>
              </div>
            </div>
          )}

          {/* Project */}
          <div style={{ ...st.card, marginTop:0, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>PROJECT</div>
            <input style={st.input} placeholder={tr(trendsLang, "ui.phSearchProject")} value={searchProject} onChange={e => setSearchProject(e.target.value)} />
            <select style={{ ...st.input, marginBottom:0, width:"100%", boxSizing:"border-box" }} value={selectedProject} onChange={e => selectProject(e.target.value)}>
              <option value="">{tr(trendsLang, "ui.selectProject")}</option>
              {filteredProjects.map(p => <option key={p.name}>{p.name}</option>)}
            </select>
            <input
              style={{ ...st.input, marginBottom:0, borderColor:"rgba(220,38,38,0.4)" }}
              placeholder={tr(trendsLang, "ui.phProjectTitle")}
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createProject()}
            />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px" }} onClick={createProject}>{tr(trendsLang, "buttons.createProject")}</button>
              <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px" }} onClick={duplicateProject}>{tr(trendsLang, "ui.duplicate")}</button>
            </div>
            {selectedProject && (
              <div style={{ display:"flex", gap:6 }}>
                <input style={{ ...st.input, marginBottom:0, flex:1 }} placeholder={tr(trendsLang, "ui.phRenameProject")} value={renameValue} onChange={e => setRenameValue(e.target.value)} />
                <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px 14px" }} onClick={renameProject}>{tr(trendsLang, "ui.rename")}</button>
                <button style={{ ...st.buttonDanger, margin:0, fontSize:12, padding:"10px 14px" }} onClick={() => deleteProject(selectedProject)}>✕</button>
              </div>
            )}
          </div>

          {/* Panel switcher */}
          <div style={{ ...st.card, marginTop:0, padding:0, overflow:"hidden" }}>
            <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <button style={panelBtn("generate")}  onClick={() => setActivePanel("generate")}>✍️ GENERATE</button>
              <button style={panelBtn("repurpose")} onClick={() => setActivePanel("repurpose")}>🔗 REPURPOSE</button>
              <button style={panelBtn("hooks")}     onClick={() => setActivePanel("hooks")}>⚡ HOOKS</button>
            </div>
            <div style={{ padding:16 }}>

              {/* Generate */}
              {activePanel === "generate" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <input
                    style={{ ...st.input, marginBottom:0 }}
                    placeholder={tr(trendsLang, "ui.phTopic")}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !loading && generate()}
                  />
                  <button style={{ ...st.button, margin:0, width:"100%", opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={generate}>
                    {loading ? tr(trendsLang, "ui.aiWriting") : tr(trendsLang, "ui.generateBtn")}
                    {voiceStyle && !loading && " 🧠"}
                  </button>
                  {topic && (
                    <button
                      style={{ ...st.buttonSecondary, margin:0, width:"100%", fontSize:12, padding:"10px" }}
                      onClick={() => { setActivePanel("hooks"); generateHooks(); }}
                      disabled={hooksLoading}
                    >
                      {hooksLoading ? "⏳ Generating hooks..." : "⚡ Generate 5 hooks first"}
                    </button>
                  )}
                </div>
              )}

              {/* Repurpose */}
              {activePanel === "repurpose" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>PASTE URL (article, YouTube, blog)</div>
                  <input
                    style={{ ...st.input, marginBottom:0 }}
                    placeholder="https://youtube.com/watch?v=... or article URL"
                    value={repurposeUrl}
                    onChange={e => setRepurposeUrl(e.target.value)}
                  />
                  <div style={{ color:"#334155", fontSize:11, textAlign:"center" }}>— OR paste text directly —</div>
                  <textarea
                    style={{ ...st.textarea, minHeight:80, fontSize:12 }}
                    placeholder="Paste article text, transcript, or any content..."
                    value={repurposeText}
                    onChange={e => setRepurposeText(e.target.value)}
                  />
                  <button
                    style={{ ...st.button, margin:0, width:"100%", opacity: repurposing ? 0.7 : 1 }}
                    disabled={repurposing || (!repurposeUrl && !repurposeText)}
                    onClick={repurpose}
                  >
                    {repurposing ? "⏳ Converting to LinkedIn post..." : "🔗 Repurpose → LinkedIn Post"}
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
                    placeholder="Topic for your hooks..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                  <button
                    style={{ ...st.button, margin:0, width:"100%", opacity: hooksLoading ? 0.7 : 1 }}
                    disabled={hooksLoading || !topic}
                    onClick={generateHooks}
                  >
                    {hooksLoading ? "⏳ Generating..." : "⚡ Generate 5 Hooks"}
                  </button>
                  {hooks.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
                      {hooks.map((h, i) => (
                        <div
                          key={i}
                          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"10px 12px", cursor:"pointer" }}
                          onClick={() => { setPost(h + "\n\n"); setActivePanel("generate"); }}
                        >
                          <div style={{ color:"#ef4444", fontSize:9, fontWeight:700, letterSpacing:"1px", marginBottom:4 }}>HOOK {i+1} — click to use</div>
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
            <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.output")}</h3>
            <textarea
              style={{ ...st.textarea, height: isMobile ? 200 : 280, minHeight:"unset", flex:"none", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", resize:"none", background:"#0f172a", overflowY:"auto" }}
              placeholder={tr(trendsLang, "ui.outputPlaceholder")}
              value={post}
              onChange={e => setPost(e.target.value)}
            />
            {post && (
              <>
                <div style={{ display:"flex", gap:8, color:"#64748b", fontSize:12 }}>
                  <span>{postMetrics.words} words</span><span>·</span>
                  <span>{postMetrics.chars} chars</span><span>·</span>
                  <span>{postMetrics.readTime} min read</span>
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
                    [tr(trendsLang,"ui.tplViral"),    "viral"],
                    [tr(trendsLang,"ui.tplAuthority"),"authority"],
                    [tr(trendsLang,"ui.tplStory"),    "story"],
                    [tr(trendsLang,"ui.tplHook"),     "hook"],
                    [tr(trendsLang,"ui.tplShort"),    "short"],
                    [tr(trendsLang,"ui.tplCta"),      "cta"],
                  ].map(([label,mode]) => (
                    <button key={label} style={{ ...st.buttonSecondary, margin:0, fontSize:12, padding:"10px 14px" }} onClick={() => rewrite(mode)}>{label}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Viral Score */}
          {(viralScore || scoring) && (
            <div style={{ ...st.card, marginTop:0, padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"1.5px" }}>⚡ VIRAL SCORE</div>
                {scoring && <div style={{ color:"#475569", fontSize:11 }}>Analyzing...</div>}
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
                    {[["Overall", viralScore.score], ["Hook", viralScore.hook], ["Emotion", viralScore.emotion], ["Value", viralScore.value]].map(([label, val]) => (
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
                      🕐 Best time to post: <span style={{ color:"#94a3b8", fontWeight:600 }}>{viralScore.bestTime}</span>
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
