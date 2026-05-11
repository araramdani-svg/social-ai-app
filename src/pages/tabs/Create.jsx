import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Create({
  trendsLang, isMobile,
  post, setPost, topic, setTopic, projectTitle, setProjectTitle,
  searchProject, setSearchProject, selectedProject, filteredProjects,
  renameValue, setRenameValue, saveStatus, loading,
  postMetrics,
  savePost, copyPost, exportPost, analyze, generatePlanner,
  generate, rewrite, createProject, duplicateProject, renameProject, deleteProject, selectProject,
}) {
  return (
    <>
      <PageHeader tabKey="create" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>

        {/* Colonne gauche */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {saveStatus && <div style={{ ...st.card, padding:"10px 14px", fontSize:13, color:"#22c55e" }}>{saveStatus}</div>}

          {/* Project */}
          <div style={{ ...st.card, marginTop:0, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>PROJECT</div>
            <input style={st.input} placeholder={tr(trendsLang, "ui.phSearchProject")} value={searchProject} onChange={(e) => setSearchProject(e.target.value)} />
            <select style={{ ...st.input, marginBottom:0, width:"100%", boxSizing:"border-box" }} value={selectedProject} onChange={(e) => selectProject(e.target.value)}>
              <option value="">{tr(trendsLang, "ui.selectProject")}</option>
              {filteredProjects.map((p) => <option key={p.name}>{p.name}</option>)}
            </select>
            <input
              style={{ ...st.input, marginBottom:0, borderColor:"rgba(220,38,38,0.4)" }}
              placeholder={tr(trendsLang, "ui.phProjectTitle")}
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createProject()}
            />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px" }} onClick={createProject}>{tr(trendsLang, "buttons.createProject")}</button>
              <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px" }} onClick={duplicateProject}>{tr(trendsLang, "ui.duplicate")}</button>
            </div>
            {selectedProject && (
              <div style={{ display:"flex", gap:6 }}>
                <input style={{ ...st.input, marginBottom:0, flex:1 }} placeholder={tr(trendsLang, "ui.phRenameProject")} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px 14px" }} onClick={renameProject}>{tr(trendsLang, "ui.rename")}</button>
                <button style={{ ...st.buttonDanger, margin:0, fontSize:12, padding:"10px 14px" }} onClick={() => deleteProject(selectedProject)}>✕</button>
              </div>
            )}
          </div>

          {/* Generate */}
          <div style={{ ...st.card, marginTop:0, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>GENERATE</div>
            <input style={{ ...st.input, marginBottom:0 }} placeholder={tr(trendsLang, "ui.phTopic")} value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !loading && generate()} />
            <button style={{ ...st.button, margin:0, width:"100%", opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={generate}>
              {loading ? tr(trendsLang, "ui.aiWriting") : tr(trendsLang, "ui.generateBtn")}
            </button>
          </div>
        </div>

        {/* Colonne droite — résultat */}
        <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:12 }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.output")}</h3>
          <textarea
            style={{ ...st.textarea, height: isMobile ? 200 : 280, minHeight:"unset", flex:"none", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", resize:"none", background:"#0f172a", overflowY:"auto" }}
            placeholder={tr(trendsLang, "ui.outputPlaceholder")}
            value={post}
            onChange={(e) => setPost(e.target.value)}
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
      </div>
    </>
  );
}
