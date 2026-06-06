import { t as tr } from "../../translations.js";
import { st, PageHeader, metricColor } from "./shared.js";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  card: { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"18px 20px" },
  cardBlue: { background:"rgba(59,130,246,0.04)", border:"1px solid rgba(59,130,246,0.18)", borderRadius:14, padding:"18px 20px", borderLeft:"3px solid #3b82f6" },
  label: { fontSize:10, fontWeight:700, letterSpacing:"1.5px", color:"#64748b", textTransform:"uppercase", marginBottom:6, display:"block" },
};

function hexRgb(h) {
  const m = {"#ef4444":"239,68,68","#22c55e":"34,197,94","#f59e0b":"245,158,11","#3b82f6":"59,130,246","#a855f7":"168,85,247","#0077b5":"0,119,181","#1da1f2":"29,161,242","#e1306c":"225,48,108","#64748b":"100,116,139"};
  return m[h]||"255,255,255";
}

function scoreColor(v) {
  const n=Number(v); if(!n) return "#475569";
  return n>=80?"#22c55e":n>=60?"#f59e0b":"#ef4444";
}

function KpiCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background:`rgba(${hexRgb(color)},0.06)`, border:`1px solid rgba(${hexRgb(color)},0.18)`, borderRadius:12, padding:16, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:color, borderRadius:"12px 12px 0 0" }} />
      <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
      <div style={{ ...s.label, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:900, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function CircleGauge({ value, color="#ef4444", size=80, label }) {
  const r=size/2-6, circ=2*Math.PI*r, dash=(Math.min(100,value)/100)*circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition:"stroke-dasharray 0.8s ease" }} />
        <text x={size/2} y={size/2+5} textAnchor="middle" fill={color} fontSize={13} fontWeight={900}>{value}</text>
      </svg>
      {label && <div style={{ fontSize:9, color:"#64748b", fontWeight:700, letterSpacing:"1px", textAlign:"center" }}>{label}</div>}
    </div>
  );
}

function ProgressBar({ label, value, color, icon }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {icon && <span style={{ fontSize:12 }}>{icon}</span>}
          <span style={{ color:"#94a3b8", fontSize:13 }}>{label}</span>
        </div>
        <span style={{ color, fontSize:13, fontWeight:700 }}>{value}/100</span>
      </div>
      <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:6, height:8, overflow:"hidden" }}>
        <div style={{ width:`${Math.min(100,value)}%`, height:"100%", borderRadius:6, background:`linear-gradient(90deg,${color}88,${color})`, transition:"width 0.8s ease" }} />
      </div>
    </div>
  );
}

function TopPosts({ history, trendsLang }) {
  const top = (history||[]).filter(p=>p?.score>0||p?.analysis?.score>0)
    .sort((a,b)=>(b?.score||b?.analysis?.score||0)-(a?.score||a?.analysis?.score||0)).slice(0,3);
  if (!top.length) return (
    <div style={{ textAlign:"center", padding:"24px 16px", color:"#334155" }}>
      <div style={{ fontSize:28, marginBottom:8 }}>📝</div>
      <div style={{ fontSize:12 }}>{tr(trendsLang,"ui.insightsGenerateHint")}</div>
    </div>
  );
  const medals=["🥇","🥈","🥉"];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {top.map((post,i) => {
        const score=post?.score||post?.analysis?.score||0;
        const color=scoreColor(score);
        return (
          <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"12px 14px", display:"flex", gap:12 }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{medals[i]}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#e2e8f0", fontSize:12, lineHeight:1.5, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                {post?.content||post?.post||"—"}
              </div>
              <span style={{ background:`rgba(${hexRgb(color)},0.12)`, border:`1px solid rgba(${hexRgb(color)},0.25)`, borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700, color }}>⚡ {score}/100</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Recommandations dynamiques via tr() ──────────────────────────────────────
function getTips(stats, insights, linkedinStatus, threadsStatus, trendsLang) {
  const tips=[], posts=stats?.posts||0, published=stats?.published||0, avgScore=stats?.avgScore||0, streak=stats?.streak||0;
  if (posts===0) {
    return [tr(trendsLang,"ui.tipFirstPost"), tr(trendsLang,"ui.tipBrandMemory"), tr(trendsLang,"ui.tipTemplates")];
  }
  if (insights?.cadence==="Low")    tips.push(tr(trendsLang,"ui.tipPostFrequency"));
  if (insights?.cadence==="Medium") tips.push(tr(trendsLang,"ui.tipMaintainCadence"));
  if (insights?.cadence==="High")   tips.push(tr(trendsLang,"ui.tipVaryFormats"));
  if (avgScore<60)  tips.push(tr(trendsLang,"ui.tipImproveHook"));
  if (avgScore>=60&&avgScore<80) tips.push(tr(trendsLang,"ui.tipAddCta"));
  if (avgScore>=80) tips.push(tr(trendsLang,"ui.tipAutoRepost"));
  if (!linkedinStatus?.connected) tips.push(tr(trendsLang,"ui.tipConnectLinkedin"));
  if (!threadsStatus?.connected)  tips.push(tr(trendsLang,"ui.tipConnectThreads"));
  if (published===0) tips.push(tr(trendsLang,"ui.tipFirstPublish"));
  if (posts>0&&published===0) tips.push(tr(trendsLang,"ui.tipRepurpose"));
  return tips.slice(0,4);
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Insights({ trendsLang, isMobile, insights, stats, linkedinStatus, threadsStatus, history }) {
  const posts=stats?.posts||0, published=stats?.published||0, avgScore=stats?.avgScore||0, streak=stats?.streak||0;
  const globalColor=scoreColor(avgScore);
  const cadenceColor=insights?.cadence==="High"?"#22c55e":insights?.cadence==="Medium"?"#f59e0b":"#ef4444";
  const tips=getTips(stats,insights,linkedinStatus,threadsStatus,trendsLang);

  const radarData=[
    { axis:tr(trendsLang,"ui.insightsCadenceLabel")||"Cadence", val:Math.min(100,posts*5) },
    { axis:"Score",     val:avgScore },
    { axis:"Publish",   val:Math.min(100,published*10) },
    { axis:tr(trendsLang,"ui.insightsStreak")||"Streak", val:Math.min(100,streak*10) },
    { axis:"Projects",  val:insights?.bestProject&&insights.bestProject!=="No project"&&insights.bestProject!=="N/A"?80:20 },
    { axis:"Connect",   val:(linkedinStatus?.connected?50:0)+(threadsStatus?.connected?50:0) },
  ];

  const timeline=(history||[]).filter(p=>p?.score>0||p?.analysis?.score>0).slice(-8)
    .map((p,i)=>({ name:`P${i+1}`, score:p?.score||p?.analysis?.score||0 }));

  const platforms=[
    { name:"LinkedIn", score:linkedinStatus?.connected?Math.max(20,avgScore):0, color:"#0077b5", connected:linkedinStatus?.connected },
    { name:"Threads",  score:threadsStatus?.connected?Math.max(10,avgScore-15):0, color:"#a855f7", connected:threadsStatus?.connected },
    { name:"X",        score:0, color:"#1da1f2", connected:false },
    { name:"Instagram",score:0, color:"#e1306c", connected:false },
  ];

  return (
    <>
      <PageHeader tabKey="insights" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:10 }}>
          <KpiCard icon="📝" label={tr(trendsLang,"ui.statPosts")}     value={posts}       color="#ef4444" sub={tr(trendsLang,"ui.statPosts")?.toLowerCase()} />
          <KpiCard icon="📤" label={tr(trendsLang,"ui.statPublished")} value={published}   color="#22c55e" sub={tr(trendsLang,"ui.insightsPublished")||"published"} />
          <KpiCard icon="⚡" label={tr(trendsLang,"ui.statAvgScore")}  value={avgScore||"—"} color={globalColor} sub="/100" />
          <KpiCard icon="🔥" label={tr(trendsLang,"ui.statStreak")}    value={streak}      color="#f59e0b" sub={tr(trendsLang,"ui.insightsStreak")||"streak"} />
        </div>

        {/* Radar + Recommandations */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14 }}>
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom:12 }}>{tr(trendsLang,"ui.insightsCreatorProfile")||"🕸️ CREATOR PROFILE"}</div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill:"#64748b", fontSize:9, fontWeight:700 }} />
                <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                <Radar dataKey="val" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} dot={{ r:3, fill:"#ef4444" }} />
                <Tooltip contentStyle={{ background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, fontSize:11 }} formatter={(v)=>[`${v}/100`]} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", justifyContent:"space-around", marginTop:8 }}>
              {[
                { label:tr(trendsLang,"ui.insightsCadenceLabel")||"CADENCE", value:insights?.cadence||"Low", color:cadenceColor },
                { label:tr(trendsLang,"ui.insightsTopLabel")||"TOP",         value:insights?.topPlatform||"LinkedIn", color:"#3b82f6" },
                { label:tr(trendsLang,"ui.insightsProjectLabel")||"PROJECT", value:(insights?.bestProject||"—").slice(0,10), color:"#a855f7" },
              ].map(({ label,value,color })=>(
                <div key={label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:9, color:"#475569", fontWeight:700, letterSpacing:"1px" }}>{label}</div>
                  <div style={{ color, fontWeight:800, fontSize:12, marginTop:2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.cardBlue}>
            <div style={{ ...s.label, color:"#3b82f6", marginBottom:14 }}>{tr(trendsLang,"ui.aiRecommendation")}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {tips.map((tip,i)=>(
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#3b82f6", flexShrink:0, marginTop:1 }}>
                    {i+1}
                  </div>
                  <span style={{ color:"#94a3b8", fontSize:13, lineHeight:1.6 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plateformes + Timeline */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14 }}>
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom:16 }}>{tr(trendsLang,"ui.platformPerformance")}</div>
            {platforms.map((p,i)=>(
              <ProgressBar key={i} label={p.name} value={p.score} color={p.color} icon={p.connected?"✅":"🔌"} />
            ))}
            <div style={{ marginTop:4, fontSize:10, color:"#334155", borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:10 }}>
              {tr(trendsLang,"ui.insightsConnectHint")}
            </div>
          </div>
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom:12 }}>{tr(trendsLang,"ui.insightsViralEvolution")||"📈 VIRAL SCORE EVOLUTION"}</div>
            {timeline.length>0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize:10 }} />
                  <YAxis domain={[0,100]} stroke="#475569" tick={{ fontSize:10 }} />
                  <Tooltip contentStyle={{ background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, fontSize:11 }} formatter={(v)=>[`${v}/100`,"Score"]} />
                  <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} dot={{ r:4, fill:"#ef4444" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:160, gap:8 }}>
                <div style={{ fontSize:32 }}>📊</div>
                <div style={{ color:"#475569", fontSize:12, textAlign:"center" }}>{tr(trendsLang,"ui.insightsAnalyzeHint")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Top posts + Signaux */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14 }}>
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom:14 }}>{tr(trendsLang,"ui.insightsTopPosts")||"🏆 TOP POSTS"}</div>
            <TopPosts history={history} trendsLang={trendsLang} />
          </div>
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom:16 }}>{tr(trendsLang,"ui.growthSignals")}</div>
            <div style={{ display:"flex", justifyContent:"space-around", marginBottom:20 }}>
              <CircleGauge value={avgScore} color={globalColor} label={tr(trendsLang,"ui.statAvgScore")||"SCORE"} />
              <CircleGauge value={Math.min(100,streak*10)} color="#f59e0b" label={tr(trendsLang,"ui.insightsStreak")||"STREAK"} />
              <CircleGauge value={Math.min(100,published*10)} color="#22c55e" label={tr(trendsLang,"ui.insightsPublished")||"PUBLIÉS"} />
            </div>
            {[
              { signal:tr(trendsLang,"ui.signalEngagement"), value:avgScore>0?`${avgScore>=70?"↑":"→"} ${avgScore}%`:"N/A", color:avgScore>=70?"#22c55e":"#f59e0b" },
              { signal:tr(trendsLang,"ui.signalReach"),      value:published>0?`${published} posts`:"N/A", color:published>0?"#22c55e":"#64748b" },
              { signal:tr(trendsLang,"ui.cadence")||"Cadence", value:insights?.cadence||"Low", color:cadenceColor },
              { signal:tr(trendsLang,"ui.statStreak")||"Streak", value:streak>0?`🔥 ${streak}`:"—", color:streak>7?"#22c55e":"#64748b" },
            ].map((g,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color:"#64748b", fontSize:13 }}>{g.signal}</span>
                <span style={{ color:g.color, fontSize:13, fontWeight:700 }}>{g.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
