import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Memory({ trendsLang, isMobile, memory, setMemory, saveBrandMemory }) {
  return (
    <>
      <PageHeader tabKey="memory" trendsLang={trendsLang} isMobile={isMobile} />

      {/* Encart explicatif */}
      <div style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", gap:12, alignItems:"flex-start" }}>
        <span style={{ fontSize:20, flexShrink:0 }}>🧠</span>
        <div>
          <div style={{ color:"#3b82f6", fontWeight:700, fontSize:13, marginBottom:4 }}>{tr(trendsLang, "ui.memoryExplainTitle")}</div>
          <div style={{ color:"#64748b", fontSize:12, lineHeight:1.6 }}>{tr(trendsLang, "ui.memoryExplainDesc")}</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>
        {/* Formulaire */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { key:"niche",        label: tr(trendsLang, "ui.memNiche"),       ph: tr(trendsLang, "ui.phNiche"),       hint: tr(trendsLang, "ui.memNicheHint") },
            { key:"audience",     label: tr(trendsLang, "ui.memAudience"),    ph: tr(trendsLang, "ui.phAudience"),    hint: tr(trendsLang, "ui.memAudienceHint") },
            { key:"tone",         label: tr(trendsLang, "ui.memTone"),        ph: tr(trendsLang, "ui.phTone"),        hint: tr(trendsLang, "ui.memToneHint") },
            { key:"cta",          label: tr(trendsLang, "ui.memCta"),         ph: tr(trendsLang, "ui.phCta"),         hint: tr(trendsLang, "ui.memCtaHint") },
            { key:"banned_words", label: tr(trendsLang, "ui.memBannedWords"), ph: tr(trendsLang, "ui.phBannedWords"), hint: tr(trendsLang, "ui.memBannedHint") },
          ].map(({ key, label, ph, hint }) => (
            <div key={key}>
              <div style={{ color:"#94a3b8", fontSize:11, letterSpacing:"1px", marginBottom:4 }}>{label}</div>
              <input style={{ ...st.input, marginBottom:2 }} placeholder={ph} value={memory[key] || ""} onChange={(e) => setMemory({...memory, [key]: e.target.value})} />
              {hint && <div style={{ color:"#334155", fontSize:11, paddingLeft:4 }}>{hint}</div>}
            </div>
          ))}
          <button style={{ ...st.button, margin:0, width:"100%" }} onClick={saveBrandMemory}>{tr(trendsLang, "ui.saveMemory")}</button>
        </div>

        {/* Preview */}
        <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:16, overflowY:"auto" }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.brandIntelligence")}</h3>
          {[
            [tr(trendsLang, "ui.memNiche"),       memory.niche],
            [tr(trendsLang, "ui.memAudience"),    memory.audience],
            [tr(trendsLang, "ui.memTone"),        memory.tone],
            [tr(trendsLang, "ui.memCta"),         memory.cta],
            [tr(trendsLang, "ui.memBannedWords"), memory.banned_words],
          ].map(([label, value]) => (
            <div key={label} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:4 }}>{label}</div>
              <div style={{ color: value ? "#fff" : "#334155", fontSize:14 }}>{value || tr(trendsLang, "ui.memNotDefined")}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
