import { useState, useEffect, useCallback, useRef } from "react";
import { useAutoSave, useKeyboardShortcuts, CharCounter, SkeletonCard, EmptyState } from "./tabs/shared.js";
import { t as tr } from "../translations.js";
import logo from "../assets/logo.png";
import { motion, AnimatePresence } from "framer-motion";

import Home         from "./tabs/Home.jsx";
import Dashboard    from "./tabs/Dashboard.jsx";
import Create       from "./tabs/Create.jsx";
import Memory       from "./tabs/Memory.jsx";
import Analyze      from "./tabs/Analyze.jsx";
import Insights     from "./tabs/Insights.jsx";
import Scheduler    from "./tabs/Scheduler.jsx";
import Autopost     from "./tabs/Autopost.jsx";
import Publish      from "./tabs/Publish.jsx";
import Planner      from "./tabs/Planner.jsx";
import History      from "./tabs/History.jsx";
import Team         from "./tabs/Team.jsx";
import Trends       from "./tabs/Trends.jsx";
import Integrations from "./tabs/Integrations.jsx";
import Profile      from "./tabs/Profile.jsx";
import Carousel     from "./tabs/Carousel.jsx";
import GhostWrite   from "./tabs/GhostWrite.jsx";
import AutoRepost   from "./tabs/AutoRepost.jsx";
import Templates    from "./tabs/Templates.jsx";
import Calendar     from "./tabs/Calendar.jsx";
import { st, useWindowWidth } from "./tabs/shared.js";
import OnboardingWizard from "../components/OnboardingWizard.jsx";

const API = "https://social-ai-app-production.up.railway.app";

export default function Generator({ token: tokenProp, trendsLang: langProp, setTrendsLang: setLangProp, setPage }) {

  /* ── Routing ── */
  const [tab, setTabState] = useState(() => sessionStorage.getItem("gp_tab") || "home");
  const setTab    = (t) => { setTabState(t); sessionStorage.setItem("gp_tab", t); };
  const navigate  = (t) => { setTab(t); setSidebarOpen(false); };

  /* ── Breakpoints ── */
  const width    = useWindowWidth();
  const isMobile = width < 768;

  /* ── Auth / Lang ── */
  const token                        = tokenProp || localStorage.getItem("token");

  // Raccourcis clavier
  useKeyboardShortcuts([
    { meta:true, key:"Enter", fn: () => { if (!loading) generate(); } },
    { meta:true, key:"s",     fn: () => { if (post) savePost(); } },
  ]);
  const [trendsLangLocal, setTLLocal] = useState("en");
  const trendsLang                   = langProp    || trendsLangLocal;
  const setTrendsLang                = setLangProp || setTLLocal;

  /* ── UI ── */
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false); // Onboarding triggered after login only
  const [toast,          setToast]          = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [aiStep,         setAiStep]         = useState(0);

  /* ── Content ── */
  const [post,            setPost]            = useState("");
  const [autoSaveLabel, setAutoSaveLabel] = useState("");

  // Auto-save
  const { restore: restorePost } = useAutoSave(post, "gp_autosave_post", 1500);

  useEffect(() => {
    const saved = restorePost();
    if (saved && saved.length > 10 && !post) {
      setPost(saved);
      setAutoSaveLabel("✓ Draft restored");
      setTimeout(() => setAutoSaveLabel(""), 3000);
    }
  }, []);

  useEffect(() => {
    if (!post) return;
    setAutoSaveLabel("Saving...");
    const t = setTimeout(() => setAutoSaveLabel("✓ Saved"), 1600);
    return () => clearTimeout(t);
  }, [post]);
  const [topic,           setTopic]           = useState("");
  const [projectTitle,    setProjectTitle]    = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [searchProject,   setSearchProject]   = useState("");
  const [renameValue,     setRenameValue]     = useState("");
  const [saveStatus,      setSaveStatus]      = useState("");
  const [currentPostDbId, setCurrentPostDbId] = useState(null);
  const [publishStatus,   setPublishStatus]   = useState("");
  const [template,        setTemplate]        = useState("Authority");
  const [voice,           setVoice]           = useState("Founder");
  const [campaign,        setCampaign]        = useState("Authority Build");
  const [workspace,       setWorkspace]       = useState("PERSONAL");
  const [drafts,          setDrafts]          = useState([]);
  const [projectPosts,    setProjectPosts]    = useState([]);
  const [compareDraft,    setCompareDraft]    = useState(null);

  /* ── Data ── */
  const [history,        setHistory]        = useState([]);
  const [projects,       setProjects]       = useState([]);
  const [planner,        setPlanner]        = useState([]);
  const [publishLog,     setPublishLog]     = useState([]);
  const [attachedMedia,  setAttachedMedia]  = useState(null);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [autoPosts,      setAutoPosts]      = useState([]);
  const [autoPlatform,   setAutoPlatform]   = useState("LINKEDIN");
  const [scheduleDate,   setScheduleDate]   = useState("");
  const [scheduleTime,   setScheduleTime]   = useState("");
  const [analysis,       setAnalysis]       = useState(null);
  const [memory,         setMemory]         = useState({ niche:"", audience:"", tone:"", cta:"", banned_words:"" });
  const [liveFeed,       setLiveFeed]       = useState([]);

  /* ── Stats ── */
  const [stats,         setStats]         = useState({ posts:0, projects:0, published:0, avgScore:0, streak:0 });
  const [animatedStats, setAnimatedStats] = useState({ posts:0, projects:0, published:0, avgScore:0, streak:0 });
  const [insights,      setInsights]      = useState({ bestProject:"N/A", topPlatform:"LinkedIn", recommendation:"Generate more authority content", cadence:"Low" });

  /* ── Integrations ── */
  const [linkedinStatus,  setLinkedinStatus]  = useState({ connected:false, name:null });
  const [threadsStatus,   setThreadsStatus]   = useState({ connected:false, username:null });
  const [twitterStatus,   setTwitterStatus]   = useState({ connected:false, username:null });
  const [instagramStatus, setInstagramStatus] = useState({ connected:false, username:null });
  const [linkedinPosting, setLinkedinPosting] = useState(false);
  const [threadsPosting,  setThreadsPosting]  = useState(false);
  const [twitterPosting,  setTwitterPosting]  = useState(false);
  const [instagramPosting,setInstagramPosting]= useState(false);
  const [facebookStatus,  setFacebookStatus]  = useState({ connected:false, userName:null, pageName:null });
  const [facebookPosting, setFacebookPosting] = useState(false);
  const [tiktokStatus,    setTiktokStatus]    = useState({ connected:false, username:null });
  const [tiktokPosting,   setTiktokPosting]   = useState(false);
  const [userPlan,        setUserPlan]        = useState({ plan:"Free", interval:null });
  const [firstName,       setFirstName]       = useState("");
  const [lastName,        setLastName]        = useState("");
  const [displayName,     setDisplayName]     = useState("");

  /* ── Trends ── */
  const [trends,        setTrends]        = useState([]);
  const [trendsNiche,   setTrendsNiche]   = useState("ai");
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsSources, setTrendsSources] = useState({});

  /* ── Profile ── */
  const [profileSection,  setProfileSection]  = useState("account");
  const [profileMsg,      setProfileMsg]      = useState({ type:"", text:"" });
  const [profileLoading,  setProfileLoading]  = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail,        setNewEmail]        = useState("");

  /* ── Helpers ── */
  const showToast      = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const showProfileMsg = (type, text) => { setProfileMsg({ type, text }); setTimeout(() => setProfileMsg({ type:"", text:"" }), 3000); };

  const api = async (route, body={}, method="POST") => {
    const res  = await fetch(`${API}/${route}`, { method, headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: method!=="GET" ? JSON.stringify(body) : undefined });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
  };

  // ── Helper logging utilisateur ────────────────────────────────────────────
  const logUserAction = (action, details = {}) => {
    if (!token || token === "guest") return;
    fetch(`${API}/auth/user-log`, {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ action, details }),
    }).catch(() => {});
  };

  /* ── Computed ── */
  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchProject.toLowerCase()));

  const postMetrics = {
    words:    post ? post.trim().split(/\s+/).length : 0,
    chars:    post.length,
    readTime: Math.ceil((post ? post.trim().split(/\s+/).length : 0) / 200),
  };

  // Passer CharCounter et autoSaveLabel à Create via props supplémentaires
  const charCounterProps = { autoSaveLabel, CharCounter };

  const growthData = (() => {
    try {
      const scored = (history||[]).filter(p=>(p?.score>0)||(p?.analysis?.score>0)).slice(-7);
      if (!scored.length) return [{ day:"D-6",score:0 },{ day:"D-5",score:0 },{ day:"D-4",score:0 },{ day:"D-3",score:0 },{ day:"D-2",score:0 },{ day:"D-1",score:0 },{ day:"Today",score:analysis?.score||0 }];
      return scored.map((p,i)=>({ day: i===scored.length-1?"Today":`D-${scored.length-1-i}`, score:p?.score||p?.analysis?.score||0, title:p?.title?p.title.slice(0,20):`Post ${i+1}` }));
    } catch { return [{ day:"Today",score:0 }]; }
  })();

  const platformData  = [{ name:"LinkedIn",value:linkedinStatus.connected?(stats.avgScore||60):0 },{ name:"X",value:0 },{ name:"Threads",value:threadsStatus.connected?Math.max(0,(stats.avgScore||50)-15):0 }];
  const timelineData  = scheduledPosts.slice(0,4).map(p=>({ time:p.time||"—",platform:p.platform||"LinkedIn",status:"Scheduled" }));
  const aiSteps = [
    tr(trendsLang,"ui.aiStep1"),
    tr(trendsLang,"ui.aiStep2"),
    tr(trendsLang,"ui.aiStep3"),
    tr(trendsLang,"ui.aiStep4"),
    tr(trendsLang,"ui.aiStep5"),
    tr(trendsLang,"ui.aiStep6"),
  ];
  const activityPool  = ["AI optimized LinkedIn post","Audience signals updated","Best publish slot detected","Content generated successfully","Campaign strategy recalculated","Content resonance boosted","Hook structure refined","AI analysis complete","Growth signals updated","Brand memory applied","Viral score calculated"];
  const pageTransition= { initial:{ opacity:0,x:isMobile?0:80,y:isMobile?20:0 }, animate:{ opacity:1,x:0,y:0 }, exit:{ opacity:0,x:isMobile?0:-80,y:isMobile?-20:0 }, transition:{ duration:0.35 } };

  /* ── Effects ── */
  useEffect(() => {
    if (token && token !== "guest") {
      loadProjects(); loadHistory();
      // Vérifier onboarding_done en DB (multi-device)
      fetch(`${API}/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.onboarding_done === false) setShowOnboarding(true); if (d.first_name) setFirstName(d.first_name); if (d.last_name) setLastName(d.last_name); if (d.display_name) setDisplayName(d.display_name); })
        .catch(() => {});
      fetch(`${API}/stripe/status`,   { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setUserPlan).catch(()=>{});
      fetch(`${API}/linkedin/status`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setLinkedinStatus).catch(()=>{});
      fetch(`${API}/threads/status`,  { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setThreadsStatus).catch(()=>{});
      fetch(`${API}/twitter/status`,    { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setTwitterStatus).catch(()=>{});
      fetch(`${API}/instagram/status`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setInstagramStatus).catch(()=>{});
      fetch(`${API}/facebook/status`,  { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setFacebookStatus).catch(()=>{});
      fetch(`${API}/tiktok/status`,    { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setTiktokStatus).catch(()=>{});
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset")) { const resetToken = params.get("reset"); localStorage.removeItem("token"); window.location.href = `/?reset=${resetToken}`; return; }
    if (params.get("linkedin")==="connected") { window.history.replaceState({},""," /"); fetch(`${API}/linkedin/status`,{ headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setLinkedinStatus).catch(()=>{}); }
    if (params.get("twitter")   ==="connected") { window.history.replaceState({},"", "/"); fetch(`${API}/twitter/status`,    { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setTwitterStatus).catch(()=>{}); }
    if (params.get("instagram") ==="connected") { window.history.replaceState({},"", "/"); fetch(`${API}/instagram/status`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setInstagramStatus).catch(()=>{}); }
    if (params.get("facebook")  ==="connected") { window.history.replaceState({},"", "/"); fetch(`${API}/facebook/status`,  { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setFacebookStatus).catch(()=>{}); }
    if (params.get("tiktok")    ==="connected") { window.history.replaceState({},"", "/"); fetch(`${API}/tiktok/status`,    { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setTiktokStatus).catch(()=>{}); }
    if (params.get("threads") ==="connected") { window.history.replaceState({},""," /"); fetch(`${API}/threads/status`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setThreadsStatus).catch(()=>{}); }
    const handleOAuth = (e) => {
      if (e.detail==="linkedin") fetch(`${API}/linkedin/status`,{ headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setLinkedinStatus).catch(()=>{});
      if (e.detail==="threads")  fetch(`${API}/threads/status`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setThreadsStatus).catch(()=>{});
      if (e.detail==="twitter")  fetch(`${API}/twitter/status`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setTwitterStatus).catch(()=>{});
    };
    window.addEventListener("oauthSuccess", handleOAuth);
    return () => window.removeEventListener("oauthSuccess", handleOAuth);
  }, [token]);

  useEffect(() => { const h=()=>setTab("profile"); window.addEventListener("openProfile",h); return ()=>window.removeEventListener("openProfile",h); }, []);
  useEffect(() => { const h=(e)=>setTab(e.detail||"home"); window.addEventListener("navigateTab",h); return ()=>window.removeEventListener("navigateTab",h); }, []);
  useEffect(() => { document.body.style.overflow="hidden"; return ()=>{ document.body.style.overflow=""; }; }, []);

  useEffect(() => {
    if (tab!=="dashboard") return;
    let cur=0; const steps=30;
    const timer = setInterval(()=>{ cur++; setAnimatedStats({ posts:Math.floor((stats?.posts||0)*cur/steps), projects:Math.floor((projects?.length||0)*cur/steps), published:Math.floor((stats?.published||0)*cur/steps), avgScore:Math.floor((stats?.avgScore||0)*cur/steps), streak:Math.floor((stats?.streak||0)*cur/steps) }); if(cur>=steps) clearInterval(timer); }, 35);
    return () => clearInterval(timer);
  }, [stats, projects, tab]);

  useEffect(() => {
    const interval = setInterval(()=>{ const e=activityPool[Math.floor(Math.random()*activityPool.length)]; setLiveFeed(prev=>[{ id:Date.now(),text:e,time:"just now" },...prev.slice(0,5)]); }, 3500);
    return () => clearInterval(interval);
  }, []);

  const isFirstRender = useRef(true); useEffect(() => { if (isFirstRender.current) { isFirstRender.current = false; return; } const key=selectedProject||"default"; if(key !== "default") { setPost(localStorage.getItem(`gp_post_${key}`)||""); setTopic(localStorage.getItem(`gp_topic_${key}`)||""); setProjectTitle(localStorage.getItem(`gp_title_${key}`)||""); } else { setPost(""); } }, [selectedProject]);
  useEffect(() => { const key=selectedProject||projectTitle||"default"; localStorage.setItem(`gp_post_${key}`,post); localStorage.setItem(`gp_topic_${key}`,topic); localStorage.setItem(`gp_title_${key}`,projectTitle); }, [post,topic,projectTitle,selectedProject]);

  useEffect(() => {
    const h=history||[], p=projects||[];
    const scored=h.filter(p=>(p?.score>0)||(p?.analysis?.score>0));
    const avgScore=scored.length>0?Math.round(scored.reduce((acc,p)=>acc+(p?.score||p?.analysis?.score||0),0)/scored.length):(analysis?.score||0);
    let streak=0;
    try { const days=new Set(h.map(p=>p?.createdAt?new Date(p.createdAt).toDateString():null).filter(Boolean)); const today=new Date(); for(let i=0;i<365;i++){ const d=new Date(today); d.setDate(today.getDate()-i); if(days.has(d.toDateString())) streak++; else if(i>0) break; } } catch { streak=h.length; }
    setStats({ posts:h.length,projects:p.length,published:publishLog.length,avgScore,streak:streak||h.length });
    setInsights({ bestProject:p[0]?.name||"No project",topPlatform:"LinkedIn",recommendation:h.length<5?"Increase posting frequency":"Maintain publishing cadence",cadence:h.length>20?"High":h.length>8?"Medium":"Low" });
  }, [history,projects,publishLog,analysis]);

  useEffect(() => { if(tab==="trends"&&trends.length>0) fetchTrends(trendsNiche,trendsLang); }, [trendsLang]);

  /* ── API functions ── */
  const loadProjects   = async () => { const d=await api("auth/projects",{},"GET"); setProjects(Array.isArray(d)?d:[]); };
  const loadHistory    = async () => { try { const d=await api("auth/posts",{},"GET"); setHistory(Array.isArray(d)?d:[]); } catch { setHistory([]); } };
  const selectProject  = async (n) => { setSelectedProject(n); setCompareDraft(null); const d=await api(`auth/project/${n}`,{},"GET"); if(d){ setMemory(d.memory||{ niche:"",audience:"",tone:"",cta:"",banned_words:"" }); setDrafts(d.drafts||[]); setHistory(d.posts||[]); setProjectTitle(n); } try{ const posts=await fetch(`${API}/auth/posts/by-project/${encodeURIComponent(n)}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()); if(Array.isArray(posts)) setProjectPosts(posts); } catch{} };
  const createProject  = async () => { if(!projectTitle) return; await api("auth/create-project",{ name:projectTitle,workspace,campaign }); await loadProjects(); await selectProject(projectTitle); showToast(tr(trendsLang,"messages.projectSaved")); logUserAction("create_project", { name: projectTitle }); };
  const deleteProject  = async (n) => { await api(`auth/delete-project/${n}`,{},"DELETE"); showToast(tr(trendsLang,"messages.projectDeleted")); await loadProjects(); if(selectedProject===n){ setSelectedProject(""); setProjectTitle(""); setPost(""); setDrafts([]); setHistory([]); } logUserAction("delete_project", { name: n }); };
  const renameProject  = async () => { if(!selectedProject||!renameValue) return; await api("auth/rename-project",{ oldName:selectedProject,newName:renameValue }); setSelectedProject(renameValue); setProjectTitle(renameValue); setRenameValue(""); await loadProjects(); logUserAction("rename_project", { from: selectedProject, to: renameValue }); };
  const duplicateProject=async () => { if(!selectedProject) return; await api("auth/create-project",{ name:`${selectedProject} Copy`,workspace,campaign }); await loadProjects(); };
  const saveBrandMemory= async () => { showToast(tr(trendsLang,"messages.memoryUpdated")); await api("auth/save-brand-memory",{ project_name:selectedProject||projectTitle,...memory }); };
  const savePost = async (mediaData = null) => { if(!post){ showToast("⚠️ No content to save — generate a post first"); return; } const title=projectTitle||selectedProject||topic||"Untitled"; try{ const d=await api("auth/save-post",{ title,content:post,project_name:selectedProject||null, ...(mediaData || {}) }); if(d?.id) setCurrentPostDbId(d.id); setSaveStatus("✅ " + tr(trendsLang,"messages.projectSaved")); showToast(tr(trendsLang,"messages.projectSaved")); setTimeout(()=>setSaveStatus(""),2000); logUserAction("save_post", { title, project: selectedProject, has_media: !!mediaData }); if(selectedProject) { const posts=await fetch(`${API}/auth/posts/by-project/${encodeURIComponent(selectedProject)}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()); if(Array.isArray(posts)) setProjectPosts(posts); } } catch{ showToast("❌ Save failed — please try again"); } };
  const generate       = async () => { if(!topic) return; if(!token||token==="guest"){ showToast(tr(trendsLang, "messages.pleaseLogin")); return; } try{ setLoading(true); setAiStep(0); const ti=setInterval(()=>setAiStep(p=>p<aiSteps.length-1?p+1:p),1400); const dp=api("generate",{ topic,template,voice,campaign,project:selectedProject||null,lang:trendsLang }); await new Promise(r=>setTimeout(r,2800)); const d=await dp; clearInterval(ti); if(d?.text){ setPost(d.text); showToast(tr(trendsLang,"messages.contentGenerated")); logUserAction("generate_post", { topic, lang: trendsLang, project: selectedProject }); } else if(d?.error==="quota_exceeded"){ showToast(`⚠️ ${d.message}`); setTimeout(()=>setPage&&setPage("pricing"),2000); } else if(d?.message) showToast(d.message); } catch{ showToast(tr(trendsLang,"messages.generationFailed")); } finally{ setLoading(false); } };
  const rewrite        = async (mode) => { if(!post) return; setLoading(true); try{ const d=await api("generate/rewrite",{ text:post,mode,lang:trendsLang }); if(d?.text){ setPost(d.text); logUserAction("rewrite_post", { mode, lang: trendsLang }); } else if(d?.error==="quota_exceeded"){ showToast(`⚠️ ${d.message}`); setTimeout(()=>setPage&&setPage("pricing"),2000); } } catch{ showToast(tr(trendsLang,"messages.rewriteFailed")); } finally{ setLoading(false); } };
  const analyze        = async () => { if(!post) return; try{ setLoading(true); const d=await api("analyze",{ text:post, lang:trendsLang }); if(d?.error==="quota_exceeded"){ showToast(`⚠️ ${d.message}`); setTimeout(()=>setPage&&setPage("pricing"),2000); return; } setAnalysis(d); setTab("analyze"); showToast(tr(trendsLang,"messages.analysisComplete")); logUserAction("analyze_post", { lang: trendsLang }); } catch{ showToast(tr(trendsLang,"messages.analysisFailed")); } finally{ setLoading(false); setAiStep(0); } };
  const exportPost     = () => { if(!post) return; const b=new Blob([post],{ type:"text/plain" }); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download=`${projectTitle||"post"}.txt`; a.click(); URL.revokeObjectURL(u); };
  const copyPost       = async () => { if(!post) return; await navigator.clipboard.writeText(post); showToast(tr(trendsLang,"messages.copied")); logUserAction("copy_post"); };
  const publish = async (dest) => {
    if (!post) return showToast("⚠️ No content to publish — generate a post first");
    if (dest === "LINKEDIN") {
      if (!linkedinStatus?.connected) return showToast("⚠️ LinkedIn not connected — go to Integrations");
      const ok = await postToLinkedin();
      if (ok) setPublishLog(p => [{ dest, date: new Date().toLocaleString() }, ...p]);
    } else if (dest === "TWITTER") {
      if (!twitterStatus?.connected) return showToast("⚠️ X/Twitter not connected — go to Integrations");
      const ok = await postToTwitter();
      if (ok) setPublishLog(p => [{ dest, date: new Date().toLocaleString() }, ...p]);
    } else if (dest === "FACEBOOK") {
      if (!facebookStatus?.connected) return showToast("⚠️ Facebook not connected — go to Integrations");
      const ok = await postToFacebook();
      if (ok) setPublishLog(p => [{ dest, date: new Date().toLocaleString() }, ...p]);
    }
  };
  const generatePlanner= () => { setPlanner(Array.from({ length:30 },(_,i)=>`Day ${i+1} — ${campaign} / ${topic}`)); setTab("planner"); };
  const schedulePost   = () => { if(!scheduleDate||!scheduleTime||!post) return; setScheduledPosts(p=>[{ content:post.slice(0,80)+"...",date:scheduleDate,time:scheduleTime },...p]); };
  const autoPublish    = () => { if(!post) return; setAutoPosts(p=>[{ platform:autoPlatform,content:post.slice(0,80)+"...",status:"Scheduled",date:new Date().toLocaleString() },...p]); setTimeout(()=>setAutoPosts(p=>p.map((x,i)=>i===0?{ ...x,status:Math.random()>0.2?"Sent":"Failed" }:x)),4000); };
  const fetchTrends    = async (niche,lang) => { const sl=lang||trendsLang; setTrendsLoading(true); try{ const r=await fetch(`${API}/scraping/trends?niche=${niche}&lang=${sl}`,{ headers:{ Authorization:`Bearer ${token}` } }); const d=await r.json(); setTrends(d.trends||[]); setTrendsSources(d.sources||{}); } catch{ showToast(tr(trendsLang,"messages.fetchTrendsFailed")); } finally{ setTrendsLoading(false); } };
  const useAsTopic     = (title) => { setTab("create"); setTopic(title.slice(0,80)); showToast(tr(trendsLang,"messages.topicImported")); };
  const connectTiktok      = () => { window.location.href=`${API}/tiktok/connect?token=${encodeURIComponent(token)}`; };
  const disconnectTiktok   = async () => { await fetch(`${API}/tiktok/disconnect`,{ method:"DELETE",headers:{ Authorization:`Bearer ${token}` } }); setTiktokStatus({ connected:false, username:null }); };
  const postToTiktok       = async () => { if(!post) return; setTiktokPosting(true); try{ const r=await fetch(`${API}/tiktok/post`,{ method:"POST",headers:{ "Content-Type":"application/json",Authorization:`Bearer ${token}` },body:JSON.stringify({ caption:post }) }); const d=await r.json(); if(d.code==="video_required"){ showToast("⚠️ TikTok requires a video URL"); } else if(d.success){ showToast("✓ Published on TikTok!"); } else showToast("❌ TikTok post failed"); } catch{ showToast("❌ TikTok post failed"); } finally{ setTiktokPosting(false); } };
  const connectFacebook    = () => { window.location.href=`${API}/facebook/connect?token=${encodeURIComponent(token)}`; };
  const disconnectFacebook = async () => { await fetch(`${API}/facebook/disconnect`,{ method:"DELETE",headers:{ Authorization:`Bearer ${token}` } }); setFacebookStatus({ connected:false, userName:null, pageName:null }); };
  const postToFacebook     = async (overrideText=null, overrideMedia=null) => { const txt=overrideText||post; if(!txt) return false; setFacebookPosting(true); try{ const r=await fetch(`${API}/facebook/post`,{ method:"POST",headers:{ "Content-Type":"application/json",Authorization:`Bearer ${token}` },body:JSON.stringify({ message:txt, imageUrl: overrideMedia||attachedMedia?.media_url||null }) }); const d=await r.json(); if(d.success){ showToast("✓ Published on Facebook!"); return true; } else { showToast("❌ Facebook post failed"); return false; } } catch{ showToast("❌ Facebook post failed"); return false; } finally{ setFacebookPosting(false); } };
  const connectInstagram    = () => { window.location.href=`${API}/instagram/connect?token=${encodeURIComponent(token)}`; };
  const disconnectInstagram = async () => { await fetch(`${API}/instagram/disconnect`,{ method:"DELETE",headers:{ Authorization:`Bearer ${token}` } }); setInstagramStatus({ connected:false, username:null }); };
  const postToInstagram     = async () => {
    if(!post) return;
    setInstagramPosting(true);
    try {
      const r=await fetch(`${API}/instagram/post`,{ method:"POST",headers:{ "Content-Type":"application/json",Authorization:`Bearer ${token}` },body:JSON.stringify({ caption:post }) });
      const d=await r.json();
      if(d.success){ showToast(tr(trendsLang,"messages.publishedInstagram")); }
      else if(d.code==="image_required"){ showToast(tr(trendsLang,"messages.instagramImageRequired")); }
      else { showToast(tr(trendsLang,"messages.instagramFailed")); }
    } catch{ showToast(tr(trendsLang,"messages.instagramFailed")); }
    finally{ setInstagramPosting(false); }
  };
  const connectTwitter     = () => { window.location.href=`${API}/twitter/connect?token=${encodeURIComponent(token)}`; };
  const disconnectTwitter  = async () => { await fetch(`${API}/twitter/disconnect`,{ method:"DELETE",headers:{ Authorization:`Bearer ${token}` } }); setTwitterStatus({ connected:false, username:null }); };
  const postToTwitter      = async (overrideText=null) => { const txt=overrideText||post; if(!txt) return false; setTwitterPosting(true); try{ const r=await fetch(`${API}/twitter/post`,{ method:"POST",headers:{ "Content-Type":"application/json",Authorization:`Bearer ${token}` },body:JSON.stringify({ text:txt }) }); const d=await r.json(); if(d.success){ showToast(tr(trendsLang,"messages.publishedTwitter")); return true; } else { showToast(tr(trendsLang,"messages.twitterFailed")); return false; } } catch{ showToast(tr(trendsLang,"messages.twitterFailed")); return false; } finally{ setTwitterPosting(false); } };
  const connectLinkedin    = () => { window.location.href=`${API}/linkedin/connect?token=${encodeURIComponent(token)}`; };
  const disconnectLinkedin = async () => { await fetch(`${API}/linkedin/disconnect`,{ method:"DELETE",headers:{ Authorization:`Bearer ${token}` } }); setLinkedinStatus({ connected:false,name:null }); };
  const postToLinkedin     = async (overrideText=null, overrideMedia=null) => { const txt=overrideText||post; if(!txt) return false; setLinkedinPosting(true); try{ const r=await fetch(`${API}/linkedin/post`,{ method:"POST",headers:{ "Content-Type":"application/json",Authorization:`Bearer ${token}` },body:JSON.stringify({ text:txt, postDbId:overrideText?null:(currentPostDbId||null), imageUrl: overrideMedia||attachedMedia?.media_url||null }) }); const d=await r.json(); if(d.success){ if(!overrideText) setCurrentPostDbId(null); showToast(tr(trendsLang,"messages.publishedLinkedin")); return true; } else { showToast(tr(trendsLang,"messages.linkedinFailed")); return false; } } catch{ showToast(tr(trendsLang,"messages.linkedinFailed")); return false; } finally{ setLinkedinPosting(false); } };
  const connectThreads    = () => { window.location.href=`${API}/threads/connect?token=${encodeURIComponent(token)}`; };
  const disconnectThreads = async () => { await fetch(`${API}/threads/disconnect`,{ method:"DELETE",headers:{ Authorization:`Bearer ${token}` } }); setThreadsStatus({ connected:false,username:null }); };
  const postToThreads     = async (overrideText=null) => { const txt=overrideText||post; if(!txt) return; setThreadsPosting(true); try{ const r=await fetch(`${API}/threads/post`,{ method:"POST",headers:{ "Content-Type":"application/json",Authorization:`Bearer ${token}` },body:JSON.stringify({ text:txt }) }); const d=await r.json(); showToast(d.success?tr(trendsLang,"buttons.publishedThreads"):tr(trendsLang,"messages.threadsFailed")); } catch{ showToast(tr(trendsLang,"messages.threadsFailed")); } finally{ setThreadsPosting(false); } };
  const changePassword    = async () => { if(!newPassword||!confirmPassword) return showProfileMsg("error","Please fill all fields"); if(newPassword!==confirmPassword) return showProfileMsg("error","Passwords do not match"); if(newPassword.length<8) return showProfileMsg("error","Password must be at least 8 characters"); setProfileLoading(true); try{ const r=await fetch(`${API}/auth/change-password`,{ method:"POST",headers:{ "Content-Type":"application/json",Authorization:`Bearer ${token}` },body:JSON.stringify({ currentPassword,newPassword }) }); const d=await r.json(); if(r.ok){ showProfileMsg("success","✓ Password updated successfully"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); } else showProfileMsg("error",d.message||"Failed to update password"); } catch{ showProfileMsg("error","Server error"); } finally{ setProfileLoading(false); } };
  const changeEmailAddress= async (currentPassword) => { if(!newEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return showProfileMsg("error","Invalid email address"); if(!currentPassword) return showProfileMsg("error","Current password is required"); setProfileLoading(true); try{ const r=await fetch(`${API}/auth/change-email/request`,{ method:"POST",headers:{ "Content-Type":"application/json",Authorization:`Bearer ${token}` },body:JSON.stringify({ newEmail,currentPassword }) }); const d=await r.json(); if(r.ok){ showProfileMsg("success","✓ Confirmation email sent — check your new inbox to confirm the change"); setNewEmail(""); } else showProfileMsg("error",d.message||"Failed to request email change"); } catch{ showProfileMsg("error","Server error"); } finally{ setProfileLoading(false); } };
  const saveProfile = async () => { setProfileLoading(true); try{ const r=await fetch(`${API}/auth/save-profile`,{ method:"POST",headers:{ "Content-Type":"application/json",Authorization:`Bearer ${token}` },body:JSON.stringify({ first_name:firstName,last_name:lastName,display_name:displayName }) }); const d=await r.json(); if(r.ok){ showProfileMsg("success","✓ Profile updated"); } else showProfileMsg("error",d.message||"Failed to update profile"); } catch{ showProfileMsg("error","Server error"); } finally{ setProfileLoading(false); } };
  const deleteAccount     = async () => { await api("auth/delete-account",{},"DELETE"); localStorage.removeItem("token"); window.location.reload(); };
  const completeOnboarding = (mem) => {
    setShowOnboarding(false);
    showToast(tr(trendsLang,"messages.workspaceReady"));
    if (mem?.niche || mem?.tone || mem?.audience) {
      setMemory({ niche: mem.niche||"", audience: mem.audience||"", tone: mem.tone||"", cta:"", banned_words:"" });
    }
    // Charger le projet default et sa brand memory
    selectProject("default").catch(() => {});
    setTab("create");
  };

  const NAV_TABS   = ["home","dashboard","insights","create","memory","carousel","ghostwrite","autorepost","templates","calendar","scheduler","autopost","analyze","planner","history","publish","team","integrations","trends"];
  const BOTTOM_NAV = [{ key:"home",icon:"🏠" },{ key:"create",icon:"✍️" },{ key:"trends",icon:"🌍" },{ key:"analyze",icon:"📊" },{ key:"profile",icon:"👤" }];
  const shared     = { trendsLang, isMobile, token };


  return (
    <div style={st.page}>

      {/* Sidebar desktop */}
      {!isMobile && (
        <aside style={st.sidebar}>
          <div style={st.brandText}>
            <img src={logo} alt="logo" style={st.sidebarLogo} />
            <h2 style={st.brandMini}>GrowthPILOT</h2>
          </div>
          {NAV_TABS.map(k=>(
            <button key={k} style={{ ...st.nav,background:tab===k?"rgba(220,38,38,0.1)":"transparent",border:"none",borderRadius:8,color:tab===k?"#ef4444":"#64748b",borderLeft:tab===k?"3px solid #ef4444":"3px solid transparent",boxShadow:tab===k?"0 0 16px rgba(220,38,38,0.12)":"none",textShadow:"none" }} onClick={()=>setTab(k)}>
              {tr(trendsLang,`nav.${k}`)}
            </button>
          ))}
        </aside>
      )}

      {/* Mobile drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200 }} onClick={()=>setSidebarOpen(false)} />
          <div style={st.mobileDrawer}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}><img src={logo} alt="logo" style={{ width:30,height:30,objectFit:"contain" }} /><h2 style={st.brandMini}>GrowthPILOT</h2></div>
              <button style={{ background:"transparent",border:"none",color:"#ef4444",fontSize:22,cursor:"pointer",padding:"4px 8px" }} onClick={()=>setSidebarOpen(false)}>✕</button>
            </div>
            {[...NAV_TABS,"profile"].map(k=>(
              <button key={k} style={{ ...st.nav,background:tab===k?"rgba(220,38,38,0.1)":"transparent",border:"none",borderRadius:8,color:tab===k?"#ef4444":"#64748b",borderLeft:tab===k?"3px solid #ef4444":"3px solid transparent",textShadow:"none",fontSize:14,padding:"14px 16px" }} onClick={()=>navigate(k)}>
                {tr(trendsLang,`nav.${k}`)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Main */}
      <main style={{ ...st.main, paddingBottom: isMobile ? 72 : 18 }}>

        {/* Onboarding wizard */}
        {showOnboarding && token && token !== "guest" && (
          <OnboardingWizard
            token={token}
            trendsLang={trendsLang}
            onComplete={(mem) => completeOnboarding(mem)}
          />
        )}

        {/* Loader */}
        {loading && (
          <div style={st.loaderOverlay}>
            <div style={{ ...st.loaderCard, padding:isMobile?"32px 24px":"50px 70px" }}>
              <div style={{ width:80,height:80,borderRadius:"50%",margin:"0 auto 24px",background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <img src={logo} alt="GrowthPilot" style={{ width:72,height:72,objectFit:"contain" }} />
              </div>
              <h2 style={{ marginBottom:20 }}>GrowthPilot AI</h2>
              <div style={{ color:"#d4d4d8",fontSize:15,minHeight:24,marginBottom:20,textAlign:"center" }}>{aiSteps[aiStep]}</div>
              <div style={{ width:"100%",height:6,background:"rgba(255,255,255,0.08)",borderRadius:999,overflow:"hidden" }}>
                <div style={{ width:`${((aiStep+1)/aiSteps.length)*100}%`,height:"100%",background:"linear-gradient(90deg,#7c3aed,#4f46e5)",transition:"width 1s ease" }} />
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={pageTransition.initial} animate={pageTransition.animate} exit={pageTransition.exit} transition={pageTransition.transition}>
            {tab==="home"         && <Home         {...shared} setTab={setTab} stats={stats} userPlan={userPlan} firstName={firstName} displayName={displayName} />}
            {tab==="dashboard"    && <Dashboard    {...shared} animatedStats={animatedStats} stats={stats} projects={projects} liveFeed={liveFeed} timelineData={timelineData} growthData={growthData} firstName={firstName} displayName={displayName} setTab={setTab} />}
            {tab==="create"       && <Create       {...shared} token={token} plan={userPlan?.plan || "Free"} post={post} setPost={setPost} attachedMedia={attachedMedia} setAttachedMedia={setAttachedMedia} topic={topic} setTopic={setTopic} projectTitle={projectTitle} setProjectTitle={setProjectTitle} searchProject={searchProject} setSearchProject={setSearchProject} selectedProject={selectedProject} filteredProjects={filteredProjects} renameValue={renameValue} setRenameValue={setRenameValue} saveStatus={saveStatus} loading={loading} postMetrics={postMetrics} savePost={savePost} copyPost={copyPost} exportPost={exportPost} analyze={analyze} generatePlanner={generatePlanner} generate={generate} rewrite={rewrite} createProject={createProject} duplicateProject={duplicateProject} renameProject={renameProject} deleteProject={deleteProject} selectProject={selectProject} projectPosts={projectPosts} />}
            {tab==="memory"       && <Memory       {...shared} memory={memory} setMemory={setMemory} saveBrandMemory={saveBrandMemory} />}
            {tab==="carousel"     && <Carousel     {...shared} post={post} topic={topic} memory={memory} showToast={showToast} />}
            {tab==="ghostwrite"   && <GhostWrite   {...shared} post={post} setPost={setPost} setTab={setTab} memory={memory} showToast={showToast} />}
            {tab==="templates"    && <Templates    {...shared} post={post} setPost={setPost} setTopic={setTopic} setTab={setTab} showToast={showToast} />}
            {tab==="calendar"     && <Calendar     {...shared} post={post} setPost={setPost} setTab={setTab} showToast={showToast} />}
            {tab==="autorepost"   && <AutoRepost   {...shared} history={history} setPost={setPost} setTab={setTab} linkedinStatus={linkedinStatus} threadsStatus={threadsStatus} twitterStatus={twitterStatus} facebookStatus={facebookStatus} instagramStatus={instagramStatus} tiktokStatus={tiktokStatus} postToLinkedin={postToLinkedin} postToThreads={postToThreads} postToTwitter={postToTwitter} postToFacebook={postToFacebook} postToInstagram={postToInstagram} postToTiktok={postToTiktok} showToast={showToast} />}
            {tab==="analyze"      && <Analyze      {...shared} analysis={analysis} platformData={platformData} />}
            {tab==="insights"     && <Insights     {...shared} insights={insights} stats={stats} linkedinStatus={linkedinStatus} threadsStatus={threadsStatus} />}
            {tab==="scheduler"    && <Scheduler    {...shared} scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} scheduleTime={scheduleTime} setScheduleTime={setScheduleTime} scheduledPosts={scheduledPosts} publishLog={publishLog} schedulePost={schedulePost} />}
            {tab==="autopost"     && <Autopost     {...shared} post={post} autoPlatform={autoPlatform} setAutoPlatform={setAutoPlatform} autoPosts={autoPosts} publishLog={publishLog} linkedinStatus={linkedinStatus} threadsStatus={threadsStatus} twitterStatus={twitterStatus} autoPublish={autoPublish} postToTwitter={postToTwitter} twitterPosting={twitterPosting} showToast={showToast} />}
            {tab==="publish"      && <Publish      {...shared} post={post} publishLog={publishLog} autoPosts={autoPosts} publishStatus={publishStatus} linkedinStatus={linkedinStatus} twitterStatus={twitterStatus} facebookStatus={facebookStatus} publish={publish} postToTwitter={postToTwitter} postToFacebook={postToFacebook} twitterPosting={twitterPosting} facebookPosting={facebookPosting} showToast={showToast} />}
            {tab==="planner"      && <Planner      {...shared} planner={planner} scheduledPosts={scheduledPosts} generatePlanner={generatePlanner} />}
            {tab==="history"      && <History      {...shared} history={history} projects={projects} loadHistory={loadHistory} setPost={setPost} setTab={setTab} token={token} />}
            {tab==="team"         && <Team         {...shared} token={token} userPlan={userPlan?.plan || "Free"} setPage={setPage} projects={projects} autoPosts={autoPosts} scheduledPosts={scheduledPosts} workspace={workspace} />}
            {tab==="trends"       && <Trends       {...shared} trends={trends} trendsNiche={trendsNiche} setTrendsNiche={setTrendsNiche} trendsLoading={trendsLoading} trendsSources={trendsSources} fetchTrends={fetchTrends} useAsTopic={useAsTopic} />}
            {tab==="integrations" && <Integrations {...shared} token={token} post={post} openLogin={() => setPage && setPage("auth")} linkedinStatus={linkedinStatus} threadsStatus={threadsStatus} twitterStatus={twitterStatus} instagramStatus={instagramStatus} facebookStatus={facebookStatus} tiktokStatus={tiktokStatus} linkedinPosting={linkedinPosting} threadsPosting={threadsPosting} twitterPosting={twitterPosting} instagramPosting={instagramPosting} facebookPosting={facebookPosting} tiktokPosting={tiktokPosting} connectLinkedin={connectLinkedin} disconnectLinkedin={disconnectLinkedin} postToLinkedin={postToLinkedin} connectThreads={connectThreads} disconnectThreads={disconnectThreads} postToThreads={postToThreads} connectTwitter={connectTwitter} disconnectTwitter={disconnectTwitter} postToTwitter={postToTwitter} connectInstagram={connectInstagram} disconnectInstagram={disconnectInstagram} postToInstagram={postToInstagram} connectFacebook={connectFacebook} disconnectFacebook={disconnectFacebook} postToFacebook={postToFacebook} connectTiktok={connectTiktok} disconnectTiktok={disconnectTiktok} postToTiktok={postToTiktok} showToast={showToast} />}
            {tab==="profile"      && <Profile      {...shared} token={token} profileSection={profileSection} setProfileSection={setProfileSection} profileMsg={profileMsg} setProfileMsg={setProfileMsg} profileLoading={profileLoading} currentPassword={currentPassword} setCurrentPassword={setCurrentPassword} newPassword={newPassword} setNewPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} newEmail={newEmail} setNewEmail={setNewEmail} firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} displayName={displayName} setDisplayName={setDisplayName} userPlan={userPlan} projects={projects} stats={stats} workspace={workspace} changePassword={changePassword} changeEmailAddress={changeEmailAddress} deleteAccount={deleteAccount} saveProfile={saveProfile} setPage={setPage} showToast={showToast} onShowOnboarding={() => setShowOnboarding(true)} />}
          </motion.div>
        </AnimatePresence>

        {toast && <div style={st.toast}>{toast}</div>}
      </main>

      {/* Bottom nav mobile */}
      {isMobile && (
        <nav style={st.bottomNav}>
          {BOTTOM_NAV.map(({ key,icon })=>(
            <button key={key} style={{ ...st.bottomNavBtn,color:tab===key?"#ef4444":"#475569",borderTop:tab===key?"2px solid #ef4444":"2px solid transparent" }} onClick={()=>navigate(key)}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.5px",marginTop:2 }}>{key.toUpperCase()}</span>
            </button>
          ))}
          <button style={{ ...st.bottomNavBtn,color:sidebarOpen?"#ef4444":"#475569",borderTop:sidebarOpen?"2px solid #ef4444":"2px solid transparent" }} onClick={()=>setSidebarOpen(!sidebarOpen)}>
            <span style={{ fontSize:22 }}>☰</span>
            <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.5px",marginTop:2 }}>MENU</span>
          </button>
        </nav>
      )}
    </div>
  );
}
