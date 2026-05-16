// src/components/OnboardingWizard.jsx
// GrowthPILOT — Wizard onboarding 4 étapes
// Étapes : Bienvenue → Niche/Audience → Ton → Première génération

import { useState } from "react";
import { st } from "../pages/tabs/shared.js";
import logo from "../assets/logo.png";

const API = "https://social-ai-app-production.up.railway.app";

const TONES = [
  { key:"inspirational", label:"🔥 Inspirational", desc:"Motivate and energize" },
  { key:"educational",   label:"📚 Educational",   desc:"Teach and inform" },
  { key:"humorous",      label:"😄 Humorous",      desc:"Light and entertaining" },
  { key:"professional",  label:"💼 Professional",  desc:"Formal and authoritative" },
  { key:"storytelling",  label:"📖 Storytelling",  desc:"Narrative and personal" },
  { key:"provocative",   label:"⚡ Provocative",   desc:"Bold and challenging" },
];

const NICHES = [
  "AI & Technology", "SaaS & Startups", "Marketing & Growth",
  "Finance & Investing", "Leadership & Management", "Health & Wellness",
  "Real Estate", "E-commerce", "Creator Economy", "Cybersecurity",
  "Education & Coaching", "Other",
];

export default function OnboardingWizard({ token, onComplete }) {
  const [step,     setStep]     = useState(0); // 0=welcome 1=niche 2=tone 3=generate
  const [niche,    setNiche]    = useState("");
  const [audience, setAudience] = useState("");
  const [tone,     setTone]     = useState("");
  const [topic,    setTopic]    = useState("");
  const [post,     setPost]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const totalSteps = 4;
  const progress   = Math.round((step / (totalSteps - 1)) * 100);

  /* ── Génération guidée ── */
  const generate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/generate/post`, {
        method: "POST", headers,
        body: JSON.stringify({ topic, niche, audience, tone, lang: "en" }),
      });
      const d = await r.json();
      if (d.text) setPost(d.text);
    } catch {}
    setLoading(false);
  };

  /* ── Finaliser : save memory + marquer onboarding done ── */
  const finish = async () => {
    setSaving(true);
    try {
      // 1. Sauvegarder la brand memory
      await fetch(`${API}/auth/save-brand-memory`, {
        method: "POST", headers,
        body: JSON.stringify({ project_name: "default", niche, audience, tone, cta: "", banned_words: "" }),
      });
      // 2. Marquer onboarding done en DB
      await fetch(`${API}/auth/onboarding-done`, {
        method: "POST", headers,
      });
    } catch {}
    setSaving(false);
    onComplete({ niche, audience, tone, post });
  };

  /* ── Styles ── */
  const s = {
    overlay:  { position:"fixed", inset:0, background:"rgba(2,6,23,0.95)", zIndex:999999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
    card:     { background:"#0a0f1e", border:"1px solid rgba(220,38,38,0.2)", borderRadius:20, width:"100%", maxWidth:580, boxShadow:"0 40px 120px rgba(0,0,0,0.7)", overflow:"hidden" },
    header:   { padding:"28px 32px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" },
    body:     { padding:"28px 32px" },
    footer:   { padding:"20px 32px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" },
    progress: { height:3, background:"rgba(255,255,255,0.07)", borderRadius:2, marginTop:16, overflow:"hidden" },
    bar:      { height:"100%", background:"linear-gradient(90deg,#ef4444,#dc2626)", borderRadius:2, transition:"width 0.4s ease" },
    chip:     (active) => ({ padding:"10px 16px", borderRadius:10, border: active ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)", background: active ? "rgba(220,38,38,0.12)" : "rgba(255,255,255,0.03)", color: active ? "#ef4444" : "#94a3b8", fontWeight:700, fontSize:12, cursor:"pointer", textAlign:"left" }),
    toneCard: (active) => ({ padding:"12px 16px", borderRadius:10, border: active ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)", background: active ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.02)", cursor:"pointer" }),
    input:    { ...st.input, marginBottom:0 },
    btn:      { ...st.button, margin:0 },
    btnSec:   { ...st.buttonSecondary, margin:0, padding:"12px 20px", fontSize:13 },
    stepLabel:{ color:"#ef4444", fontSize:10, fontWeight:700, letterSpacing:"2px" },
    title:    { color:"#fff", fontSize:22, fontWeight:900, margin:"8px 0 4px" },
    sub:      { color:"#64748b", fontSize:13, lineHeight:1.6 },
  };

  return (
    <div style={s.overlay}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <img src={logo} alt="logo" style={{ width:32, height:32, objectFit:"contain" }} />
              <span style={{ color:"#ef4444", fontWeight:900, fontSize:16, letterSpacing:"1px" }}>GrowthPILOT</span>
            </div>
            <span style={{ color:"#334155", fontSize:11, fontWeight:700 }}>Step {step + 1} of {totalSteps}</span>
          </div>
          <div style={s.progress}>
            <div style={{ ...s.bar, width:`${progress}%` }} />
          </div>
        </div>

        {/* Body */}
        <div style={s.body}>

          {/* ── Step 0 : Bienvenue ── */}
          {step === 0 && (
            <div style={{ textAlign:"center", padding:"8px 0" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🚀</div>
              <div style={s.stepLabel}>WELCOME</div>
              <div style={s.title}>Welcome to GrowthPILOT</div>
              <div style={{ ...s.sub, maxWidth:400, margin:"8px auto 24px" }}>
                Let's set up your workspace in 2 minutes. We'll configure your brand voice so the AI writes content that sounds exactly like you.
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, textAlign:"left", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 20px" }}>
                {[
                  ["🎯", "Define your niche & audience"],
                  ["🎨", "Choose your content tone"],
                  ["✍️", "Generate your first AI post"],
                ].map(([icon, label]) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:12, color:"#94a3b8", fontSize:13 }}>
                    <span style={{ fontSize:18 }}>{icon}</span> {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1 : Niche + Audience ── */}
          {step === 1 && (
            <div>
              <div style={s.stepLabel}>STEP 1 — YOUR NICHE</div>
              <div style={s.title}>Who are you writing for?</div>
              <div style={{ ...s.sub, marginBottom:20 }}>This helps the AI tailor your content to the right audience.</div>

              <div style={{ marginBottom:20 }}>
                <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:10 }}>YOUR NICHE</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {NICHES.map(n => (
                    <button key={n} style={s.chip(niche === n)} onClick={() => setNiche(n)}>{n}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:8 }}>YOUR TARGET AUDIENCE</div>
                <input
                  style={s.input}
                  placeholder="e.g. Early-stage founders, marketing managers, B2B SaaS teams..."
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── Step 2 : Ton ── */}
          {step === 2 && (
            <div>
              <div style={s.stepLabel}>STEP 2 — YOUR VOICE</div>
              <div style={s.title}>What's your content tone?</div>
              <div style={{ ...s.sub, marginBottom:20 }}>Pick the style that feels most natural to you.</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {TONES.map(t => (
                  <div key={t.key} style={s.toneCard(tone === t.key)} onClick={() => setTone(t.key)}>
                    <div style={{ color: tone === t.key ? "#ef4444" : "#e2e8f0", fontWeight:700, fontSize:13, marginBottom:3 }}>{t.label}</div>
                    <div style={{ color:"#475569", fontSize:11 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3 : Première génération ── */}
          {step === 3 && (
            <div>
              <div style={s.stepLabel}>STEP 3 — FIRST POST</div>
              <div style={s.title}>Generate your first post</div>
              <div style={{ ...s.sub, marginBottom:16 }}>What do you want to talk about today?</div>

              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <input
                  style={{ ...s.input, flex:1 }}
                  placeholder="e.g. The biggest mistake founders make when hiring..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !loading && generate()}
                />
                <button
                  style={{ ...s.btn, padding:"14px 18px", opacity: loading || !topic ? 0.6 : 1 }}
                  disabled={loading || !topic}
                  onClick={generate}
                >
                  {loading ? "⏳" : "✍️"}
                </button>
              </div>

              {post ? (
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:14, maxHeight:200, overflowY:"auto" }}>
                  <div style={{ color:"#22c55e", fontSize:10, fontWeight:700, letterSpacing:"1.5px", marginBottom:8 }}>✓ YOUR FIRST POST</div>
                  <div style={{ color:"#e2e8f0", fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{post}</div>
                </div>
              ) : (
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:20, textAlign:"center", color:"#334155", fontSize:13 }}>
                  Enter a topic above and click ✍️ to generate
                </div>
              )}

              <div style={{ marginTop:16, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:10, padding:"12px 16px" }}>
                <div style={{ color:"#22c55e", fontSize:11, fontWeight:700, marginBottom:4 }}>✓ Your brand voice is configured</div>
                <div style={{ color:"#475569", fontSize:11 }}>
                  Niche: <span style={{ color:"#94a3b8" }}>{niche || "—"}</span> ·
                  Tone: <span style={{ color:"#94a3b8" }}>{tone || "—"}</span> ·
                  Audience: <span style={{ color:"#94a3b8" }}>{audience?.slice(0, 40) || "—"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          {step > 0
            ? <button style={s.btnSec} onClick={() => setStep(s => s - 1)}>← Back</button>
            : <div />
          }

          {step < totalSteps - 1 ? (
            <button
              style={{ ...s.btn, opacity: (step === 1 && !niche) || (step === 2 && !tone) ? 0.5 : 1 }}
              disabled={(step === 1 && !niche) || (step === 2 && !tone)}
              onClick={() => setStep(s => s + 1)}
            >
              {step === 0 ? "Let's go 🚀" : "Continue →"}
            </button>
          ) : (
            <button
              style={{ ...s.btn, opacity: saving ? 0.6 : 1 }}
              disabled={saving}
              onClick={finish}
            >
              {saving ? "Saving..." : "🎉 Launch GrowthPILOT"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
