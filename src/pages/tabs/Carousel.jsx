/**
 * GrowthPILOT — Carousel Generator Tab
 * File: src/pages/tabs/Carousel.jsx
 *
 * Props reçus depuis Generator.jsx :
 *   trendsLang, isMobile, token, post, topic, memory, showToast, setPage
 *
 * Fonctionnement :
 *  1. L'utilisateur saisit un topic (ou importe le post actif)
 *  2. L'IA génère N slides (titre + corps + emoji)
 *  3. L'utilisateur choisit un thème visuel + personnalise chaque slide
 *  4. Aperçu live slide par slide avec navigation
 *  5. Export : copier le texte brut de chaque slide, ou télécharger en HTML imprimable (→ PDF via navigateur)
 */

import { useState, useRef } from "react";
import { t as tr } from "../../translations.js";

const API = "https://social-ai-app-production.up.railway.app";

/* ─── Thèmes visuels ─────────────────────────────────────────── */
const THEMES = {
  dark: {
    label: "DARK PRO",
    bg: "linear-gradient(135deg,#0f0f0f 0%,#1a1a2e 100%)",
    card: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    accent: "#ef4444",
    accentGlow: "rgba(239,68,68,0.25)",
    titleColor: "#ffffff",
    bodyColor: "#94a3b8",
    numColor: "rgba(239,68,68,0.35)",
    font: "'SF Pro Display', -apple-system, sans-serif",
  },
  light: {
    label: "CLEAN WHITE",
    bg: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)",
    card: "rgba(0,0,0,0.03)",
    border: "1px solid rgba(0,0,0,0.08)",
    accent: "#ef4444",
    accentGlow: "rgba(239,68,68,0.15)",
    titleColor: "#0f172a",
    bodyColor: "#475569",
    numColor: "rgba(239,68,68,0.2)",
    font: "'SF Pro Display', -apple-system, sans-serif",
  },
  navy: {
    label: "NAVY EXEC",
    bg: "linear-gradient(135deg,#0a1628 0%,#1e3a5f 100%)",
    card: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    accent: "#60a5fa",
    accentGlow: "rgba(96,165,250,0.25)",
    titleColor: "#f0f9ff",
    bodyColor: "#93c5fd",
    numColor: "rgba(96,165,250,0.25)",
    font: "'SF Pro Display', -apple-system, sans-serif",
  },
  emerald: {
    label: "GROWTH GREEN",
    bg: "linear-gradient(135deg,#022c22 0%,#064e3b 100%)",
    card: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(52,211,153,0.15)",
    accent: "#34d399",
    accentGlow: "rgba(52,211,153,0.25)",
    titleColor: "#ecfdf5",
    bodyColor: "#6ee7b7",
    numColor: "rgba(52,211,153,0.2)",
    font: "'SF Pro Display', -apple-system, sans-serif",
  },
  purple: {
    label: "CREATOR PURPLE",
    bg: "linear-gradient(135deg,#13001a 0%,#2d1b4e 100%)",
    card: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(167,139,250,0.15)",
    accent: "#a78bfa",
    accentGlow: "rgba(167,139,250,0.25)",
    titleColor: "#faf5ff",
    bodyColor: "#c4b5fd",
    numColor: "rgba(167,139,250,0.2)",
    font: "'SF Pro Display', -apple-system, sans-serif",
  },
};

const SLIDE_COUNTS = [3, 5, 7, 10];

/* ─── Styles inline ─────────────────────────────────────────── */
const s = {
  wrap: { display: "flex", flexDirection: "column", gap: 24, padding: "0 0 40px" },
  row: { display: "flex", gap: 16, flexWrap: "wrap" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: "#64748b", marginBottom: 8, display: "block" },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  textarea: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 },
  btn: { background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "1px", padding: "12px 20px", cursor: "pointer", whiteSpace: "nowrap" },
  btnGhost: { background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "10px 16px", cursor: "pointer" },
  btnSmall: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#94a3b8", fontSize: 11, fontWeight: 600, padding: "6px 12px", cursor: "pointer" },
  themeBtn: (active, th) => ({ border: active ? `2px solid ${th.accent}` : "2px solid transparent", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: "1px", background: active ? `${th.accentGlow}` : "rgba(255,255,255,0.04)", color: active ? th.accent : "#64748b", transition: "all 0.2s" }),
  slidePreview: (th, size) => ({
    background: th.bg, borderRadius: 16, padding: size === "lg" ? "40px 36px" : "24px 22px",
    minHeight: size === "lg" ? 320 : 180, display: "flex", flexDirection: "column",
    justifyContent: "space-between", position: "relative", overflow: "hidden",
    border: th.border, fontFamily: th.font, boxSizing: "border-box",
    transition: "all 0.3s",
  }),
  slideNum: (th, size) => ({
    fontSize: size === "lg" ? 120 : 64, fontWeight: 900, color: th.numColor,
    position: "absolute", top: size === "lg" ? -20 : -10, right: size === "lg" ? 20 : 10,
    lineHeight: 1, userSelect: "none", pointerEvents: "none",
  }),
  slideEmoji: (size) => ({ fontSize: size === "lg" ? 32 : 20, marginBottom: size === "lg" ? 12 : 8 }),
  slideTitle: (th, size) => ({ color: th.titleColor, fontSize: size === "lg" ? 22 : 14, fontWeight: 800, lineHeight: 1.3, marginBottom: size === "lg" ? 12 : 8, position: "relative" }),
  slideBody: (th, size) => ({ color: th.bodyColor, fontSize: size === "lg" ? 15 : 11, lineHeight: 1.65, position: "relative", flex: 1 }),
  accentBar: (th) => ({ width: 32, height: 3, background: th.accent, borderRadius: 2, marginBottom: 12 }),
  slideFooter: (th, size) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: size === "lg" ? 20 : 12, paddingTop: size === "lg" ? 16 : 10, borderTop: `1px solid ${th.border.split("solid ")[1]}` }),
  footerBrand: (th, size) => ({ color: th.accent, fontSize: size === "lg" ? 11 : 9, fontWeight: 700, letterSpacing: "1px" }),
  footerPagination: (th, size) => ({ color: th.bodyColor, fontSize: size === "lg" ? 11 : 9, opacity: 0.6 }),
  navBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94a3b8", fontSize: 16 },
  dot: (active) => ({ width: active ? 20 : 6, height: 6, borderRadius: 3, background: active ? "#ef4444" : "rgba(255,255,255,0.15)", transition: "all 0.25s", cursor: "pointer" }),
  badge: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#ef4444", letterSpacing: "1px" },
  hint: { fontSize: 11, color: "#475569", marginTop: 4 },
  divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" },
  progressBar: (pct) => ({ height: 3, background: `linear-gradient(90deg,#ef4444 ${pct}%,rgba(255,255,255,0.06) ${pct}%)`, borderRadius: 2, marginTop: 8 }),
};

/* ─── SlideCard ─────────────────────────────────────────────── */
function SlideCard({ slide, index, total, theme, size = "lg", brand = "GrowthPILOT" }) {
  const th = THEMES[theme];
  return (
    <div style={s.slidePreview(th, size)}>
      <div style={s.slideNum(th, size)}>{index + 1}</div>
      <div>
        <div style={s.slideEmoji(size)}>{slide.emoji || "💡"}</div>
        <div style={s.accentBar(th)} />
        <div style={s.slideTitle(th, size)}>{slide.title}</div>
        <div style={s.slideBody(th, size)}>{slide.body}</div>
      </div>
      <div style={s.slideFooter(th, size)}>
        <span style={s.footerBrand(th, size)}>⚡ {brand.toUpperCase()}</span>
        <span style={s.footerPagination(th, size)}>{index + 1} / {total}</span>
      </div>
    </div>
  );
}

/* ─── Composant principal ───────────────────────────────────── */
export default function Carousel({ trendsLang, isMobile, token, post, topic: topicProp, memory, showToast, setPage }) {

  const [topic, setTopic]           = useState(topicProp || "");
  const [slideCount, setSlideCount] = useState(5);
  const [theme, setTheme]           = useState("dark");
  const [brand, setBrand]           = useState("GrowthPILOT");
  const [slides, setSlides]         = useState([]);
  const [current, setCurrent]       = useState(0);
  const [loading, setLoading]       = useState(false);
  const [editIdx, setEditIdx]       = useState(null);
  const exportRef = useRef(null);

  const th = THEMES[theme];

  /* ── Génération IA ── */
  const generate = async () => {
    if (!topic.trim()) { showToast("⚠️ " + tr(trendsLang, "carousel.noTopic")); return; }
    setLoading(true);
    setSlides([]);
    setCurrent(0);
    try {
      const systemPrompt = `You are an expert LinkedIn carousel creator. Generate exactly ${slideCount} slides for a LinkedIn carousel post.
Return ONLY a valid JSON array, no markdown, no explanation.
Each slide: { "emoji": "single emoji", "title": "short punchy title (max 8 words)", "body": "2-4 sentences of value (max 60 words)" }
Slide 1: Hook — attention-grabbing opener with a bold promise or surprising stat.
Slides 2 to ${slideCount - 1}: Value — actionable insight, tip, or framework point.
Slide ${slideCount}: CTA — clear call to action (follow, save, comment).
Niche context: ${memory?.niche || "business"} | Audience: ${memory?.audience || "professionals"} | Tone: ${memory?.tone || "expert"}.
Topic: "${topic}"`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: `Create a ${slideCount}-slide LinkedIn carousel about: ${topic}` }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "[]";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("bad response");
      setSlides(parsed);
      showToast(tr(trendsLang, "carousel.generated"));
    } catch {
      showToast("❌ " + tr(trendsLang, "carousel.generationFailed"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Navigation ── */
  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(slides.length - 1, c + 1));

  /* ── Edit inline ── */
  const updateSlide = (idx, field, val) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  /* ── Copy texte ── */
  const copyAll = async () => {
    const text = slides.map((s, i) =>
      `— Slide ${i + 1} —\n${s.emoji} ${s.title}\n\n${s.body}`
    ).join("\n\n");
    await navigator.clipboard.writeText(text);
    showToast(tr(trendsLang, "messages.copied"));
  };

  const copySlide = async (i) => {
    const s = slides[i];
    await navigator.clipboard.writeText(`${s.emoji} ${s.title}\n\n${s.body}`);
    showToast(tr(trendsLang, "messages.copied"));
  };

  /* ── Export HTML imprimable (→ PDF via Ctrl+P) ── */
  const exportHTML = () => {
    if (!slides.length) return;
    const slideHTML = slides.map((sl, i) => `
      <div class="slide" style="background:${th.bg};border-radius:16px;padding:40px 36px;min-height:320px;
        display:flex;flex-direction:column;justify-content:space-between;position:relative;
        overflow:hidden;font-family:-apple-system,sans-serif;border:${th.border};break-inside:avoid;margin-bottom:24px;">
        <div style="font-size:100px;font-weight:900;color:${th.numColor};position:absolute;top:-15px;right:16px;line-height:1;">${i + 1}</div>
        <div>
          <div style="font-size:28px;margin-bottom:10px;">${sl.emoji}</div>
          <div style="width:32px;height:3px;background:${th.accent};border-radius:2px;margin-bottom:12px;"></div>
          <div style="color:${th.titleColor};font-size:20px;font-weight:800;line-height:1.3;margin-bottom:12px;">${sl.title}</div>
          <div style="color:${th.bodyColor};font-size:14px;line-height:1.7;">${sl.body}</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:20px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);">
          <span style="color:${th.accent};font-size:10px;font-weight:700;letter-spacing:1px;">⚡ ${brand.toUpperCase()}</span>
          <span style="color:${th.bodyColor};font-size:10px;opacity:0.6;">${i + 1} / ${slides.length}</span>
        </div>
      </div>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${topic} — Carousel</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0a0a0a;padding:40px;max-width:540px;margin:0 auto;}
      @media print{body{background:#0a0a0a;}}</style></head>
      <body>${slideHTML}</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carousel-${topic.slice(0, 30).replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("✓ HTML exporté — ouvrir + Ctrl+P pour PDF");
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div style={s.wrap}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "#ef4444", marginBottom: 6 }}>
          {tr(trendsLang, "carousel.header")}
        </div>
        <div style={{ color: "#94a3b8", fontSize: 13 }}>{tr(trendsLang, "carousel.subtitle")}</div>
      </div>

      {/* ── Config ── */}
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>
            {tr(trendsLang, "carousel.configTitle")}
          </span>
          <span style={s.badge}>CAROUSEL</span>
        </div>

        {/* Topic */}
        <span style={s.label}>{tr(trendsLang, "carousel.topicLabel")}</span>
        <input
          style={s.input}
          placeholder={tr(trendsLang, "carousel.topicPlaceholder")}
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === "Enter" && generate()}
        />
        <p style={s.hint}>{tr(trendsLang, "carousel.topicHint")}</p>

        <div style={s.divider} />

        {/* Slides count + brand */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <span style={s.label}>{tr(trendsLang, "carousel.slideCount")}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {SLIDE_COUNTS.map(n => (
                <button
                  key={n}
                  style={{ ...s.btnSmall, border: slideCount === n ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.1)", color: slideCount === n ? "#ef4444" : "#64748b", fontWeight: 700 }}
                  onClick={() => setSlideCount(n)}
                >{n}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <span style={s.label}>{tr(trendsLang, "carousel.brandLabel")}</span>
            <input
              style={{ ...s.input, padding: "8px 12px" }}
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="GrowthPILOT"
            />
          </div>
        </div>

        {/* Themes */}
        <span style={s.label}>{tr(trendsLang, "carousel.themeLabel")}</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(THEMES).map(([key, th]) => (
            <button key={key} style={s.themeBtn(theme === key, th)} onClick={() => setTheme(key)}>
              {th.label}
            </button>
          ))}
        </div>

        <div style={s.divider} />

        {/* Generate */}
        <button style={{ ...s.btn, width: "100%", marginTop: 4, fontSize: 13, padding: "14px" }} onClick={generate} disabled={loading}>
          {loading
            ? `${tr(trendsLang, "carousel.generating")} ...`
            : `${tr(trendsLang, "carousel.generateBtn")} (${slideCount} slides) →`}
        </button>
        {loading && <div style={s.progressBar(66)} />}
      </div>

      {/* ── Preview + Edit ── */}
      {slides.length > 0 && (
        <>
          {/* Actions bar */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700, flex: 1 }}>
              {slides.length} SLIDES GÉNÉRÉES
            </span>
            <button style={s.btnGhost} onClick={copyAll}>📋 {tr(trendsLang, "carousel.copyAll")}</button>
            <button style={s.btnGhost} onClick={exportHTML}>⬇️ {tr(trendsLang, "carousel.exportHTML")}</button>
            <button style={{ ...s.btn, padding: "10px 16px", fontSize: 11 }} onClick={generate}>🔄 {tr(trendsLang, "carousel.regenerate")}</button>
          </div>

          {/* Main preview */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 20 }}>

            {/* Left — aperçu grande taille */}
            <div>
              <SlideCard slide={slides[current]} index={current} total={slides.length} theme={theme} size="lg" brand={brand} />

              {/* Navigation */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 16 }}>
                <button style={s.navBtn} onClick={prev} disabled={current === 0}>‹</button>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {slides.map((_, i) => (
                    <div key={i} style={s.dot(i === current)} onClick={() => setCurrent(i)} />
                  ))}
                </div>
                <button style={s.navBtn} onClick={next} disabled={current === slides.length - 1}>›</button>
              </div>

              {/* Edit slide actuelle */}
              <div style={{ ...s.card, marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>
                    ✏️ {tr(trendsLang, "carousel.editSlide")} {current + 1}
                  </span>
                  <button style={s.btnSmall} onClick={() => copySlide(current)}>📋 Copier</button>
                </div>
                <span style={s.label}>EMOJI</span>
                <input
                  style={{ ...s.input, width: 70, marginBottom: 10 }}
                  value={slides[current]?.emoji || ""}
                  onChange={e => updateSlide(current, "emoji", e.target.value)}
                />
                <span style={s.label}>TITRE</span>
                <input
                  style={{ ...s.input, marginBottom: 10 }}
                  value={slides[current]?.title || ""}
                  onChange={e => updateSlide(current, "title", e.target.value)}
                />
                <span style={s.label}>CORPS</span>
                <textarea
                  style={s.textarea}
                  value={slides[current]?.body || ""}
                  onChange={e => updateSlide(current, "body", e.target.value)}
                />
              </div>
            </div>

            {/* Right — toutes les slides en miniature */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", maxHeight: isMobile ? "none" : 700 }}>
              <span style={s.label}>TOUTES LES SLIDES</span>
              {slides.map((slide, i) => (
                <div
                  key={i}
                  style={{ cursor: "pointer", opacity: current === i ? 1 : 0.55, transition: "opacity 0.2s", outline: current === i ? `2px solid ${th.accent}` : "none", borderRadius: 12 }}
                  onClick={() => setCurrent(i)}
                >
                  <SlideCard slide={slide} index={i} total={slides.length} theme={theme} size="sm" brand={brand} />
                </div>
              ))}
            </div>
          </div>

          {/* Texte brut de toutes les slides */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>
                {tr(trendsLang, "carousel.rawText")}
              </span>
              <button style={s.btnGhost} onClick={copyAll}>📋 COPIER TOUT</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {slides.map((sl, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${i === current ? "#ef4444" : "rgba(255,255,255,0.08)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#64748b", fontSize: 10, fontWeight: 700 }}>SLIDE {i + 1} {sl.emoji}</span>
                    <button style={{ ...s.btnSmall, padding: "3px 8px", fontSize: 10 }} onClick={() => copySlide(i)}>COPIER</button>
                  </div>
                  <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{sl.title}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6 }}>{sl.body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ ...s.card, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
            <span style={{ color: "#ef4444", fontSize: 11, fontWeight: 700 }}>
              ⚡ {tr(trendsLang, "carousel.tipsTitle")}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {(tr(trendsLang, "carousel.tips") || []).map((tip, i) => (
                <div key={i} style={{ color: "#64748b", fontSize: 12 }}>› {tip}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {slides.length === 0 && !loading && (
        <div style={{ ...s.card, textAlign: "center", padding: "60px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎠</div>
          <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            {tr(trendsLang, "carousel.emptyTitle")}
          </div>
          <div style={{ color: "#475569", fontSize: 13 }}>
            {tr(trendsLang, "carousel.emptyDesc")}
          </div>
        </div>
      )}
    </div>
  );
}
