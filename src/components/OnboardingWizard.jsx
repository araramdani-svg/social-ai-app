/**
 * GrowthPILOT — Onboarding Wizard
 * File: src/components/OnboardingWizard.jsx
 *
 * Affiché au premier login, guide l'user en 4 étapes :
 * 1. Langue + objectif
 * 2. Niche + audience
 * 3. Ton + CTA par défaut
 * 4. Connexion LinkedIn (optionnel)
 *
 * Props : token, trendsLang, onComplete(brandMemory)
 */

import { useState } from "react";
import logo from "../assets/logo.png";

const API = "https://social-ai-app-production.up.railway.app";

const NICHES = [
  "SaaS / Tech", "Marketing / Growth", "Entrepreneurship", "Finance / Investing",
  "Leadership / Management", "Sales / Business Dev", "Personal Branding",
  "Coaching / Consulting", "HR / Recruitment", "Legal / Compliance",
  "Healthcare / MedTech", "E-commerce / Retail", "Real Estate", "Education / EdTech", "Other",
];

const TONES = [
  { id:"expert",        label:"Expert",         desc:"Authoritative, data-driven, credible" },
  { id:"conversational",label:"Conversational",  desc:"Friendly, approachable, relatable" },
  { id:"provocateur",   label:"Provocateur",     desc:"Bold, contrarian, thought-provoking" },
  { id:"storyteller",   label:"Storyteller",     desc:"Narrative, emotional, personal" },
  { id:"educator",      label:"Educator",        desc:"Clear, structured, step-by-step" },
];

const GOALS = [
  { id:"brand",    label:"Build personal brand",   icon:"🏆" },
  { id:"leads",    label:"Generate leads / clients", icon:"🎯" },
  { id:"network",  label:"Grow my network",          icon:"🌐" },
  { id:"authority",label:"Establish authority",       icon:"💡" },
  { id:"hire",     label:"Attract talent",            icon:"👥" },
];

const s = {
  overlay: { position:"fixed", inset:0, background:"rgba(2,6,23,0.96)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:99999, padding:20 },
  card:    { background:"#111827", border:"1px solid rgba(220,38,38,0.2)", borderRadius:20, padding:36, maxWidth:540, width:"100%", boxShadow:"0 30px 100px rgba(0,0,0,0.6)", boxSizing:"border-box" },
  logo:    { width:40, height:40, objectFit:"contain", filter:"drop-shadow(0 0 10px rgba(220,38,38,.4))" },
  title:   { fontSize:22, fontWeight:900, color:"#fff", margin:"0 0 6px" },
  sub:     { fontSize:13, color:"#64748b", margin:"0 0 28px" },
  label:   { fontSize:11, fontWeight:700, letterSpacing:"1.5px", color:"#64748b", marginBottom:8, display:"block" },
  input:   { width:"100%", background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderLeft:"3px solid rgba(220,38,38,0.5)", borderRadius:10, padding:"12px 16px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  select:  { width:"100%", background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:10, padding:"12px 16px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  btn:     { background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:800, letterSpacing:"1px", padding:"14px 28px", cursor:"pointer", width:"100%", marginTop:8 },
  btnGhost:{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#64748b", fontSize:13, fontWeight:600, padding:"12px 20px", cursor:"pointer", width:"100%", marginTop:6 },
  chip:    (active) => ({ padding:"8px 14px", borderRadius:8, border: active ? "1px solid rgba(220,38,38,0.5)" : "1px solid rgba(255,255,255,0.07)", background: active ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.03)", color: active ? "#ef4444" : "#64748b", fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }),
  toneCard:(active) => ({ padding:"12px 14px", borderRadius:10, border: active ? "1px solid rgba(220,38,38,0.4)" : "1px solid rgba(255,255,255,0.07)", background: active ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.02)", cursor:"pointer", transition:"all 0.15s", marginBottom:8 }),
  progress:(step, total) => ({ height:3, background:`linear-gradient(90deg, #ef4444 ${(step/total)*100}%, rgba(255,255,255,0.06) ${(step/total)*100}%)`, borderRadius:2, marginBottom:28 }),
  stepNum: { fontSize:10, fontWeight:700, color:"#ef4444", letterSpacing:"2px", marginBottom:8 },
};

export default function OnboardingWizard({ token, onComplete }) {
  const [step,     setStep]     = useState(1);
  const [goal,     setGoal]     = useState("");
  const [niche,    setNiche]    = useState("");
  const [audience, setAudience] = useState("");
  const [tone,     setTone]     = useState("expert");
  const [cta,      setCta]      = useState("");
  const [project,  setProject]  = useState("My Brand");
  const [saving,   setSaving]   = useState(false);
  const TOTAL = 4;

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const finish = async (skipLinkedin = false) => {
    setSaving(true);
    try {
      // Créer le projet par défaut
      await fetch(`${API}/auth/create-project`, {
        method: "POST", headers,
        body: JSON.stringify({ name: project, workspace: "PERSONAL", campaign: "" }),
      });
      // Sauvegarder la brand memory
      await fetch(`${API}/auth/save-brand-memory`, {
        method: "POST", headers,
        body: JSON.stringify({ project_name: project, niche, audience, tone, cta, banned_words: "" }),
      });
      // Marquer l'onboarding comme terminé
      localStorage.setItem("gp_onboarded", "1");
      onComplete({ niche, audience, tone, cta, project, goal });
    } catch {
      onComplete({ niche, audience, tone, cta, project, goal });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.overlay}>
      <div style={s.card}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <img src={logo} alt="logo" style={s.logo} />
          <div>
            <div style={{ color:"#ef4444", fontSize:11, fontWeight:700, letterSpacing:"2px" }}>GROWTHPILOT</div>
            <div style={{ color:"#fff", fontSize:16, fontWeight:800 }}>Welcome! Let's set up your account</div>
          </div>
        </div>

        {/* Progress */}
        <div style={s.progress(step, TOTAL)} />
        <div style={s.stepNum}>STEP {step} OF {TOTAL}</div>

        {/* ── Step 1 : Objectif + Projet ── */}
        {step === 1 && (
          <div>
            <div style={s.title}>What's your main goal?</div>
            <div style={s.sub}>This helps us tailor your content strategy.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {GOALS.map(g => (
                <button key={g.id} style={s.toneCard(goal === g.id)} onClick={() => setGoal(g.id)}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:20 }}>{g.icon}</span>
                    <span style={{ color: goal === g.id ? "#ef4444" : "#e2e8f0", fontWeight:700, fontSize:13 }}>{g.label}</span>
                    {goal === g.id && <span style={{ marginLeft:"auto", color:"#ef4444" }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
            <span style={s.label}>YOUR BRAND / PROJECT NAME</span>
            <input style={{ ...s.input, marginBottom:20 }} value={project} onChange={e => setProject(e.target.value)} placeholder="e.g. My Personal Brand" />
            <button style={{ ...s.btn, opacity: !goal ? 0.4 : 1 }} disabled={!goal} onClick={() => setStep(2)}>
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2 : Niche + Audience ── */}
        {step === 2 && (
          <div>
            <div style={s.title}>Your niche & audience</div>
            <div style={s.sub}>The AI will generate content specifically for your field.</div>
            <span style={s.label}>YOUR NICHE</span>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
              {NICHES.map(n => (
                <button key={n} style={s.chip(niche === n)} onClick={() => setNiche(n)}>{n}</button>
              ))}
            </div>
            {niche === "Other" && (
              <input style={{ ...s.input, marginBottom:20 }} placeholder="Describe your niche..." value={niche === "Other" ? "" : niche} onChange={e => setNiche(e.target.value)} />
            )}
            <span style={s.label}>TARGET AUDIENCE</span>
            <input
              style={{ ...s.input, marginBottom:20 }}
              placeholder="e.g. Startup founders, Marketing directors, B2B sales teams..."
              value={audience}
              onChange={e => setAudience(e.target.value)}
            />
            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...s.btnGhost, width:"auto", marginTop:0 }} onClick={() => setStep(1)}>← Back</button>
              <button style={{ ...s.btn, opacity: !niche || !audience ? 0.4 : 1 }} disabled={!niche || !audience} onClick={() => setStep(3)}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 : Ton + CTA ── */}
        {step === 3 && (
          <div>
            <div style={s.title}>Your writing style</div>
            <div style={s.sub}>The AI will adopt this voice in every post it generates.</div>
            <span style={s.label}>TONE OF VOICE</span>
            <div style={{ marginBottom:20 }}>
              {TONES.map(t => (
                <button key={t.id} style={s.toneCard(tone === t.id)} onClick={() => setTone(t.id)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ color: tone === t.id ? "#ef4444" : "#e2e8f0", fontWeight:700, fontSize:13, marginBottom:2 }}>{t.label}</div>
                      <div style={{ color:"#475569", fontSize:11 }}>{t.desc}</div>
                    </div>
                    {tone === t.id && <span style={{ color:"#ef4444", fontSize:16 }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
            <span style={s.label}>DEFAULT CALL-TO-ACTION</span>
            <input
              style={{ ...s.input, marginBottom:20 }}
              placeholder="e.g. Follow me for daily tips · DM me for a free audit · Book a call"
              value={cta}
              onChange={e => setCta(e.target.value)}
            />
            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...s.btnGhost, width:"auto", marginTop:0 }} onClick={() => setStep(2)}>← Back</button>
              <button style={s.btn} onClick={() => setStep(4)}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 4 : Résumé + Finish ── */}
        {step === 4 && (
          <div>
            <div style={s.title}>You're all set! 🚀</div>
            <div style={s.sub}>Here's your brand profile. You can always edit it in Memory.</div>

            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
              {[
                ["🎯 Goal",     GOALS.find(g => g.id === goal)?.label],
                ["🏷️ Niche",    niche],
                ["👥 Audience", audience],
                ["🎙️ Tone",     TONES.find(t => t.id === tone)?.label],
                ["📣 CTA",      cta || "Not set"],
                ["📁 Project",  project],
              ].map(([label, value]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:8, border:"1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color:"#64748b", fontSize:12, fontWeight:700 }}>{label}</span>
                  <span style={{ color:"#e2e8f0", fontSize:12, textAlign:"right", maxWidth:"60%" }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...s.btnGhost, width:"auto", marginTop:0 }} onClick={() => setStep(3)}>← Back</button>
              <button style={{ ...s.btn, opacity: saving ? 0.7 : 1 }} disabled={saving} onClick={() => finish()}>
                {saving ? "Setting up..." : "🚀 Launch GrowthPILOT"}
              </button>
            </div>
            <button style={s.btnGhost} onClick={() => finish(true)}>Skip for now</button>
          </div>
        )}
      </div>
    </div>
  );
}
