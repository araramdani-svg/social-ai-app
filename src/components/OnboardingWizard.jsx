// src/components/OnboardingWizard.jsx
// GrowthPILOT — Onboarding Wizard Pro — 4 étapes multilingue

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { t as tr } from "../translations.js";
import logo from "../assets/logo.png";

const API = "https://social-ai-app-production.up.railway.app";

const NICHES = [
  { key:"ai",        icon:"🤖", label:"AI & Technology" },
  { key:"saas",      icon:"🚀", label:"SaaS & Startups" },
  { key:"marketing", icon:"📈", label:"Marketing & Growth" },
  { key:"finance",   icon:"💰", label:"Finance & Investing" },
  { key:"leadership",icon:"🏆", label:"Leadership & Management" },
  { key:"health",    icon:"💪", label:"Health & Wellness" },
  { key:"realestate",icon:"🏠", label:"Real Estate" },
  { key:"ecom",      icon:"🛒", label:"E-commerce" },
  { key:"creator",   icon:"🎨", label:"Creator Economy" },
  { key:"cyber",     icon:"🔐", label:"Cybersecurity" },
  { key:"education", icon:"📚", label:"Education & Coaching" },
  { key:"other",     icon:"✨", label:"Other" },
];

const TONES = [
  { key:"inspirational", emoji:"💫", label:"Inspirational",  desc:"Motivate & uplift your audience" },
  { key:"educational",   emoji:"🎓", label:"Educational",    desc:"Share knowledge & insights" },
  { key:"humorous",      emoji:"😄", label:"Humorous",       desc:"Entertain with wit & humor" },
  { key:"professional",  emoji:"💼", label:"Professional",   desc:"Authority & credibility" },
  { key:"storytelling",  emoji:"📖", label:"Storytelling",   desc:"Narratives that connect" },
  { key:"provocative",   emoji:"🔥", label:"Provocative",    desc:"Challenge & spark debate" },
];

const STEP_META = [
  { icon:"👋", label:"Welcome" },
  { icon:"🎯", label:"Niche" },
  { icon:"🎨", label:"Voice" },
  { icon:"✍️", label:"First Post" },
];

export default function OnboardingWizard({ token, trendsLang = "en", onComplete }) {
  const [step,     setStep]     = useState(0);
  const [niche,    setNiche]    = useState("");
  const [audience, setAudience] = useState("");
  const [tone,     setTone]     = useState("");
  const [topic,    setTopic]    = useState("");
  const [post,     setPost]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [dir,      setDir]      = useState(1); // direction d'animation

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const t = (key) => tr(trendsLang, `onboarding.${key}`);
  const totalSteps = 4;

  const goNext = () => { setDir(1); setStep(s => s + 1); };
  const goPrev = () => { setDir(-1); setStep(s => s - 1); };

  const generate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/generate/post`, {
        method: "POST", headers,
        body: JSON.stringify({ topic, niche, audience, tone, lang: trendsLang }),
      });
      const d = await r.json();
      if (d.text) setPost(d.text);
    } catch {}
    setLoading(false);
  };

  const finish = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/auth/save-brand-memory`, {
        method: "POST", headers,
        body: JSON.stringify({ project_name:"default", niche, audience, tone, cta:"", banned_words:"" }),
      });
      await fetch(`${API}/auth/onboarding-done`, { method:"POST", headers });
    } catch {}
    setSaving(false);
    onComplete({ niche, audience, tone, post });
  };

  const canNext = (step === 0) || (step === 1 && niche) || (step === 2 && tone);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(2,6,23,0.97)", zIndex:999999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        style={{ width:"100%", maxWidth:600, background:"#080f1f", border:"1px solid rgba(220,38,38,0.2)", borderRadius:24, overflow:"hidden", boxShadow:"0 40px 120px rgba(0,0,0,0.8)" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ padding:"24px 32px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img src={logo} alt="logo" style={{ width:28, height:28, objectFit:"contain" }} />
              <span style={{ color:"#ef4444", fontWeight:900, fontSize:15, letterSpacing:"0.5px" }}>GrowthPILOT</span>
            </div>
            <div style={{ color:"#334155", fontSize:11, fontWeight:700 }}>
              {step + 1} / {totalSteps}
            </div>
          </div>

          {/* Step indicators */}
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            {STEP_META.map((s, i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{
                  width:"100%", height:3, borderRadius:2,
                  background: i <= step ? "linear-gradient(90deg,#ef4444,#dc2626)" : "rgba(255,255,255,0.06)",
                  transition:"background 0.4s ease",
                }} />
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:10 }}>{s.icon}</span>
                  <span style={{ fontSize:9, fontWeight:700, color: i === step ? "#ef4444" : i < step ? "#475569" : "#1e293b", letterSpacing:"0.5px" }}>
                    {s.label.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div style={{ padding:"28px 32px", minHeight:360 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step}
              custom={dir}
              initial={{ opacity:0, x: dir * 30 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x: dir * -30 }}
              transition={{ duration:0.25 }}
            >

              {/* Step 0 — Welcome */}
              {step === 0 && (
                <div style={{ textAlign:"center" }}>
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.1, type:"spring" }}
                    style={{ fontSize:56, marginBottom:16 }}>🚀</motion.div>
                  <h1 style={{ color:"#fff", fontSize:26, fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.5px" }}>
                    {t("welcomeTitle")}
                  </h1>
                  <p style={{ color:"#64748b", fontSize:14, lineHeight:1.7, maxWidth:400, margin:"0 auto 28px" }}>
                    {t("welcomeSub")}
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"20px 24px", textAlign:"left", maxWidth:400, margin:"0 auto" }}>
                    {[
                      ["🎯", t("step1Define")],
                      ["🎨", t("step2Choose")],
                      ["✍️", t("step3Generate")],
                    ].map(([icon, label]) => (
                      <div key={label} style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:18, width:28, textAlign:"center" }}>{icon}</span>
                        <span style={{ color:"#94a3b8", fontSize:13 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1 — Niche */}
              {step === 1 && (
                <div>
                  <div style={{ color:"#ef4444", fontSize:9, fontWeight:700, letterSpacing:"2px", marginBottom:6 }}>{t("nicheStep")}</div>
                  <h2 style={{ color:"#fff", fontSize:22, fontWeight:900, margin:"0 0 6px" }}>{t("whoWritingFor")}</h2>
                  <p style={{ color:"#64748b", fontSize:13, marginBottom:20 }}>{t("whoWritingDesc")}</p>

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
                    {NICHES.map(n => (
                      <motion.button key={n.key} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                        style={{
                          padding:"10px 8px", borderRadius:10,
                          border: niche === n.label ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.07)",
                          background: niche === n.label ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.02)",
                          color: niche === n.label ? "#ef4444" : "#64748b",
                          fontWeight:700, fontSize:11, cursor:"pointer",
                          display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                        }}
                        onClick={() => setNiche(n.label)}
                      >
                        <span style={{ fontSize:18 }}>{n.icon}</span>
                        <span style={{ fontSize:10, lineHeight:1.2, textAlign:"center" }}>{n.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  <div>
                    <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"1.5px", marginBottom:8 }}>{t("yourAudience")}</div>
                    <input
                      style={{ width:"100%", boxSizing:"border-box", padding:"12px 16px", background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:10, color:"#fff", fontSize:13, outline:"none" }}
                      placeholder={t("audiencePlaceholder")}
                      value={audience}
                      onChange={e => setAudience(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2 — Tone */}
              {step === 2 && (
                <div>
                  <div style={{ color:"#ef4444", fontSize:9, fontWeight:700, letterSpacing:"2px", marginBottom:6 }}>{t("toneStep")}</div>
                  <h2 style={{ color:"#fff", fontSize:22, fontWeight:900, margin:"0 0 6px" }}>{t("yourVoice")}</h2>
                  <p style={{ color:"#64748b", fontSize:13, marginBottom:20 }}>{t("yourVoiceDesc")}</p>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {TONES.map(tn => (
                      <motion.div key={tn.key} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                        style={{
                          padding:"14px 16px", borderRadius:12, cursor:"pointer",
                          border: tone === tn.key ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.07)",
                          background: tone === tn.key ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.02)",
                          display:"flex", gap:12, alignItems:"flex-start",
                        }}
                        onClick={() => setTone(tn.key)}
                      >
                        <span style={{ fontSize:22, lineHeight:1 }}>{tn.emoji}</span>
                        <div>
                          <div style={{ color: tone === tn.key ? "#ef4444" : "#e2e8f0", fontWeight:700, fontSize:13, marginBottom:2 }}>{tn.label}</div>
                          <div style={{ color:"#475569", fontSize:11 }}>{tn.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — First Post */}
              {step === 3 && (
                <div>
                  <div style={{ color:"#ef4444", fontSize:9, fontWeight:700, letterSpacing:"2px", marginBottom:6 }}>{t("generateStep")}</div>
                  <h2 style={{ color:"#fff", fontSize:22, fontWeight:900, margin:"0 0 6px" }}>{t("firstPost")}</h2>
                  <p style={{ color:"#64748b", fontSize:13, marginBottom:16 }}>{t("firstPostDesc")}</p>

                  <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                    <input
                      style={{ flex:1, padding:"12px 16px", background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:10, color:"#fff", fontSize:13, outline:"none" }}
                      placeholder={t("topicPlaceholder")}
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !loading && generate()}
                    />
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      style={{ padding:"12px 20px", background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:10, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", opacity: loading || !topic ? 0.6 : 1 }}
                      disabled={loading || !topic} onClick={generate}
                    >
                      {loading ? "⏳" : "✍️ Generate"}
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {post && (
                      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:12, padding:16, maxHeight:200, overflowY:"auto", marginBottom:14 }}>
                        <div style={{ color:"#22c55e", fontSize:9, fontWeight:700, letterSpacing:"1.5px", marginBottom:8 }}>✅ {t("yourFirstPost")}</div>
                        <div style={{ color:"#e2e8f0", fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{post}</div>
                      </motion.div>
                    )}
                    {!post && (
                      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"24px 20px", textAlign:"center", color:"#334155", fontSize:13 }}>
                        {t("enterTopic")}
                      </div>
                    )}
                  </AnimatePresence>

                  <div style={{ background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:10, padding:"12px 16px" }}>
                    <div style={{ color:"#818cf8", fontSize:9, fontWeight:700, letterSpacing:"1.5px", marginBottom:6 }}>🧠 {t("voiceConfigured")}</div>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                      {[["Niche", niche], ["Tone", tone], ["Audience", audience?.slice(0,30)]].map(([k, v]) => v && (
                        <div key={k} style={{ fontSize:11, color:"#475569" }}>
                          <span style={{ color:"#334155" }}>{k}: </span>
                          <span style={{ color:"#64748b" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{ padding:"20px 32px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {step > 0 ? (
            <button onClick={goPrev}
              style={{ padding:"11px 20px", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#64748b", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              ← {t("back")}
            </button>
          ) : <div />}

          {step < totalSteps - 1 ? (
            <motion.button whileHover={{ scale: canNext ? 1.02 : 1 }} whileTap={{ scale: canNext ? 0.97 : 1 }}
              style={{ padding:"12px 28px", background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:10, color:"#fff", fontWeight:800, fontSize:14, cursor: canNext ? "pointer" : "not-allowed", opacity: canNext ? 1 : 0.4, letterSpacing:"0.5px" }}
              disabled={!canNext} onClick={goNext}
            >
              {step === 0 ? `${t("letsGo")} 🚀` : `${t("continue")} →`}
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              style={{ padding:"12px 28px", background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", borderRadius:10, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", opacity: saving ? 0.6 : 1 }}
              disabled={saving} onClick={finish}
            >
              {saving ? `⏳ ${t("saving")}` : `🚀 ${t("launch")}`}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
