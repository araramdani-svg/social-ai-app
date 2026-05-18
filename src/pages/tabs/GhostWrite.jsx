/**
 * GrowthPILOT — Ghost Writing Tab
 * File: src/pages/tabs/GhostWrite.jsx
 *
 * Props reçus depuis Generator.jsx :
 *   trendsLang, isMobile, token, post, setPost, setTab, memory, showToast
 *
 * Fonctionnement :
 *  1. L'utilisateur entre un topic OU colle un post source
 *  2. Il définit le style cible (auteur prédéfini OU style custom décrit en texte)
 *  3. L'IA réécrit dans ce style en gardant le fond
 *  4. Résultat chargé dans le post actif → peut aller en Create/Publish
 */

import { PageHeader } from "./shared.js";
import { useState } from "react";
import { t as tr } from "../../translations.js";
const API = "https://social-ai-app-production.up.railway.app";

const PRESET_AUTHORS = [
  { id: "hormozi",   label: "Alex Hormozi",    emoji: "💰", desc: "Direct, frameworks chiffrés, no-BS, bullet lists brutaux" },
  { id: "naval",     label: "Naval Ravikant",  emoji: "🧘", desc: "Aphorismes courts, philosophie, pensée profonde, minimaliste" },
  { id: "altman",    label: "Sam Altman",      emoji: "🚀", desc: "Visionnaire, prudent, tech-optimiste, phrases brèves et denses" },
  { id: "cardone",   label: "Grant Cardone",   emoji: "⚡", desc: "Énergie maximale, impératif, 10X, urgence, conviction totale" },
  { id: "godin",     label: "Seth Godin",      emoji: "🎯", desc: "Paraboles courtes, contre-intuitif, marketing, changement" },
  { id: "ferris",    label: "Tim Ferriss",     emoji: "📋", desc: "Frameworks pratiques, listes, expérimentation, productivité" },
  { id: "brown",     label: "Brené Brown",     emoji: "❤️", desc: "Vulnérabilité, empathie, storytelling personnel, chaleureux" },
  { id: "sivers",    label: "Derek Sivers",    emoji: "🌀", desc: "Ultra court, angle inattendu, simplicité radicale, insight unique" },
  { id: "custom",    label: "Style custom",    emoji: "✍️", desc: "Décris toi-même le style cible" },
];

const REWRITE_MODES = [
  { id: "full",    label: "Réécriture complète", desc: "Même message, style radicalement différent" },
  { id: "hook",    label: "Nouveau hook",         desc: "Garde le corps, réécrit uniquement l'accroche" },
  { id: "shorter", label: "Version courte",       desc: "Condense en 50% sans perdre l'essentiel" },
  { id: "thread",  label: "Thread X/LinkedIn",   desc: "Découpe en série de 5-8 mini-posts numérotés" },
];

const s = {
  wrap:    { display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 },
  card:    { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 },
  label:   { fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: "#64748b", marginBottom: 8, display: "block" },
  input:   { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  textarea:{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "vertical", minHeight: 130, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.7 },
  btn:     { background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "1px", padding: "13px 20px", cursor: "pointer" },
  btnGhost:{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "10px 16px", cursor: "pointer" },
  authorBtn: (active) => ({
    display: "flex", alignItems: "flex-start", gap: 10,
    background: active ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)",
    border: active ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left",
    transition: "all 0.2s", width: "100%",
  }),
  modeBtn: (active) => ({
    background: active ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)",
    border: active ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "left",
    transition: "all 0.2s", flex: 1,
  }),
  badge: (color) => ({ background: `rgba(${color},0.12)`, border: `1px solid rgba(${color},0.25)`, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, color: `rgb(${color})`, letterSpacing: "1px" }),
  divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" },
  progressBar: { height: 3, background: "linear-gradient(90deg,#ef4444,#f97316,#ef4444)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: 2, marginTop: 8 },
  diffAdd:  { background: "rgba(52,211,153,0.08)", borderLeft: "3px solid #34d399", padding: "10px 14px", borderRadius: "0 6px 6px 0", margin: "4px 0", color: "#6ee7b7", fontSize: 13, lineHeight: 1.7 },
  diffOrig: { background: "rgba(239,68,68,0.06)", borderLeft: "3px solid rgba(239,68,68,0.4)", padding: "10px 14px", borderRadius: "0 6px 6px 0", margin: "4px 0", color: "#94a3b8", fontSize: 12, lineHeight: 1.7, textDecoration: "line-through", opacity: 0.7 },
};

export default function GhostWrite({ trendsLang, isMobile, token, post: activeProp, setPost, setTab, memory, showToast }) {

  const [source, setSource]       = useState(activeProp || "");
  const [authorId, setAuthorId]   = useState("hormozi");
  const [customStyle, setCustomStyle] = useState("");
  const [modeId, setModeId]       = useState("full");
  const [result, setResult]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [showDiff, setShowDiff]   = useState(false);
  const [history, setHistory]     = useState([]);

  const selectedAuthor = PRESET_AUTHORS.find(a => a.id === authorId);

  const rewrite = async () => {
    if (!source.trim()) { showToast("⚠️ " + tr(trendsLang, "ghostwrite.noSource")); return; }
    const styleDesc = authorId === "custom"
      ? customStyle || "professional, clear, engaging"
      : `${selectedAuthor.label}'s style: ${selectedAuthor.desc}`;
    const modeDesc = REWRITE_MODES.find(m => m.id === modeId);

    setLoading(true);
    setResult("");
    try {
      const langMap = { fr:"French", es:"Spanish", de:"German", it:"Italian", pt:"Portuguese" };
    const langName = langMap[trendsLang] || "English";
    const systemPrompt = `You are a master ghostwriter specializing in LinkedIn and social media content.
Your task: rewrite the given text in the exact voice, style, and format of ${styleDesc}.
Mode: ${modeDesc?.label} — ${modeDesc?.desc}.
IMPORTANT: Write the output in ${langName} language.
Rules:
- Keep the core message and facts identical
- Adopt the vocabulary, sentence rhythm, and formatting patterns of the target style
- ${modeId === "thread" ? "Number each part as 1/, 2/, 3/ etc. Max 8 parts." : ""}
- ${modeId === "shorter" ? "Target 50% of original length. No fluff." : ""}
- ${modeId === "hook" ? "ONLY rewrite the first line/paragraph. Keep the rest intact." : ""}
- Do NOT add disclaimers or meta-commentary. Return ONLY the rewritten content.
Context: niche=${memory?.niche || "business"}, audience=${memory?.audience || "professionals"}`;

      const res = await fetch(`${API}/generate/ghostwrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ source, systemPrompt, lang: trendsLang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "server error");
      const text = data.text || "";
      if (!text) throw new Error("empty");
      setResult(text);
      setHistory(prev => [{ author: selectedAuthor?.label || "Custom", mode: modeDesc?.label, original: source, result: text, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
      showToast(tr(trendsLang, "ghostwrite.done"));
    } catch {
      showToast("❌ " + tr(trendsLang, "ghostwrite.failed"));
    } finally {
      setLoading(false);
    }
  };

  const useResult = () => {
    if (!result) return;
    setPost(result);
    showToast(tr(trendsLang, "ghostwrite.sentToCreate"));
    setTab("create");
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(result);
    showToast(tr(trendsLang, "messages.copied"));
  };

  return (
    <div style={s.wrap}>
      <PageHeader tabKey="ghostwrite" trendsLang={trendsLang} isMobile={isMobile} />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>

        {/* ── LEFT : Input ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Source */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>
                {tr(trendsLang, "ghostwrite.sourceTitle")}
              </span>
              {activeProp && (
                <button style={s.btnGhost} onClick={() => setSource(activeProp)}>
                  ← {tr(trendsLang, "ghostwrite.importActive")}
                </button>
              )}
            </div>
            <textarea
              style={{ ...s.textarea, minHeight: 160 }}
              placeholder={tr(trendsLang, "ghostwrite.sourcePlaceholder")}
              value={source}
              onChange={e => setSource(e.target.value)}
            />
            <div style={{ color: "#475569", fontSize: 11, marginTop: 6 }}>
              {source.trim().split(/\s+/).filter(Boolean).length} mots
            </div>
          </div>

          {/* Author picker */}
          <div style={s.card}>
            <span style={s.label}>{tr(trendsLang, "ghostwrite.authorLabel")}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PRESET_AUTHORS.map(a => (
                <button key={a.id} style={s.authorBtn(authorId === a.id)} onClick={() => setAuthorId(a.id)}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{a.emoji}</span>
                  <div>
                    <div style={{ color: authorId === a.id ? "#ef4444" : "#e2e8f0", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      {a.label}
                    </div>
                    <div style={{ color: "#475569", fontSize: 11, lineHeight: 1.4 }}>{a.desc}</div>
                  </div>
                  {authorId === a.id && <span style={{ marginLeft: "auto", color: "#ef4444", fontSize: 16, flexShrink: 0 }}>✓</span>}
                </button>
              ))}
            </div>
            {authorId === "custom" && (
              <textarea
                style={{ ...s.textarea, marginTop: 12, minHeight: 80 }}
                placeholder={tr(trendsLang, "ghostwrite.customStylePlaceholder")}
                value={customStyle}
                onChange={e => setCustomStyle(e.target.value)}
              />
            )}
          </div>

          {/* Mode */}
          <div style={s.card}>
            <span style={s.label}>{tr(trendsLang, "ghostwrite.modeLabel")}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {REWRITE_MODES.map(m => (
                <button key={m.id} style={s.modeBtn(modeId === m.id)} onClick={() => setModeId(m.id)}>
                  <div style={{ color: modeId === m.id ? "#ef4444" : "#e2e8f0", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                    {m.label}
                  </div>
                  <div style={{ color: "#475569", fontSize: 11 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button style={{ ...s.btn, width: "100%", fontSize: 13, padding: "14px" }} onClick={rewrite} disabled={loading}>
            {loading ? "✍️ " + tr(trendsLang, "ghostwrite.writing") + "..." : `✍️ ${tr(trendsLang, "ghostwrite.rewriteBtn")} →`}
          </button>
          {loading && <div style={s.progressBar} />}
        </div>

        {/* ── RIGHT : Output ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Result */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>
                {tr(trendsLang, "ghostwrite.resultTitle")}
                {result && <span style={{ ...s.badge("52,211,153"), marginLeft: 8 }}>PRÊT</span>}
              </span>
              {result && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={s.btnGhost} onClick={() => setShowDiff(!showDiff)}>
                    {showDiff ? "📝 Résultat" : "🔍 Diff"}
                  </button>
                  <button style={s.btnGhost} onClick={copyResult}>📋</button>
                </div>
              )}
            </div>

            {result && !showDiff && (
              <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", minHeight: 160 }}>
                {result}
              </div>
            )}

            {result && showDiff && (
              <div>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>ORIGINAL</div>
                <div style={s.diffOrig}>{source}</div>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, margin: "12px 0 6px" }}>RÉÉCRITURE</div>
                <div style={s.diffAdd}>{result}</div>
              </div>
            )}

            {!result && !loading && (
              <div style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                {tr(trendsLang, "ghostwrite.emptyResult")}
              </div>
            )}

            {result && (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button style={{ ...s.btn, flex: 1 }} onClick={useResult}>
                  → {tr(trendsLang, "ghostwrite.sendToCreate")}
                </button>
                <button style={{ ...s.btnGhost, flex: 1 }} onClick={rewrite}>
                  🔄 {tr(trendsLang, "ghostwrite.retry")}
                </button>
              </div>
            )}
          </div>

          {/* Style indicator */}
          {selectedAuthor && (
            <div style={{ ...s.card, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{selectedAuthor.emoji}</span>
                <div>
                  <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>{selectedAuthor.label}</div>
                  <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{selectedAuthor.desc}</div>
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={s.card}>
              <span style={s.label}>{tr(trendsLang, "ghostwrite.historyLabel")}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map((h, i) => (
                  <div
                    key={i}
                    style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)" }}
                    onClick={() => setResult(h.result)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#64748b", fontSize: 10, fontWeight: 700 }}>{h.author} · {h.mode}</span>
                      <span style={{ color: "#334155", fontSize: 10 }}>{h.ts}</span>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.result.slice(0, 80)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}
