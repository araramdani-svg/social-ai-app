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
  const setTab    = (t) => {
    setTabState(t);
    sessionStorage.setItem("gp_tab", t);
    // Effacer le badge de l'onglet visité
    if (t === "history")   { setHistoryBadge(0);   localStorage.setItem("gp_history_seen",  String(Date.now())); }
    if (t === "publish")   { setPublishBadge(0);   localStorage.setItem("gp_publish_seen",  String(Date.now())); }
    if (t === "scheduler") { setSchedulerBadge(0); }
  };
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
  const [attachedMedia,  setAttachedMedia]  = useState(() => { try { const v = localStorage.getItem("gp_attachedMedia"); return v ? JSON.parse(v) : null; } catch { return null; } });
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [autoPosts,      setAutoPosts]      = useState([]);
  const [scheduleDate,   setScheduleDate]   = useState("");
  const [scheduleTime,   setScheduleTime]   = useState("");
  const [analysis,       setAnalysis]       = useState(null);
  const [memory,         setMemory]         = useState({ niche:"", audience:"", tone:"", cta:"", banned_words:"" });
  const [liveFeed,       setLiveFeed]       = useState([]);

  // ── States médias persistants (remontés depuis Create) ───────────────────
  const [imgResult,     setImgResult]     = useState(() => { try { const v = localStorage.getItem("gp_imgResult"); return v ? JSON.parse(v) : null; } catch { return null; } });
  const [imgFormat,     setImgFormat]     = useState(() => localStorage.getItem("gp_imgFormat") || "square");
  const [imgType,       setImgType]       = useState(() => localStorage.getItem("gp_imgType") || "illustrative");
  const [imgTab,        setImgTab]        = useState(() => localStorage.getItem("gp_imgTab") || "illustrative");
  const [mediaResult,   setMediaResult]   = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [watchContext,  setWatchContext]  = useState(null);
  const [voiceStyle,    setVoiceStyle]    = useState(() => { try { const v = localStorage.getItem("gp_voiceStyle"); return v ? JSON.parse(v) : null; } catch { return null; } });

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
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [historyBadge,    setHistoryBadge]    = useState(0); // nouveaux posts non vus
  const [publishBadge,    setPublishBadge]    = useState(0); // publications récentes non vues
  const [schedulerBadge,  setSchedulerBadge]  = useState(0); // posts planifiés actifs
  const [notifications,   setNotifications]   = useState([]);
  const [notifOpen,       setNotifOpen]       = useState(false);
  const [notifUnread,     setNotifUnread]     = useState(0);
  const [planManagedBy,   setPlanManagedBy]   = useState("self");
  const [managedByTeamName,   setManagedByTeamName]   = useState(null);
  const [managedByOwnerEmail, setManagedByOwnerEmail] = useState(null);
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

  // Badge scheduler
  useEffect(() => {
    setSchedulerBadge(scheduledPosts.length);
  }, [scheduledPosts]);

  // Notifications in-app — fetch + polling 30s
  const fetchNotifications = async () => {
    if (!token || token === "guest") return;
    try {
      const r = await fetch(`${API}/team/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.notifications) {
        setNotifications(d.notifications);
        setNotifUnread(d.unread || 0);
      }
    } catch {}
  };

  useEffect(() => {
    if (!token || token === "guest") return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotifUnread(0);
    try {
      await fetch(`${API}/team/notifications/read-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notif_ids: unreadIds }),
      });
    } catch {}
  };

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
      loadProjects(); loadHistory(); loadPublishLog();
      // Vérifier onboarding_done en DB (multi-device)
      fetch(`${API}/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.onboarding_done === false) setShowOnboarding(true); if (d.first_name) setFirstName(d.first_name); if (d.last_name) setLastName(d.last_name); if (d.display_name) setDisplayName(d.display_name); if (d.plan_managed_by) setPlanManagedBy(d.plan_managed_by); if (d.plan_managed_by === "team") { fetch(`${API}/team/my-team-view`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(td => { if (td.teamName) setManagedByTeamName(td.teamName); if (td.owner?.email) setManagedByOwnerEmail(td.owner.email); }).catch(() => {}); } })
        .catch(() => {});
      fetch(`${API}/stripe/status`,   { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(d => {
        setUserPlan(d);
        // Fetch pending approvals count si Business/Agency
        if (d?.plan === "Business" || d?.plan === "Agency") {
          fetch(`${API}/team/approvals`, { headers:{ Authorization:`Bearer ${token}` } })
            .then(r=>r.json())
            .then(a => { setPendingApprovalsCount(a.posts?.length || 0); })
            .catch(()=>{});
        }
      }).catch(()=>{});
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
    // Accepter une invitation team si l'user est deja connecte
    const inviteToken = params.get("invite") || localStorage.getItem("pendingInviteToken");
    if (inviteToken && token && token !== "guest") {
      fetch(`${API}/team/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: inviteToken }),
      })
        .then(r => r.json())
        .then(d => { if (d.success) { localStorage.removeItem("pendingInviteToken"); window.history.replaceState({}, "", "/"); } })
        .catch(() => {});
    }
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

  // ── Persistence médias ────────────────────────────────────────────────────
  useEffect(() => { try { if (imgResult) localStorage.setItem("gp_imgResult", JSON.stringify(imgResult)); else localStorage.removeItem("gp_imgResult"); } catch {} }, [imgResult]);
  useEffect(() => { localStorage.setItem("gp_imgFormat", imgFormat); }, [imgFormat]);
  useEffect(() => { localStorage.setItem("gp_imgType", imgType); }, [imgType]);
  useEffect(() => { localStorage.setItem("gp_imgTab", imgTab); }, [imgTab]);
  useEffect(() => { try { if (voiceStyle) localStorage.setItem("gp_voiceStyle", JSON.stringify(voiceStyle)); else localStorage.removeItem("gp_voiceStyle"); } catch {} }, [voiceStyle]);
  useEffect(() => { try { if (attachedMedia) localStorage.setItem("gp_attachedMedia", JSON.stringify(attachedMedia)); else localStorage.removeItem("gp_attachedMedia"); } catch {} }, [attachedMedia]);

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
  const loadHistory    = async () => {
    try {
      const d = await api("auth/posts",{},"GET");
      const posts = Array.isArray(d) ? d : [];
      setHistory(posts);
      // Badge : posts créés depuis la dernière visite de l'onglet history
      const lastSeen = parseInt(localStorage.getItem("gp_history_seen") || "0");
      const newPosts = posts.filter(p => new Date(p.created_at).getTime() > lastSeen).length;
      setHistoryBadge(newPosts);
    } catch { setHistory([]); }
  };
  const loadPublishLog = async () => {
    try {
      const d = await api("auth/publish-log",{},"GET");
      const logs = Array.isArray(d) ? d.map(p=>({ dest:p.platform, date:new Date(p.created_at).toLocaleString(), created_at:p.created_at })) : [];
      setPublishLog(logs);
      // Badge : publications depuis la dernière visite de l'onglet publish
      const lastSeen = parseInt(localStorage.getItem("gp_publish_seen") || "0");
      const recent = logs.filter(p => new Date(p.created_at).getTime() > lastSeen).length;
      setPublishBadge(recent);
    } catch { setPublishLog([]); }
  };
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
      if (ok) { setPublishLog(p => [{ dest, date: new Date().toLocaleString() }, ...p]); loadPublishLog(); }
    } else if (dest === "TWITTER") {
      if (!twitterStatus?.connected) return showToast("⚠️ X/Twitter not connected — go to Integrations");
      const ok = await postToTwitter();
      if (ok) { setPublishLog(p => [{ dest, date: new Date().toLocaleString() }, ...p]); loadPublishLog(); }
    } else if (dest === "FACEBOOK") {
      if (!facebookStatus?.connected) return showToast("⚠️ Facebook not connected — go to Integrations");
      const ok = await postToFacebook();
      if (ok) { setPublishLog(p => [{ dest, date: new Date().toLocaleString() }, ...p]); loadPublishLog(); }
    }
  };
  const generatePlanner= () => { setPlanner(Array.from({ length:30 },(_,i)=>`Day ${i+1} — ${campaign} / ${topic}`)); setTab("planner"); };
  const schedulePost   = () => { if(!scheduleDate||!scheduleTime||!post) return; setScheduledPosts(p=>[{ content:post.slice(0,80)+"...",date:scheduleDate,time:scheduleTime },...p]); };
  // autoPublish removed - feature deprecated
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

  const NAV_TABS   = ["home","dashboard","insights","create","memory","carousel","ghostwrite","autorepost","templates","calendar","scheduler","analyze","history","publish","team","integrations","trends"];
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
          {NAV_TABS.map(k=>{
            const badgeCount =
              k === "team"      ? pendingApprovalsCount :
              k === "history"   ? historyBadge :
              k === "publish"   ? publishBadge :
              k === "scheduler" ? schedulerBadge : 0;
            const badgeColor =
              k === "team"      ? "#ef4444" :
              k === "history"   ? "#8b5cf6" :
              k === "publish"   ? "#f97316" :
              k === "scheduler" ? "#60a5fa" : "#ef4444";
            return (
              <button key={k} style={{ ...st.nav,background:tab===k?"rgba(220,38,38,0.1)":"transparent",border:"none",borderRadius:8,color:tab===k?"#ef4444":"#64748b",borderLeft:tab===k?"3px solid #ef4444":"3px solid transparent",boxShadow:tab===k?"0 0 16px rgba(220,38,38,0.12)":"none",textShadow:"none", position:"relative" }} onClick={()=>setTab(k)}>
                {tr(trendsLang,`nav.${k}`)}
                {badgeCount > 0 && (
                  <span style={{ position:"absolute", top:6, right:8, background:badgeColor, color:"#fff", borderRadius:"50%", minWidth:16, height:16, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", lineHeight:1 }}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* ── Cloche notifications ── */}
          <div style={{ position:"relative", marginTop:"auto", paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => { setNotifOpen(o => !o); if (!notifOpen) markAllRead(); }}
              style={{ width:"100%", background:"none", border:"none", borderRadius:8, color: notifUnread > 0 ? "#f59e0b" : "#475569", fontSize:12, fontWeight:700, padding:"10px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, position:"relative" }}
            >
              <span style={{ fontSize:16 }}>🔔</span>
              {tr(trendsLang,"ui.notifications") || "Notifications"}
              {notifUnread > 0 && (
                <span style={{ marginLeft:"auto", background:"#ef4444", color:"#fff", borderRadius:"50%", minWidth:18, height:18, fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>
                  {notifUnread}
                </span>
              )}
            </button>

            {/* Panel dropdown */}
            {notifOpen && (
              <div style={{ position:"fixed", left:220, bottom:20, width:320, maxHeight:480, background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, boxShadow:"0 20px 60px rgba(0,0,0,0.6)", zIndex:9999, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                {/* Header */}
                <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"#e2e8f0", fontWeight:800, fontSize:13 }}>🔔 {tr(trendsLang,"ui.notifications") || "Notifications"}</span>
                  <button onClick={() => setNotifOpen(false)} style={{ background:"none", border:"none", color:"#475569", fontSize:16, cursor:"pointer" }}>✕</button>
                </div>

                {/* Liste */}
                <div style={{ overflowY:"auto", flex:1 }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"40px 20px", color:"#334155" }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>🔕</div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#475569" }}>{tr(trendsLang,"ui.noNotifications") || "No notifications"}</div>
                    </div>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => { setTab(n.link_tab); setNotifOpen(false); }}
                      style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer", background: n.read ? "transparent" : `${n.color}08`, display:"flex", gap:10, alignItems:"flex-start", transition:"background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : `${n.color}08`}
                    >
                      <span style={{ fontSize:18, flexShrink:0, lineHeight:1.3 }}>{n.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                          <span style={{ color: n.color, fontSize:11, fontWeight:700 }}>{n.title}</span>
                          <span style={{ color:"#334155", fontSize:9, flexShrink:0, marginLeft:6 }}>
                            {new Date(n.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                          </span>
                        </div>
                        <div style={{ color:"#64748b", fontSize:11, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.body}</div>
                      </div>
                      {!n.read && <div style={{ width:6, height:6, borderRadius:"50%", background:n.color, flexShrink:0, marginTop:4 }} />}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div style={{ padding:"10px 16px", borderTop:"1px solid rgba(255,255,255,0.07)", textAlign:"center" }}>
                    <button onClick={markAllRead} style={{ background:"none", border:"none", color:"#475569", fontSize:11, cursor:"pointer", fontWeight:600 }}>
                      {tr(trendsLang,"ui.markAllRead") || "Mark all as read"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Overlay ferme le panel notifs */}
      {notifOpen && <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setNotifOpen(false)} />}

      {/* Mobile drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200 }} onClick={()=>setSidebarOpen(false)} />
          <div style={st.mobileDrawer}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}><img src={logo} alt="logo" style={{ width:30,height:30,objectFit:"contain" }} /><h2 style={st.brandMini}>GrowthPILOT</h2></div>
              <button style={{ background:"transparent",border:"none",color:"#ef4444",fontSize:22,cursor:"pointer",padding:"4px 8px" }} onClick={()=>setSidebarOpen(false)}>✕</button>
            </div>
            {[...NAV_TABS,"profile"].map(k=>{
              const badgeCount =
                k === "team"      ? pendingApprovalsCount :
                k === "history"   ? historyBadge :
                k === "publish"   ? publishBadge :
                k === "scheduler" ? schedulerBadge : 0;
              const badgeColor =
                k === "team"      ? "#ef4444" :
                k === "history"   ? "#8b5cf6" :
                k === "publish"   ? "#f97316" :
                k === "scheduler" ? "#60a5fa" : "#ef4444";
              return (
                <button key={k} style={{ ...st.nav,background:tab===k?"rgba(220,38,38,0.1)":"transparent",border:"none",borderRadius:8,color:tab===k?"#ef4444":"#64748b",borderLeft:tab===k?"3px solid #ef4444":"3px solid transparent",textShadow:"none",fontSize:14,padding:"14px 16px", position:"relative" }} onClick={()=>navigate(k)}>
                  {tr(trendsLang,`nav.${k}`)}
                  {badgeCount > 0 && (
                    <span style={{ position:"absolute", top:10, right:12, background:badgeColor, color:"#fff", borderRadius:"50%", minWidth:18, height:18, fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", lineHeight:1 }}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
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
            {tab==="dashboard"    && <Dashboard    {...shared} animatedStats={animatedStats} stats={stats} projects={projects} liveFeed={liveFeed} timelineData={timelineData} growthData={growthData} firstName={firstName} displayName={displayName} setTab={setTab} userPlan={userPlan} />}
            {tab==="create"       && <Create       {...shared} token={token} plan={userPlan?.plan || "Free"} post={post} setPost={setPost} attachedMedia={attachedMedia} setAttachedMedia={setAttachedMedia} topic={topic} setTopic={setTopic} projectTitle={projectTitle} setProjectTitle={setProjectTitle} searchProject={searchProject} setSearchProject={setSearchProject} selectedProject={selectedProject} filteredProjects={filteredProjects} renameValue={renameValue} setRenameValue={setRenameValue} saveStatus={saveStatus} loading={loading} postMetrics={postMetrics} savePost={savePost} copyPost={copyPost} exportPost={exportPost} analyze={analyze} generatePlanner={generatePlanner} generate={generate} rewrite={rewrite} createProject={createProject} duplicateProject={duplicateProject} renameProject={renameProject} deleteProject={deleteProject} selectProject={selectProject} projectPosts={projectPosts} imgResult={imgResult} setImgResult={setImgResult} imgFormat={imgFormat} setImgFormat={setImgFormat} imgType={imgType} setImgType={setImgType} imgTab={imgTab} setImgTab={setImgTab} mediaResult={mediaResult} setMediaResult={setMediaResult} selectedMedia={selectedMedia} setSelectedMedia={setSelectedMedia} watchContext={watchContext} setWatchContext={setWatchContext} voiceStyle={voiceStyle} setVoiceStyle={setVoiceStyle} />}
            {tab==="memory"       && <Memory       {...shared} memory={memory} setMemory={setMemory} saveBrandMemory={saveBrandMemory} />}
            {tab==="carousel"     && <Carousel     {...shared} post={post} topic={topic} memory={memory} showToast={showToast} />}
            {tab==="ghostwrite"   && <GhostWrite   {...shared} post={post} setPost={setPost} setTab={setTab} memory={memory} showToast={showToast} />}
            {tab==="templates"    && <Templates    {...shared} post={post} setPost={setPost} setTopic={setTopic} setTab={setTab} showToast={showToast} />}
            {tab==="calendar"     && <Calendar     {...shared} post={post} setPost={setPost} setTab={setTab} showToast={showToast} />}
            {tab==="autorepost"   && <AutoRepost   {...shared} history={history} setPost={setPost} setTab={setTab} linkedinStatus={linkedinStatus} threadsStatus={threadsStatus} twitterStatus={twitterStatus} facebookStatus={facebookStatus} instagramStatus={instagramStatus} tiktokStatus={tiktokStatus} postToLinkedin={postToLinkedin} postToThreads={postToThreads} postToTwitter={postToTwitter} postToFacebook={postToFacebook} postToInstagram={postToInstagram} postToTiktok={postToTiktok} showToast={showToast} />}
            {tab==="analyze"      && <Analyze      {...shared} analysis={analysis} platformData={platformData} />}
            {tab==="insights"     && <Insights     {...shared} insights={insights} stats={stats} linkedinStatus={linkedinStatus} threadsStatus={threadsStatus} />}
            {tab==="scheduler"    && <Scheduler    {...shared} scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} scheduleTime={scheduleTime} setScheduleTime={setScheduleTime} scheduledPosts={scheduledPosts} setScheduledPosts={setScheduledPosts} publishLog={publishLog} schedulePost={schedulePost} history={history} token={token} />}
            {tab==="publish"      && <Publish      {...shared} post={post} publishLog={publishLog} autoPosts={autoPosts} publishStatus={publishStatus} linkedinStatus={linkedinStatus} twitterStatus={twitterStatus} facebookStatus={facebookStatus} publish={publish} postToTwitter={postToTwitter} postToFacebook={postToFacebook} twitterPosting={twitterPosting} facebookPosting={facebookPosting} attachedMedia={attachedMedia} showToast={showToast} />}
            {tab==="history"      && <History      {...shared} history={history} projects={projects} loadHistory={loadHistory} setPost={setPost} setTab={setTab} token={token} />}
            {tab==="team"         && <Team         {...shared} token={token} userPlan={userPlan?.plan || "Free"} planManagedBy={planManagedBy} setPage={setPage} projects={projects} autoPosts={autoPosts} scheduledPosts={scheduledPosts} workspace={workspace} onApprovalsCount={setPendingApprovalsCount} />}
            {tab==="trends"       && <Trends       {...shared} trends={trends} trendsNiche={trendsNiche} setTrendsNiche={setTrendsNiche} trendsLoading={trendsLoading} trendsSources={trendsSources} fetchTrends={fetchTrends} useAsTopic={useAsTopic} />}
            {tab==="integrations" && <Integrations {...shared} token={token} post={post} openLogin={() => setPage && setPage("auth")} linkedinStatus={linkedinStatus} threadsStatus={threadsStatus} twitterStatus={twitterStatus} instagramStatus={instagramStatus} facebookStatus={facebookStatus} tiktokStatus={tiktokStatus} linkedinPosting={linkedinPosting} threadsPosting={threadsPosting} twitterPosting={twitterPosting} instagramPosting={instagramPosting} facebookPosting={facebookPosting} tiktokPosting={tiktokPosting} connectLinkedin={connectLinkedin} disconnectLinkedin={disconnectLinkedin} postToLinkedin={postToLinkedin} connectThreads={connectThreads} disconnectThreads={disconnectThreads} postToThreads={postToThreads} connectTwitter={connectTwitter} disconnectTwitter={disconnectTwitter} postToTwitter={postToTwitter} connectInstagram={connectInstagram} disconnectInstagram={disconnectInstagram} postToInstagram={postToInstagram} connectFacebook={connectFacebook} disconnectFacebook={disconnectFacebook} postToFacebook={postToFacebook} connectTiktok={connectTiktok} disconnectTiktok={disconnectTiktok} postToTiktok={postToTiktok} showToast={showToast} />}
            {tab==="profile"      && <Profile      {...shared} token={token} profileSection={profileSection} setProfileSection={setProfileSection} profileMsg={profileMsg} setProfileMsg={setProfileMsg} profileLoading={profileLoading} currentPassword={currentPassword} setCurrentPassword={setCurrentPassword} newPassword={newPassword} setNewPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} newEmail={newEmail} setNewEmail={setNewEmail} firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} displayName={displayName} setDisplayName={setDisplayName} userPlan={userPlan} projects={projects} stats={stats} workspace={workspace} changePassword={changePassword} changeEmailAddress={changeEmailAddress} deleteAccount={deleteAccount} saveProfile={saveProfile} setPage={setPage} showToast={showToast} onShowOnboarding={() => setShowOnboarding(true)} planManagedBy={planManagedBy} managedByTeamName={managedByTeamName} managedByOwnerEmail={managedByOwnerEmail} />}
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
