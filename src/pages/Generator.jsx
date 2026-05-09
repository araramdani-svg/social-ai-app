import { useState, useEffect } from "react";
import { t as tr } from "../translations.js";
import logo from "../assets/logo.png";
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";


export default function Generator({ token: tokenProp, trendsLang: langProp, setTrendsLang: setLangProp }) {
  const [tab, setTab] = useState("home");
  const [drafts, setDrafts] = useState([]);
  const [workspace, setWorkspace] = useState("PERSONAL");
  const [voice, setVoice] = useState("Founder");
  const [campaign, setCampaign] = useState("Authority Build");
  const [template, setTemplate] = useState("Authority");
  const [topic, setTopic] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [compareDraft, setCompareDraft] = useState(null);
  const [post, setPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [renameValue, setRenameValue] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [publishStatus, setPublishStatus] = useState("");
  const [searchProject, setSearchProject] = useState("");
  const [history, setHistory] = useState([]);
  const [planner, setPlanner] = useState([]);
  const [publishLog, setPublishLog] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [projects, setProjects] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [autoPosts, setAutoPosts] = useState([]);
  const [autoPlatform, setAutoPlatform] = useState("LINKEDIN");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [toast, setToast] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
  const [animatedStats, setAnimatedStats] = useState({
    posts: 0,
    projects: 0,
    published: 0,
    avgScore: 0,
    streak: 0
  });
const growthData = [
  { day: "Mon", score: 38 },
  { day: "Tue", score: 46 },
  { day: "Wed", score: 55 },
  { day: "Thu", score: 66 },
  { day: "Fri", score: 78 },
  { day: "Sat", score: 86 },
  { day: "Sun", score: 97 }
];
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem("gp_onboarded")
  );
  const platformData = [
    { name:"LinkedIn", value:48 },
    { name:"X", value:31 },
    { name:"Threads", value:21 }
  ];
  const timelineData = [
    {
      time: "08:30",
      platform: "LinkedIn",
      status: "Published"
    },
    {
      time: "11:00",
      platform: "X",
      status: "Queued"
    },
    {
      time: "14:45",
      platform: "Threads",
      status: "Optimizing"
    },
    {
      time: "18:00",
      platform: "LinkedIn",
      status: "Scheduled"
    }
  ];
  const [stats, setStats] = useState({
    posts: 0,
    projects: 0,
    published: 0,
    avgScore: 87,
    streak: 1
  });

  const [insights, setInsights] = useState({
    bestProject: "N/A",
    topPlatform: "LinkedIn",
    recommendation: "Generate more authority content",
    cadence: "Low"
  });

  const [memory, setMemory] = useState({
    niche: "",
    audience: "",
    tone: "",
    cta: "",
    banned_words: ""
  });

  const token = tokenProp || localStorage.getItem("token");

  // Trends state
  const [trends, setTrends] = useState([]);
  const [trendsNiche, setTrendsNiche] = useState("ai");
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsSources, setTrendsSources] = useState({});
  const [trendsLangLocal, setTrendsLangLocal] = useState("en");
  const trendsLang = langProp || trendsLangLocal;
  const setTrendsLang = setLangProp || setTrendsLangLocal;

  const fetchTrends = async (niche, lang) => {
    const selectedLang = lang || trendsLang;
    setTrendsLoading(true);
    try {
      const res = await fetch(
        `https://social-ai-app-production.up.railway.app/scraping/trends?niche=${niche}&lang=${selectedLang}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setTrends(data.trends || []);
      setTrendsSources(data.sources || {});
    } catch {
      showToast("Failed to fetch trends");
    } finally {
      setTrendsLoading(false);
    }
  };

  // ─── Profile state ──────────────────────────────────────────────────────────
  const [profileSection, setProfileSection] = useState("account"); // account | password | email | danger
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  const showProfileMsg = (type, text) => {
    setProfileMsg({ type, text });
    setTimeout(() => setProfileMsg({ type: "", text: "" }), 3000);
  };

  const changePassword = async () => {
    if (!newPassword || !confirmPassword) return showProfileMsg("error", "Please fill all fields");
    if (newPassword !== confirmPassword) return showProfileMsg("error", "Passwords do not match");
    if (newPassword.length < 8) return showProfileMsg("error", "Password must be at least 8 characters");
    setProfileLoading(true);
    try {
      const res = await fetch("https://social-ai-app-production.up.railway.app/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showProfileMsg("success", "✓ Password updated successfully");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        showProfileMsg("error", data.message || "Failed to update password");
      }
    } catch { showProfileMsg("error", "Server error"); }
    finally { setProfileLoading(false); }
  };

  const changeEmailAddress = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return showProfileMsg("error", "Invalid email address");
    setProfileLoading(true);
    try {
      const res = await fetch("https://social-ai-app-production.up.railway.app/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newEmail })
      });
      const data = await res.json();
      if (res.ok) {
        showProfileMsg("success", "✓ Email updated successfully");
        setNewEmail("");
      } else {
        showProfileMsg("error", data.message || "Failed to update email");
      }
    } catch { showProfileMsg("error", "Server error"); }
    finally { setProfileLoading(false); }
  };

  // Re-fetch trends quand la langue change
  useEffect(() => {
    if (tab === "trends" && trends.length > 0) {
      fetchTrends(trendsNiche, trendsLang);
    }
  }, [trendsLang]);

  const useAsTopic = (title) => {
    setTab("create");
    setTopic(title.slice(0, 80));
    showToast("✓ Topic imported to Create");
  };

  // LinkedIn state
  const [linkedinStatus, setLinkedinStatus] = useState({ connected: false, name: null });
  const [linkedinPosting, setLinkedinPosting] = useState(false);

  useEffect(() => {
    if (token && token !== "guest") {
      fetch("https://social-ai-app-production.up.railway.app/linkedin/status", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(setLinkedinStatus).catch(() => {});
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("linkedin") === "connected") {
      window.history.replaceState({}, "", "/");
      fetch("https://social-ai-app-production.up.railway.app/linkedin/status", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(data => {
        setLinkedinStatus(data);
      }).catch(() => {});
    }
  }, []);

  const connectLinkedin = async () => {
    const res = await fetch("https://social-ai-app-production.up.railway.app/linkedin/connect", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const disconnectLinkedin = async () => {
    await fetch("https://social-ai-app-production.up.railway.app/linkedin/disconnect", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setLinkedinStatus({ connected: false, name: null });
  };

  const postToLinkedin = async () => {
    if (!post) return;
    setLinkedinPosting(true);
    try {
      const res = await fetch("https://social-ai-app-production.up.railway.app/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: post })
      });
      const data = await res.json();
      if (data.success) showToast("Published on LinkedIn!");
      else showToast("LinkedIn post failed");
    } catch {
      showToast("LinkedIn post failed");
    } finally {
      setLinkedinPosting(false);
    }
  };

  const api = async (route, body = {}, method = "POST") => {
    const res = await fetch(`https://social-ai-app-production.up.railway.app/${route}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: method !== "GET" ? JSON.stringify(body) : undefined
    });

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      console.error(text);
      return null;
    }
  };
  const changeEmail = () => {
    const newEmail = prompt("Enter your new email address");

    if (!newEmail) return;

    alert(`Email updated to: ${newEmail}`);
  };
  const loadProjects = async () => {
    const data = await api("auth/projects", {}, "GET");
    setProjects(Array.isArray(data) ? data : []);
    return data || [];
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchProject.toLowerCase())
  );

  const aiSteps = [
    "Analyzing audience patterns...",
    "Scanning market signals...",
    "Detecting viral opportunities...",
    "Optimizing hook structure...",
    "Training engagement prediction...",
    "Finalizing premium output..."
  ];

  const activityPool = [
    "AI optimized LinkedIn post",
    "Audience signals updated",
    "Best publish slot detected",
    "Viral score improved",
    "Campaign strategy recalculated",
    "Content resonance boosted",
    "Hook structure refined",
    "Competitor benchmark completed",
    "Performance forecast generated"
  ];

  const pageTransition = {
    initial: {
      opacity: 0,
      x: 80
    },
    animate: {
      opacity: 1,
      x: 0
    },
    exit: {
      opacity: 0,
      x: -80
    },
    transition: {
      duration: 0.5
    }
  };

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const completeOnboarding = () => {
  localStorage.setItem("gp_onboarded", "true");
  setShowOnboarding(false);
  showToast("✓ Workspace ready");
};

  useEffect(() => {
    if (tab !== "dashboard") return;
    let current = 0;
    const steps = 30;

    const timer = setInterval(() => {
      current++;

      setAnimatedStats({
        posts: Math.floor((stats?.posts || 0) * current / steps),
        projects: Math.floor((projects?.length || 0) * current / steps),
        published: Math.floor((stats?.published || 0) * current / steps),
        avgScore: Math.floor((stats?.avgScore || 0) * current / steps),
        streak: Math.floor((stats?.streak || 0) * current / steps)
      });

      if (current >= steps) {
        clearInterval(timer);
      }
    }, 35);

    return () => clearInterval(timer);

  }, [stats, projects, tab]);
    
  useEffect(() => {
    loadProjects();
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      const randomEvent =
        activityPool[
          Math.floor(Math.random() * activityPool.length)
        ];

      const newItem = {
        id: Date.now(),
        text: randomEvent,
        time: "just now"
      };

      setLiveFeed((prev) => [newItem, ...prev.slice(0, 5)]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);
useEffect(() => {
  const handler = () => setTab("profile");
  window.addEventListener("openProfile", handler);
  return () => {
    window.removeEventListener("openProfile", handler);
  };
}, []);

useEffect(() => {
  document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = ""; };
}, []);
  useEffect(() => {
    const key = selectedProject || "default";

    setPost(localStorage.getItem(`gp_post_${key}`) || "");
    setTopic(localStorage.getItem(`gp_topic_${key}`) || "");
    setProjectTitle(localStorage.getItem(`gp_title_${key}`) || "");
  }, [selectedProject]);

  useEffect(() => {
    const key = selectedProject || projectTitle || "default";

    localStorage.setItem(`gp_post_${key}`, post);
    localStorage.setItem(`gp_topic_${key}`, topic);
    localStorage.setItem(`gp_title_${key}`, projectTitle);
  }, [post, topic, projectTitle, selectedProject]);

  useEffect(() => {
    setStats({
      posts: history.length,
      projects: projects.length,
      published: publishLog.length,
      avgScore: analysis?.score || 87,
      streak: Math.max(history.length, 1)
    });

    setInsights({
      bestProject: projects[0]?.name || "No project",
      topPlatform: "LinkedIn",
      recommendation:
        history.length < 5
          ? "Increase posting frequency"
          : "Maintain publishing cadence",
      cadence:
        history.length > 20
          ? "High"
          : history.length > 8
          ? "Medium"
          : "Low"
    });
  }, [history, projects, publishLog, analysis]);
    const createProject = async () => {
    if (!projectTitle) return;

    await api("auth/create-project", {
      name: projectTitle,
      workspace,
      campaign
    });

    await loadProjects();
    await selectProject(projectTitle);
    showToast("✓ Project saved");
  };

  const selectProject = async (projectName) => {
    setSelectedProject(projectName);
    setCompareDraft(null);

    const data = await api(`auth/project/${projectName}`, {}, "GET");

    if (data) {
      setMemory(
        data.memory || {
          niche: "",
          audience: "",
          tone: "",
          cta: "",
          banned_words: ""
        }
      );

      setDrafts(data.drafts || []);
      setHistory(data.posts || []);
      setPost(data.lastPost?.content || "");
      setProjectTitle(projectName);
    }
  };

  const deleteProject = async (projectName) => {
    await api(`auth/delete-project/${projectName}`, {}, "DELETE");
    showToast("✓ Project deleted");

    await loadProjects();

    if (selectedProject === projectName) {
      setSelectedProject("");
      setProjectTitle("");
      setPost("");
      setDrafts([]);
      setHistory([]);
    }
  };

  const renameProject = async () => {
    if (!selectedProject || !renameValue) return;

    await api("auth/rename-project", {
      oldName: selectedProject,
      newName: renameValue
    });

    setSelectedProject(renameValue);
    setProjectTitle(renameValue);
    setRenameValue("");

    await loadProjects();
  };

  const duplicateProject = async () => {
    if (!selectedProject) return;

    await api("auth/create-project", {
      name: `${selectedProject} Copy`,
      workspace,
      campaign
    });

    await loadProjects();
  };

  const saveBrandMemory = async () => {
    showToast("✓ Brand memory updated"),
    await api("auth/save-brand-memory", {
      project_name: selectedProject || projectTitle,
      ...memory
    });
  };

  const savePost = async () => {
    if (!post || !projectTitle) return;

    await api("auth/save-post", {
      title: projectTitle,
      content: post
    });

    showToast("✓ Project saved");

setTimeout(() => {
  setSaveStatus("");
}, 2000);
  };

  const generate = async () => {
    if (!topic) return;

    try {
      setLoading(true);
      setAiStep(0);

      const typingInterval = setInterval(() => {
        setAiStep(prev => {
          if (prev < aiSteps.length - 1) return prev + 1;
          return prev;
        });
      }, 1400);

      const dataPromise = api("generate", {
        topic,
        template,
        voice,
        campaign
      });

      await new Promise(resolve => setTimeout(resolve, 2800));

      const data = await dataPromise;

      if (data?.text) {
        setPost(data.text);
        showToast("✓ Content generated");
      }

    } catch (error) {
      showToast("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = () => {
    if (!post) return;

    setDrafts((prev) => [
      {
        id: Date.now(),
        content: post,
        date: new Date().toLocaleString()
      },
      ...prev
    ]);
  };

  const rewrite = async (mode) => {
    if (!post) return;

    setLoading(true);

    const prompts = {
      viral: "viral",
      authority: "authority",
      story: "story",
      short: "short",
      hook: "hook",
      cta: "cta"
    };

    const data = await api("generate", {
      topic: `${prompts[mode]} rewrite:\n${post}`,
      template,
      voice,
      campaign
    });

    if (data?.text) setPost(data.text);

    setLoading(false);
  };
  const deleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Delete your account permanently?"
    );

    if (!confirmDelete) return;

    await api("auth/delete-account", {}, "DELETE");

    localStorage.removeItem("token");

    alert("Account deleted");

    window.location.reload();
  };
  const analyze = async () => {
    if (!post) return;

    try {
      setLoading(true);

      const data = await api("analyze", {
        text: post
      });

      setAnalysis(data);
      setTab("analyze");
      showToast("✓ Analysis complete");

    } catch (error) {
      showToast("Analysis failed");

    } finally {
      setLoading(false);
      setAiStep(0);
    }
  };

  const loadHistory = async () => {
    const data = await api("auth/posts", {}, "GET");
    setHistory(data || []);
  };
    const exportPost = () => {
    if (!post) return;

    const blob = new Blob([post], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectTitle || "post"}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const copyPost = async () => {
    if (!post) return;

    await navigator.clipboard.writeText(post);
    showToast("✓ Copied to clipboard");

setTimeout(() => {
  setSaveStatus("");
}, 2000);
  };

  const publish = (dest) => {
    showToast("✓ Published successfully");

    setPublishLog((prev) => [
      {
        dest,
        date: new Date().toLocaleString()
      },
      ...prev
    ]);
  };

  const generatePlanner = () => {
    const days = Array.from(
      { length: 30 },
      (_, i) => `Day ${i + 1} — ${campaign} / ${topic}`
    );

    setPlanner(days);
    setTab("planner");
  };

  const schedulePost = () => {
    if (!scheduleDate || !scheduleTime || !post) return;

    setScheduledPosts((prev) => [
      {
        content: post.slice(0, 80) + "...",
        date: scheduleDate,
        time: scheduleTime
      },
      ...prev
    ]);
  };

  const autoPublish = () => {
    if (!post) return;

    setAutoPosts((prev) => [
      {
        platform: autoPlatform,
        content: post.slice(0, 80) + "...",
        status: "Scheduled",
        date: new Date().toLocaleString()
      },
      ...prev
    ]);

    setTimeout(() => {
      setAutoPosts((prev) =>
        prev.map((p, i) =>
          i === 0
            ? {
                ...p,
                status: Math.random() > 0.2 ? "Sent" : "Failed"
              }
            : p
        )
      );
    }, 4000);
  };

  const metricColor = (score) => {
    if (score >= 85) return "#22c55e";
    if (score >= 65) return "#f59e0b";
    return "#ef4444";
  };

  const postMetrics = {
    words: post ? post.trim().split(/\s+/).length : 0,
    chars: post.length,
    readTime: Math.ceil(
      (post ? post.trim().split(/\s+/).length : 0) / 200
    )
  };

  const pageHeader = (tabKey) => {
    const title = tr(trendsLang, `headers.${tabKey}`);
    const subtitle = tr(trendsLang, `subtitles.${tabKey}`);
    return (
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:6 }}>
          <img src={logo} alt="logo" style={{ width:38, height:38, objectFit:"contain", filter:"drop-shadow(0 0 10px rgba(220,38,38,.4))" }} />
          <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
            <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:"2px", margin:0, color:"#fff" }}>{title}</h1>
            <span style={{ fontSize:10, fontWeight:700, color:"#ef4444", letterSpacing:"2px", background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:4, padding:"2px 8px" }}>GROWTHPILOT</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:3, height:14, background:"#ef4444", borderRadius:2 }}/>
          <p style={{ margin:0, fontSize:13, color:"#64748b", letterSpacing:"0.5px" }}>{subtitle}</p>
        </div>
        <div style={{ height:1, background:"linear-gradient(90deg,rgba(220,38,38,0.4),transparent)", marginTop:14 }}/>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brandText}>
          <img src={logo} alt="logo" style={styles.sidebarLogo} />
          <h2 style={styles.brandMini}>GrowthPILOT</h2>
        </div>

        {[
          "home","dashboard","insights","create","memory","scheduler",
          "autopost","analyze","planner","history","publish","team",
          "integrations","trends",
        ].map((tabKey) => (
          <button
            key={tabKey}
            style={{
              ...styles.nav,
              background: tab === tabKey ? "rgba(220,38,38,0.1)" : "transparent",
              border: "none",
              borderRadius: 8,
              color: tab === tabKey ? "#ef4444" : "#64748b",
              borderLeft: tab === tabKey ? "3px solid #ef4444" : "3px solid transparent",
              boxShadow: tab === tabKey ? "0 0 16px rgba(220,38,38,0.12)" : "none",
              textShadow: "none"
            }}
            onClick={() => setTab(tabKey)}
          >
            {tr(trendsLang, `nav.${tabKey}`)}
          </button>
        ))}
      </aside>

      <main
        style={{
          ...styles.main,
          display:"flex",
          flexDirection:"column"
        }}
      >
        {showOnboarding && (
          <div style={styles.onboardingOverlay}>
            <div style={styles.onboardingCard}>
              <div style={styles.BrandText}>
                <img
                  src={logo}
                  alt="logo"
                  style={{ width:90, marginBottom:20 }}
                />

                <h1>Welcome to GrowthPILOT</h1>
              </div>
              <p style={{color:"#94a3b8"}}>
                Your AI content operating system is ready.
              </p>

              <div style={styles.onboardingSteps}>
                <div>1. Define your niche</div>
                <div>2. Create your first project</div>
                <div>3. Generate strategic content</div>
              </div>

              <button
                style={styles.button}
                onClick={completeOnboarding}
              >
                START BUILDING
              </button>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
          >
        {loading && (
          <div style={styles.loaderOverlay}>
            <div style={styles.loaderCard}>
              <div
                style={{
                  ...styles.loaderPulse,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflowY: "hidden",
                  overflowX: "hidden",
                  background: "rgba(255,255,255,0.04)"
                }}
              >
                <img
                  src={logo}
                  alt="GrowthPilot"
                  style={{
                    width: "112px",
                    height: "112px",
                    objectFit: "contain"
                  }}
                />
              </div>

              <h2 style={{ marginBottom: "20px" }}>
                GrowthPilot AI
              </h2>

              <div
                style={{
                  color: "#d4d4d8",
                  fontSize: "15px",
                  minHeight: "24px",
                  marginBottom: "20px",
                  textAlign: "center"
                }}
              >
                {aiSteps[aiStep]}
              </div>

              <div
                style={{
                  width: "100%",
                  height: "6px",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "999px",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    width: `${((aiStep + 1) / aiSteps.length) * 100}%`,
                    height: "calc(100vh - 60px)",
                    overflow: "hidden",
                    background:
                      "linear-gradient(90deg, #7c3aed, #4f46e5)",
                    transition: "width 1s ease"
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {tab==="home" && (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              gap: 6,
              overflow: "hidden"
            }}
          >
            {pageHeader("home")}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                gap: 6
              }}
            >
              {[
                ["create", "Generate strategic authority content"],
                ["dashboard", "Monitor performance metrics"],
                ["memory", "Train your brand intelligence"],
                ["scheduler", "Plan publishing windows"],
                ["autopost", "Automate deployment"],
                ["analyze", "Audit and optimize posts"],
                ["planner", "Build campaign roadmaps"],
                ["publish", "Launch instantly"],
                ["team", "Coordinate execution"]
              ].map(([key, desc]) => (
                <motion.div
                  key={key}
                  whileHover={{
                    y: -6,
                    borderColor: "#dc2626",
                    boxShadow: "0 0 18px rgba(220,38,38,0.12)"
                  }}
                  onClick={() => setTab(key)}
                  style={{
                    ...styles.card,
                    marginTop: 0,
                    padding: "12px 16px",
                    cursor: "pointer",
                  }}
                >
                  <h2
                    style={{
                      marginBottom: 8,
                      fontSize: 15,
                      color: "#ef4444",
                      textShadow: "none",
                      letterSpacing: "1.5px"
                    }}
                  >
                    {key.toUpperCase()}
                  </h2>

                  <p style={{ color: "#d4d4d8" }}>
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div
              style={{
                ...styles.card,
                marginTop: 4,
                padding: "16px 20px",
              }}
            >
              <h2
                style={{
                  color: "#ef4444",
                  textShadow: "none",
                  letterSpacing: "1.5px"
                }}
              >
                READY FOR DEPLOYMENT
              </h2>

              <p style={{ marginTop: 15 }}>
                Create, optimize and publish authority content
                through a single high-performance command center.
              </p>

              <button
                style={{
                  ...styles.button
                }}
                onClick={() => setTab("create")}
              >
                START MISSION
              </button>
            </div>
          </div>
        )}
        {tab==="dashboard" && (
          <div
            style={{
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 18
            }}
          >
            {pageHeader("dashboard")}

            {/* KPI */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5,1fr)",
                gap: 12
              }}
            >
              {[
                ["POSTS", animatedStats.posts],
                ["PROJECTS", animatedStats.projects],
                ["PUBLISHED", animatedStats.published],
                ["AVG SCORE", animatedStats.avgScore],
                ["STREAK", animatedStats.streak]
              ].map(([label, value], i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  style={{
                    ...styles.card,
                    padding: 18,
                    height: 120,
                    marginTop: 0
                  }}
                >
                  <h3 style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:12 }}>{label}</h3>
                  <h1 style={{ color:"#ef4444", fontSize:32, fontWeight:800 }}>{value}</h1>
                </motion.div>
              ))}
            </div>

            {/* Middle */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.35fr 1fr",
                gap: 14
              }}
            >
              <div
                style={{
                  ...styles.card,
                  height: 170,
                  marginTop: 0,
                  overflow: "hidden"
                }}
              >
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:10 }}>LIVE AI ACTIVITY</h3>

                {liveFeed.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0"
                    }}
                  >
                    <span>{item.text}</span>
                    <span>{item.time}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  ...styles.card,
                  height: 170,
                  marginTop: 0,
                  overflow: "hidden"
                }}
              >
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:10 }}>PUBLISH TIMELINE</h3>

                {timelineData.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0"
                    }}
                  >
                    <span style={{ color:"#94a3b8" }}>{item.platform}</span>
                    <span style={{
                      color: item.status === "Published" ? "#22c55e"
                           : item.status === "Queued" ? "#f59e0b"
                           : item.status === "Optimizing" ? "#3b82f6"
                           : "#64748b",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.5px"
                    }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div
              style={{
                ...styles.card,
                marginTop: 0,
                height: 200,
                paddingBottom: 24
              }}
            >
              <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:10 }}>CONTENT PERFORMANCE</h3>

              <ResponsiveContainer width="100%" height="72%">
                <LineChart
                  data={growthData}
                  margin={{ top: 25, right: 25, left: 10, bottom: 20 }}
                >
                  <CartesianGrid
                    stroke="rgba(220,38,38,0.025)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="day"
                    stroke="#475569"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="#475569"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#050505",
                      border: "1px solid rgba(220,38,38,.25)",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      boxShadow: "0 8px 30px rgba(0,0,0,.45)"
                    }}
                  />

                  <Line
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(220,38,38,.45))"
                    }}
                    type="monotone"
                    dataKey="score"
                    stroke="#dc2626"
                    strokeWidth={4}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#dc2626"
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {tab === "create" && (
          <>
            {pageHeader("create")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 160px)" }}>

              {/* Colonne gauche — formulaire */}
              <div style={{ overflowY:"auto", paddingRight:8, display:"flex", flexDirection:"column", gap:8 }}>
                {saveStatus && <div style={styles.card}>{saveStatus}</div>}
                <input style={styles.input} placeholder="PROJECT TITLE" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
                <input style={styles.input} placeholder="SEARCH PROJECT" value={searchProject} onChange={(e) => setSearchProject(e.target.value)} />
                <select style={{ ...styles.input, maxWidth:"100%", width:"100%", boxSizing:"border-box" }} value={selectedProject} onChange={(e) => selectProject(e.target.value)}>
                  <option value="">SELECT PROJECT</option>
                  {filteredProjects.map((p) => (
                    <option key={p.name}>{p.name}</option>
                  ))}
                </select>
                <input style={styles.input} placeholder="RENAME PROJECT" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  <button style={{ ...styles.button, margin:0 }} onClick={renameProject}>RENAME</button>
                  <button style={{ ...styles.button, margin:0 }} onClick={createProject}>CREATE PROJECT</button>
                  <button style={{ ...styles.button, margin:0 }} onClick={duplicateProject}>DUPLICATE</button>
                  <button style={{ ...styles.buttonDanger, margin:0 }} onClick={() => selectedProject && deleteProject(selectedProject)}>DELETE</button>
                </div>
                <input style={styles.input} placeholder="TOPIC" value={topic} onChange={(e) => setTopic(e.target.value)} />
                <button style={{ ...styles.button, margin:0, alignSelf:"flex-start" }} disabled={loading} onClick={generate}>
                  {loading ? "AI WRITING..." : "GENERATE"}
                </button>
              </div>

              {/* Colonne droite — résultat */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflow:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>OUTPUT</h3>
                <textarea
                  style={{ ...styles.textarea, height:280, minHeight:"unset", flex:"none", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", resize:"none", background:"#0f172a", overflowY:"auto" }}
                  placeholder="Your generated content will appear here..."
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                />
                {post && (
                  <>
                    <div style={{ display:"flex", gap:8, color:"#64748b", fontSize:12 }}>
                      <span>{postMetrics.words} words</span>
                      <span>·</span>
                      <span>{postMetrics.chars} chars</span>
                      <span>·</span>
                      <span>{postMetrics.readTime} min read</span>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {[[tr(trendsLang, "buttons.save"),savePost],[tr(trendsLang, "buttons.draft"),saveDraft],[tr(trendsLang, "buttons.copy"),copyPost],[tr(trendsLang, "buttons.export"),exportPost],[tr(trendsLang, "buttons.analyze"),analyze],[tr(trendsLang, "buttons.plan"),generatePlanner]].map(([label,fn])=>(
                        <button key={label} style={{ ...styles.button, margin:0, fontSize:12, padding:"10px 14px" }} onClick={fn}>{label}</button>
                      ))}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {[["VIRAL","viral"],["AUTHORITY","authority"],["STORY","story"],["HOOK","hook"],["SHORT","short"],["CTA","cta"]].map(([label,mode])=>(
                        <button key={label} style={{ ...styles.buttonSecondary, margin:0, fontSize:12, padding:"10px 14px" }} onClick={()=>rewrite(mode)}>{label}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>
          </>
        )}
        {tab === "insights" && (
          <>
            {pageHeader("insights")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 160px)" }}>

              {/* Colonne gauche */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    ["BEST PROJECT", insights.bestProject, "#ef4444"],
                    ["TOP PLATFORM", insights.topPlatform, "#3b82f6"],
                    ["CADENCE", insights.cadence, "#f59e0b"],
                    ["AVG SCORE", "87", "#22c55e"],
                  ].map(([label,val,color])=>(
                    <div key={label} style={{ ...styles.card, marginTop:0, padding:16 }}>
                      <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{label}</div>
                      <div style={{ color, fontSize:18, fontWeight:800 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* AI Recommendation */}
                <div style={{ ...styles.card, marginTop:0, padding:20, borderLeft:"3px solid #3b82f6", flex:1 }}>
                  <div style={{ color:"#3b82f6", fontSize:11, letterSpacing:"1.5px", marginBottom:12 }}>⚡ AI RECOMMENDATION</div>
                  <p style={{ color:"#94a3b8", fontSize:14, lineHeight:1.8 }}>{insights.recommendation}</p>
                  <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
                    {[
                      "Post 3x per week on LinkedIn for maximum reach",
                      "Use hook-first format to boost engagement",
                      "Add a CTA to every post to drive conversions",
                      "Repurpose top posts on Threads and X"
                    ].map((tip,i)=>(
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <span style={{ color:"#ef4444", fontSize:12, marginTop:2 }}>▸</span>
                        <span style={{ color:"#64748b", fontSize:13 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colonne droite — performance */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:16 }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>PLATFORM PERFORMANCE</h3>
                {[
                  { platform:"LinkedIn", score:87, color:"#0077b5" },
                  { platform:"X (Twitter)", score:72, color:"#1da1f2" },
                  { platform:"Threads", score:64, color:"#a855f7" },
                ].map((p,i)=>(
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ color:"#94a3b8", fontSize:13 }}>{p.platform}</span>
                      <span style={{ color:p.color, fontSize:13, fontWeight:700 }}>{p.score}/100</span>
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:4, height:6 }}>
                      <div style={{ width:`${p.score}%`, height:"100%", borderRadius:4, background:p.color }} />
                    </div>
                  </div>
                ))}

                <div style={{ marginTop:8, borderTop:"1px solid rgba(220,38,38,0.1)", paddingTop:16 }}>
                  <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:12 }}>GROWTH SIGNALS</h3>
                  {[
                    { signal:"Engagement rate", value:"+12%", color:"#22c55e" },
                    { signal:"Reach", value:"+8%", color:"#22c55e" },
                    { signal:"Click-through", value:"-3%", color:"#ef4444" },
                    { signal:"Follower growth", value:"+5%", color:"#22c55e" },
                  ].map((g,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ color:"#64748b", fontSize:13 }}>{g.signal}</span>
                      <span style={{ color:g.color, fontSize:13, fontWeight:700 }}>{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}
        {tab === "history" && (
          <>
            {pageHeader("history")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 160px)" }}>

              {/* Colonne gauche — actions */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <button style={{ ...styles.button, margin:0, alignSelf:"flex-start" }} onClick={loadHistory}>LOAD HISTORY</button>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>TOTAL POSTS</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{history.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>PROJECTS</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{projects.length}</div>
                  </div>
                </div>
                <div style={{ ...styles.card, marginTop:0, flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <p style={{ color:"#334155", fontSize:13, textAlign:"center" }}>Click LOAD HISTORY to fetch your saved posts from the server.</p>
                </div>
              </div>

              {/* Colonne droite — liste */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>CONTENT HISTORY</h3>
                {history.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>No history loaded yet.</p>
                )}
                {history.map((h,i)=>(
                  <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12, cursor:"pointer" }}
                    onClick={()=>{ setPost(h.content); setTab("create"); }}>
                    <div style={{ color:"#ef4444", fontSize:12, fontWeight:700, marginBottom:4 }}>{h.title || "Untitled"}</div>
                    <p style={{ color:"#94a3b8", fontSize:12, lineHeight:1.5 }}>{h.content?.slice(0,120)}...</p>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}
        {tab==="profile" && (
        <>
          {pageHeader("profile")}
          <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:20, height:"calc(100vh - 160px)" }}>

            {/* Sidebar gauche — navigation */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

              {/* Plan badge */}
              <div style={{ ...styles.card, marginTop:0, padding:16, borderLeft:"3px solid #f59e0b", marginBottom:8 }}>
                <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:6 }}>CURRENT PLAN</div>
                <div style={{ color:"#f59e0b", fontSize:18, fontWeight:900, letterSpacing:"1px" }}>⚡ PREMIUM</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ color:"#ef4444", fontSize:20, fontWeight:800 }}>{projects.length}</div>
                    <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px" }}>PROJECTS</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ color:"#22c55e", fontSize:20, fontWeight:800 }}>{stats.posts}</div>
                    <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px" }}>POSTS</div>
                  </div>
                </div>
              </div>

              {/* Menu navigation */}
              {[
                { key:"account", icon:"👤", label:"Account Info" },
                { key:"password", icon:"🔐", label:"Change Password" },
                { key:"email", icon:"✉️", label:"Change Email" },
                { key:"danger", icon:"⚠️", label:"Danger Zone" },
              ].map(s => (
                <button
                  key={s.key}
                  style={{ padding:"12px 16px", borderRadius:8, background: profileSection === s.key ? "rgba(220,38,38,0.1)" : "transparent", border:"none", borderLeft: profileSection === s.key ? "3px solid #ef4444" : "3px solid transparent", color: profileSection === s.key ? "#ef4444" : "#64748b", fontWeight:700, fontSize:13, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10 }}
                  onClick={() => { setProfileSection(s.key); setProfileMsg({ type:"", text:"" }); }}
                >
                  <span>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>

            {/* Colonne droite — contenu */}
            <div style={{ ...styles.card, marginTop:0, padding:32, overflowY:"auto" }}>

              {/* Message feedback */}
              {profileMsg.text && (
                <div style={{ padding:"12px 16px", borderRadius:8, marginBottom:20, background: profileMsg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(220,38,38,0.1)", border:`1px solid ${profileMsg.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}`, color: profileMsg.type === "success" ? "#22c55e" : "#ef4444", fontSize:13, fontWeight:600 }}>
                  {profileMsg.text}
                </div>
              )}

              {/* Account Info */}
              {profileSection === "account" && (
                <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                  <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>Account Information</h2>
                  <div style={{ display:"grid", gap:16 }}>
                    {[
                      { label:"Email", value: token && token !== "guest" ? (() => { try { return JSON.parse(atob(token.split(".")[1])).email; } catch { return "—"; } })() : "—" },
                      { label:"Member since", value:"May 2026" },
                      { label:"Workspace", value: workspace || "PERSONAL" },
                      { label:"Plan", value:"PREMIUM" },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ padding:"16px 20px", background:"#0f172a", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", borderLeft:"3px solid rgba(220,38,38,0.4)" }}>
                        <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:6 }}>{label.toUpperCase()}</div>
                        <div style={{ color:"#fff", fontSize:14, fontWeight:600 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Change Password */}
              {profileSection === "password" && (
                <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
                  <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>Change Password</h2>
                  <p style={{ color:"#64748b", fontSize:13, margin:0 }}>Your password must be at least 8 characters long.</p>
                  {[
                    { label:"Current Password", value:currentPassword, setter:setCurrentPassword },
                    { label:"New Password", value:newPassword, setter:setNewPassword },
                    { label:"Confirm New Password", value:confirmPassword, setter:setConfirmPassword },
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{label.toUpperCase()}</div>
                      <input
                        type="password"
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        style={{ ...styles.input, maxWidth:"100%", marginBottom:0 }}
                      />
                    </div>
                  ))}
                  <button
                    style={{ ...styles.button, margin:0, opacity: profileLoading ? 0.6 : 1 }}
                    onClick={changePassword}
                    disabled={profileLoading}
                  >
                    {profileLoading ? "Updating..." : "🔐 UPDATE PASSWORD"}
                  </button>
                </div>
              )}

              {/* Change Email */}
              {profileSection === "email" && (
                <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
                  <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>Change Email Address</h2>
                  <p style={{ color:"#64748b", fontSize:13, margin:0 }}>Enter your new email address below.</p>
                  <div>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>CURRENT EMAIL</div>
                    <div style={{ padding:"14px 18px", background:"#0f172a", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", color:"#94a3b8", fontSize:14 }}>
                      {token && token !== "guest" ? (() => { try { return JSON.parse(atob(token.split(".")[1])).email; } catch { return "—"; } })() : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>NEW EMAIL ADDRESS</div>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      style={{ ...styles.input, maxWidth:"100%", marginBottom:0 }}
                    />
                  </div>
                  <button
                    style={{ ...styles.button, margin:0, opacity: profileLoading ? 0.6 : 1 }}
                    onClick={changeEmailAddress}
                    disabled={profileLoading}
                  >
                    {profileLoading ? "Updating..." : "✉️ UPDATE EMAIL"}
                  </button>
                </div>
              )}

              {/* Danger Zone */}
              {profileSection === "danger" && (
                <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
                  <h2 style={{ color:"#ef4444", fontSize:18, fontWeight:800, margin:0 }}>⚠️ Danger Zone</h2>
                  <p style={{ color:"#64748b", fontSize:13, margin:0 }}>These actions are irreversible. Please proceed with caution.</p>
                  <div style={{ padding:24, border:"1px solid rgba(220,38,38,0.3)", borderRadius:12, background:"rgba(220,38,38,0.05)" }}>
                    <div style={{ color:"#fff", fontWeight:700, marginBottom:8 }}>Delete Account</div>
                    <div style={{ color:"#64748b", fontSize:13, marginBottom:16 }}>Permanently delete your account and all associated data. This action cannot be undone.</div>
                    <button
                      style={{ ...styles.buttonDanger, margin:0 }}
                      onClick={() => { if(window.confirm("Are you sure? This action is irreversible.")) deleteAccount(); }}
                    >
                      🗑️ DELETE MY ACCOUNT
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
        )}
        {tab === "memory" && (
          <>
            {pageHeader("memory")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 160px)" }}>

              {/* Colonne gauche — formulaire */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <input style={styles.input} placeholder="NICHE" value={memory.niche} onChange={(e)=>setMemory({...memory,niche:e.target.value})} />
                <input style={styles.input} placeholder="AUDIENCE" value={memory.audience} onChange={(e)=>setMemory({...memory,audience:e.target.value})} />
                <input style={styles.input} placeholder="TONE OF VOICE" value={memory.tone} onChange={(e)=>setMemory({...memory,tone:e.target.value})} />
                <input style={styles.input} placeholder="DEFAULT CTA" value={memory.cta} onChange={(e)=>setMemory({...memory,cta:e.target.value})} />
                <input style={styles.input} placeholder="BANNED WORDS (comma separated)" value={memory.banned_words} onChange={(e)=>setMemory({...memory,banned_words:e.target.value})} />
                <button style={{ ...styles.button, margin:0, alignSelf:"flex-start" }} onClick={saveBrandMemory}>SAVE MEMORY</button>
              </div>

              {/* Colonne droite — récap brand */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:16 }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>BRAND INTELLIGENCE</h3>
                {[
                  ["NICHE", memory.niche],
                  ["AUDIENCE", memory.audience],
                  ["TONE", memory.tone],
                  ["CTA", memory.cta],
                  ["BANNED WORDS", memory.banned_words],
                ].map(([label, value]) => (
                  <div key={label} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:4 }}>{label}</div>
                    <div style={{ color: value ? "#fff" : "#334155", fontSize:14 }}>{value || "Not defined"}</div>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}
        {tab==="analyze" && (
          <>
            {pageHeader("content analytics")}

            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(3,1fr)",
              gap:10,
              marginBottom:10
            }}>
              {[
                ["SCORE", analysis?.score || 87],
                ["HOOK", analysis?.hookScore || 82],
                ["VIRALITY", analysis?.viralScore || 79],
                ["CLARITY", analysis?.clarityScore || 91],
                ["CTA", analysis?.ctaScore || 76],
                ["READABILITY", analysis?.readability || 88]
              ].map(([label,value],i)=>(
                <div
                  key={i}
                  style={{
                    ...styles.card,
                    border:`2px solid ${metricColor(value)}`,
                    padding:"10px 16px",
                    minHeight:68
                  }}
                >
                  <h3 style={{
                    fontSize:10,
                    letterSpacing:"1.8px",
                    color:"#64748b",
                    marginBottom:10
                  }}>
                    {label}
                  </h3>

                  <h2 style={{
                    color:metricColor(value),
                    fontSize:20,
                    fontWeight:900
                  }}>
                    {value}
                  </h2>
                </div>
              ))}
            </div>

            <div style={{
              ...styles.card,
              padding:"10px 16px"
            }}>
              <h3 style={{
                color:"#ef4444",
                fontSize:12,
                letterSpacing:"1.5px",
                marginBottom:18
              }}>
                AI FEEDBACK
              </h3>

              <div style={{
                display:"grid",
                gridTemplateColumns:"1fr 0.95fr",
                gap:12,
                alignItems:"stretch"
              }}>

                <div style={{
                  background:"rgba(255,255,255,0.02)",
                  borderRadius:14,
                  padding:18,
                  border:"1px solid rgba(220,38,38,0.08)"
                }}>
                  <h4 style={{
                    color:"#fff",
                    marginBottom:14
                  }}>
                    Strategic Insight
                  </h4>

                  <p style={{
                    color:"#94a3b8",
                    lineHeight:1.7,
                    fontSize:14
                  }}>
                    {analysis?.feedback ||
                      "Strong structure. Improve emotional hook for higher engagement."}
                  </p>

                  <div style={{
                    display:"flex",
                    gap:8,
                    marginTop:18,
                    flexWrap:"wrap"
                  }}>
                    <span style={styles.feedbackGood}>HOOK STRONG</span>
                    <span style={styles.feedbackWarn}>CTA WEAK</span>
                    <span style={styles.feedbackGood}>READABLE</span>
                  </div>
                </div>

                <div style={{
                  ...styles.chartCard,
                  marginTop:0,
                  minHeight:150,
                  padding:14
                }}>
                  <h3 style={{
                    color:"#ef4444",
                    fontSize:11,
                    letterSpacing:"1.5px",
                    marginBottom:10
                  }}>
                    PLATFORM DISTRIBUTION
                  </h3>

                  <ResponsiveContainer width="100%" height={135}>
                    <BarChart data={platformData}>
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>
          </>
        )}
        {tab==="scheduler" && (
          <>
            {pageHeader("scheduler")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 160px)" }}>

              {/* Colonne gauche — formulaire */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px", marginBottom:4 }}>SELECT DATE</p>
                <input style={styles.input} type="date" value={scheduleDate} onChange={(e)=>setScheduleDate(e.target.value)} />
                <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px", marginBottom:4 }}>SELECT TIME</p>
                <input style={styles.input} type="time" value={scheduleTime} onChange={(e)=>setScheduleTime(e.target.value)} />
                <button style={{ ...styles.button, margin:0, alignSelf:"flex-start", marginTop:8 }} onClick={schedulePost}>SCHEDULE POST</button>

                {/* Stats rapides */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16 }}>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>SCHEDULED</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{scheduledPosts.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>PUBLISHED</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
                  </div>
                </div>
              </div>

              {/* Colonne droite — queue */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>PUBLISH QUEUE</h3>
                {scheduledPosts.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>No posts scheduled yet.</p>
                )}
                {scheduledPosts.map((s,i)=>(
                  <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ color:"#ef4444", fontSize:12, fontWeight:700 }}>{s.date} · {s.time}</span>
                      <span style={{ color:"#22c55e", fontSize:11, fontWeight:700 }}>SCHEDULED</span>
                    </div>
                    <p style={{ color:"#94a3b8", fontSize:13 }}>{s.content}</p>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}
        {tab==="autopost" && (
          <>
            {pageHeader("autopost")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 160px)" }}>

              {/* Colonne gauche */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px" }}>SELECT PLATFORM</p>
                <div style={{ display:"flex", gap:10 }}>
                  {["LINKEDIN","X","THREADS"].map(p=>(
                    <button key={p} onClick={()=>setAutoPlatform(p)} style={{
                      ...styles.button, margin:0,
                      background: autoPlatform===p ? "linear-gradient(135deg,#dc2626,#991b1b)" : "transparent",
                      border: autoPlatform===p ? "none" : "1px solid rgba(220,38,38,0.3)",
                      color: autoPlatform===p ? "#fff" : "#ef4444",
                      boxShadow: autoPlatform===p ? "0 4px 16px rgba(220,38,38,0.35)" : "none"
                    }}>{p}</button>
                  ))}
                </div>

                <button style={{ ...styles.button, margin:0, alignSelf:"flex-start", marginTop:8 }} onClick={autoPublish}>QUEUE POST</button>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>QUEUED</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{autoPosts.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>PUBLISHED</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
                  </div>
                </div>
              </div>

              {/* Colonne droite — queue */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>AUTO QUEUE</h3>
                {autoPosts.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>No posts queued yet.</p>
                )}
                {autoPosts.map((p,i)=>(
                  <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ color:"#ef4444", fontSize:12, fontWeight:700 }}>{p.platform}</span>
                      <span style={{ color: p.status==="Published" ? "#22c55e" : "#f59e0b", fontSize:11, fontWeight:700 }}>{p.status}</span>
                    </div>
                    <p style={{ color:"#94a3b8", fontSize:13 }}>{p.content}</p>
                    <p style={{ color:"#475569", fontSize:11, marginTop:4 }}>{p.date}</p>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}
        {tab==="planner" && (
          <>
            {pageHeader("planner")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 160px)" }}>

              {/* Colonne gauche — infos */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                  <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>HOW TO USE</div>
                  <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.6 }}>Go to <span style={{ color:"#ef4444", fontWeight:700 }}>CREATE</span>, generate a post, then click <span style={{ color:"#ef4444", fontWeight:700 }}>PLAN</span> to auto-generate a 30-day content roadmap based on your topic.</p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>PLANNED POSTS</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{planner.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>SCHEDULED</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{scheduledPosts.length}</div>
                  </div>
                </div>
              </div>

              {/* Colonne droite — plan */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:10, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>30-DAY ROADMAP</h3>
                {planner.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>No plan generated yet.</p>
                )}
                {planner.map((p,i)=>(
                  <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:10 }}>
                    <div style={{ color:"#ef4444", fontSize:11, fontWeight:700, marginBottom:4 }}>DAY {i+1}</div>
                    <p style={{ color:"#94a3b8", fontSize:13 }}>{p}</p>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}
        {tab==="publish" && (
          <>
            {pageHeader("publish center")}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 160px)" }}>

              {/* Colonne gauche */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px" }}>SELECT PLATFORM & PUBLISH</p>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {["LINKEDIN","X","THREADS"].map(p=>(
                    <button key={p} style={{ ...styles.button, margin:0 }} onClick={()=>publish(p)}>{p}</button>
                  ))}
                </div>

                {publishStatus && (
                  <div style={{ ...styles.card, marginTop:0, padding:"12px 16px", borderLeft:"3px solid #22c55e" }}>
                    <span style={{ color:"#22c55e", fontSize:13 }}>✓ {publishStatus}</span>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>PUBLISHED</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>QUEUED</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{autoPosts.length}</div>
                  </div>
                </div>

                {/* Aperçu du post */}
                <div style={{ ...styles.card, marginTop:0, flex:1 }}>
                  <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:12 }}>POST PREVIEW</h3>
                  <p style={{ color: post ? "#94a3b8" : "#334155", fontSize:13, lineHeight:1.6 }}>
                    {post ? post.slice(0, 300) + (post.length > 300 ? "..." : "") : "No content generated yet. Go to CREATE to generate a post."}
                  </p>
                </div>
              </div>

              {/* Colonne droite — publish log */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>PUBLISH LOG</h3>
                {publishLog.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>No publications yet.</p>
                )}
                {publishLog.map((p,i)=>(
                  <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ color:"#ef4444", fontSize:12, fontWeight:700 }}>{p.dest}</span>
                      <span style={{ color:"#22c55e", fontSize:11, fontWeight:700 }}>PUBLISHED</span>
                    </div>
                    <p style={{ color:"#475569", fontSize:11 }}>{p.date}</p>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}
        {tab==="team" && (
          <>
            {pageHeader("team")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 160px)" }}>

              {/* Colonne gauche — membres + stats */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {[
                    ["PROJECTS", projects.length, "#ef4444"],
                    ["QUEUED", autoPosts.length, "#f59e0b"],
                    ["SCHEDULED", scheduledPosts.length, "#22c55e"],
                  ].map(([label, val, color])=>(
                    <div key={label} style={{ ...styles.card, marginTop:0, padding:14 }}>
                      <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>{label}</div>
                      <div style={{ color, fontSize:26, fontWeight:800, marginTop:6 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Workspace */}
                <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                  <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>WORKSPACE</div>
                  <div style={{ color:"#ef4444", fontSize:18, fontWeight:800 }}>{workspace || "PERSONAL"}</div>
                </div>

                {/* Membres simulés */}
                <div style={{ ...styles.card, marginTop:0, flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                  <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:4 }}>TEAM MEMBERS</h3>
                  {[
                    { name:"You", role:"ADMIN", status:"online", color:"#22c55e" },
                    { name:"Content Writer", role:"EDITOR", status:"idle", color:"#f59e0b" },
                    { name:"Social Manager", role:"PUBLISHER", status:"offline", color:"#475569" },
                  ].map((m,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(220,38,38,0.08)", paddingBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:m.color }} />
                        <div>
                          <div style={{ color:"#fff", fontSize:13, fontWeight:600 }}>{m.name}</div>
                          <div style={{ color:"#64748b", fontSize:11 }}>{m.role}</div>
                        </div>
                      </div>
                      <span style={{ color:m.color, fontSize:11, fontWeight:700 }}>{m.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colonne droite — activité */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>TEAM ACTIVITY</h3>
                {[
                  { user:"You", action:"Generated post", time:"just now", color:"#22c55e" },
                  { user:"Content Writer", action:"Saved draft", time:"5 min ago", color:"#f59e0b" },
                  { user:"You", action:"Scheduled LinkedIn post", time:"12 min ago", color:"#22c55e" },
                  { user:"Social Manager", action:"Published to Threads", time:"1 hr ago", color:"#3b82f6" },
                  { user:"Content Writer", action:"Analyzed post", time:"2 hr ago", color:"#f59e0b" },
                ].map((a,i)=>(
                  <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.08)", paddingBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ color:a.color, fontSize:12, fontWeight:700 }}>{a.user}</span>
                      <span style={{ color:"#475569", fontSize:11 }}>{a.time}</span>
                    </div>
                    <p style={{ color:"#94a3b8", fontSize:13 }}>{a.action}</p>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}

        {tab==="trends" && (
          <>
            {pageHeader("trends")}

            {/* Niche selector */}
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              {[
                { key:"ai", label:"🤖 AI" },
                { key:"saas", label:"💼 SaaS" },
                { key:"marketing", label:"📣 Marketing" },
                { key:"finance", label:"💰 Finance" },
                { key:"leadership", label:"🎯 Leadership" },
                { key:"tech", label:"⚡ Tech" },
              ].map(n => (
                <button
                  key={n.key}
                  style={{
                    padding:"8px 16px",
                    borderRadius:20,
                    border: trendsNiche === n.key ? "none" : "1px solid rgba(220,38,38,0.3)",
                    background: trendsNiche === n.key ? "linear-gradient(135deg,#dc2626,#991b1b)" : "transparent",
                    color: trendsNiche === n.key ? "white" : "#64748b",
                    fontWeight:700,
                    fontSize:12,
                    cursor:"pointer",
                    letterSpacing:"0.5px",
                  }}
                  onClick={() => { setTrendsNiche(n.key); fetchTrends(n.key, trendsLang); }}
                >
                  {n.label}
                </button>
              ))}
              <button
                style={{ padding:"8px 20px", borderRadius:20, background:"linear-gradient(135deg,#4f46e5,#7c3aed)", border:"none", color:"white", fontWeight:800, fontSize:12, cursor:"pointer", marginLeft:"auto" }}
                onClick={() => fetchTrends(trendsNiche, trendsLang)}
                disabled={trendsLoading}
              >
                {trendsLoading ? tr(trendsLang, "buttons.loading") : tr(trendsLang, "buttons.refresh")}
              </button>
            </div>

            {/* Sources status */}
            {Object.keys(trendsSources).length > 0 && (
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {Object.entries(trendsSources).map(([src, count]) => (
                  <div key={src} style={{ padding:"4px 10px", borderRadius:6, background: count > 0 ? "rgba(34,197,94,0.1)" : "rgba(71,85,105,0.1)", border:`1px solid ${count > 0 ? "rgba(34,197,94,0.3)" : "rgba(71,85,105,0.2)"}`, fontSize:11, color: count > 0 ? "#22c55e" : "#475569", fontWeight:600 }}>
                    {count > 0 ? "✓" : "○"} {src} {count > 0 ? `(${count})` : ""}
                  </div>
                ))}
              </div>
            )}

            {/* Trends list */}
            {trends.length === 0 && !trendsLoading && (
              <div style={{ ...styles.card, textAlign:"center", padding:40 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🌍</div>
                <div style={{ color:"#64748b", fontSize:14 }}>Select a niche and click REFRESH to load trends</div>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {trends.map((t, i) => (
                <div key={i} style={{ ...styles.card, marginTop:0, padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ fontSize:20, flexShrink:0 }}>{t.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#fff", fontSize:13, fontWeight:600, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ color:"#ef4444", fontSize:11, fontWeight:700 }}>{t.source}</span>
                      {t.engagement > 0 && <span style={{ color:"#475569", fontSize:11 }}>👥 {t.engagement.toLocaleString()}</span>}
                      {t.publishedAt && <span style={{ color:"#475569", fontSize:11 }}>{new Date(t.publishedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:6, padding:"4px 8px", fontSize:11, fontWeight:800, color:"#ef4444" }}>
                      {t.viralScore}
                    </div>
                    <button
                      style={{ padding:"6px 12px", borderRadius:8, background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", color:"white", fontSize:11, fontWeight:700, cursor:"pointer" }}
                      onClick={() => useAsTopic(t.title)}
                    >
                      USE →
                    </button>
                    <a href={t.url} target="_blank" rel="noopener noreferrer" style={{ padding:"6px 12px", borderRadius:8, background:"transparent", border:"1px solid rgba(220,38,38,0.3)", color:"#ef4444", fontSize:11, fontWeight:700, cursor:"pointer", textDecoration:"none" }}>
                      VIEW
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==="integrations" && (
          <>
            {pageHeader("integrations")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignContent:"start" }}>

              {/* LinkedIn */}
              <div style={{ ...styles.card, marginTop:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:"#0077b5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:"white" }}>in</div>
                  <div>
                    <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>LinkedIn</div>
                    <div style={{ color:"#64748b", fontSize:12 }}>Publish posts directly</div>
                  </div>
                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background: linkedinStatus.connected ? "#22c55e" : "#475569" }} />
                    <span style={{ color: linkedinStatus.connected ? "#22c55e" : "#475569", fontSize:11, fontWeight:700 }}>
                      {linkedinStatus.connected ? tr(trendsLang, "labels.connected") : tr(trendsLang, "labels.disconnected")}
                    </span>
                  </div>
                </div>

                {linkedinStatus.connected ? (
                  <>
                    <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#22c55e" }}>
                      ✓ Connected as <strong>{linkedinStatus.name}</strong>
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button
                        style={{ ...styles.button, margin:0, flex:1, opacity: linkedinPosting ? 0.6 : 1 }}
                        onClick={postToLinkedin}
                        disabled={linkedinPosting}
                      >
                        {linkedinPosting ? tr(trendsLang, "buttons.publishing") : tr(trendsLang, "buttons.postNow")}
                      </button>
                      <button
                        style={{ ...styles.buttonSecondary, margin:0 }}
                        onClick={disconnectLinkedin}
                      >
                        Disconnect
                      </button>
                    </div>
                    <p style={{ color:"#475569", fontSize:11, marginTop:10 }}>
                      ⚠️ Publishing requires LinkedIn approval (pending). Connection is active.
                    </p>
                  </>
                ) : (
                  <button style={{ ...styles.button, margin:0, width:"100%" }} onClick={connectLinkedin}>
                    🔗 CONNECT LINKEDIN
                  </button>
                )}
              </div>

              {/* Facebook / Instagram — coming soon */}
              {[
                { name:"Facebook", icon:"f", color:"#1877f2", sub:"Pages & Groups" },
                { name:"Instagram", icon:"📸", color:"#e1306c", sub:"Business account" },
                { name:"X (Twitter)", icon:"𝕏", color:"#1da1f2", sub:"Requires paid API" },
                { name:"TikTok", icon:"🎵", color:"#ff0050", sub:"Creator account" },
              ].map((p) => (
                <div key={p.name} style={{ ...styles.card, marginTop:0, opacity:0.5 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                    <div style={{ width:40, height:40, borderRadius:8, background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"white" }}>{p.icon}</div>
                    <div>
                      <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{p.name}</div>
                      <div style={{ color:"#64748b", fontSize:12 }}>{p.sub}</div>
                    </div>
                    <div style={{ marginLeft:"auto" }}>
                      <span style={{ color:"#475569", fontSize:11, fontWeight:700, background:"rgba(71,85,105,0.2)", padding:"4px 8px", borderRadius:4 }}>COMING SOON</span>
                    </div>
                  </div>
                  <button style={{ ...styles.buttonSecondary, margin:0, width:"100%", cursor:"not-allowed" }} disabled>
                    Coming Soon
                  </button>
                </div>
              ))}

            </div>
          </>
        )}

          </motion.div>
        </AnimatePresence>
        {toast && (
          <div style={styles.toast}>
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    height: "100vh",
    background: "#0f172a",
    color: "white",
  },
  sidebar:{
    width:240,
    padding:24,
    background:"#111827",
    borderRight:"1px solid rgba(220,38,38,.18)",
    boxShadow:"10px 0 40px rgba(0,0,0,.25)",
    height:"100vh",
    overflowY:"auto",
    boxSizing:"border-box",
    flexShrink:0,
    scrollbarWidth:"none",
    msOverflowStyle:"none"
  },
  main: {
    flex: 1,
    padding: "18px 22px",
    height: "100vh",
    overflowY: "auto",
    boxSizing: "border-box",
    minWidth: 0
  },
  title: {
    marginBottom: 30
  },
  nav: {
    display: "block",
    width: "100%",
    padding: 16,
    marginBottom: 12,
    borderRadius: 0,
    background: "#050505",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    letterSpacing: "1px",
    transition: "all 0.25s ease"
  },
  input:{
    display:"block",
    width:"100%",
    maxWidth:"520px",
    padding:"14px 18px",
    marginBottom:10,
    background:"#0f172a",
    borderRadius:10,
    border:"1px solid rgba(220,38,38,0.2)",
    borderLeft:"3px solid rgba(220,38,38,0.5)",
    color:"white",
    fontSize:"14px",
    outline:"none",
    letterSpacing:"0.5px"
  },
  formWrap:{
    maxWidth:"520px",
    display:"flex",
    flexDirection:"column",
    gap:4
  },
  button: {
    padding: "14px 22px",
    margin: 8,
    background: "linear-gradient(135deg, #dc2626, #991b1b)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
    letterSpacing: "1px",
    textShadow: "none",
    boxShadow: "0 4px 16px rgba(220,38,38,0.35)",
    transition: "all .25s ease"
  },
  buttonDanger:{
    padding:"14px 22px",
    margin:8,
    background:"linear-gradient(135deg,#7f1d1d,#450a0a)",
    color:"#fff",
    border:"1px solid rgba(220,38,38,0.3)",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:800,
    letterSpacing:"1px",
    boxShadow:"0 4px 16px rgba(127,29,29,0.4)"
  },
  buttonSecondary:{
    padding:"14px 22px",
    margin:8,
    background:"transparent",
    color:"#ef4444",
    border:"1px solid rgba(220,38,38,0.4)",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:700,
    textShadow:"none",
    transition:"all .25s ease"
  },
  card: {
    borderRadius: 12,
    background: "linear-gradient(145deg, #1a2235, #111827)",
    border: "1px solid rgba(220,38,38,0.25)",
    borderLeft: "3px solid #ef4444",
    padding: 24,
    marginTop: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(220,38,38,0.08)"
  },
  textarea: {
    width: "100%",
    minHeight: 300,
    background: "#0f172a",
    color: "white",
    padding: 20
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 20
  },
  brand: {
    display:"flex",
    alignItems:"center",
    gap:12,
    marginBottom:32,
    paddingTop:4
  },
  sidebarLogo: {
    width:36,
    height:36,
    objectFit:"contain",
    filter:"drop-shadow(0 0 12px rgba(99,102,241,.45))",
    flexShrink:0
  },
  homeHeader:{
    display:"flex",
    alignItems:"center",
    gap:18,
    marginBottom:8
  },
  homeLogo:{
    width:38,
    filter:"drop-shadow(0 0 10px rgba(220,38,38,.4))"
  },
  subtitle:{
    color:"#64748b",
    marginTop:4,
    fontSize:13
  },
  chartCard:{
    background:"linear-gradient(145deg, #1a2235, #111827)",
    padding:30,
    borderRadius:12,
    boxShadow:"0 4px 32px rgba(220,38,38,0.1)",
    marginTop:20,
    width:"100%",
    minHeight:170,
    overflow: "hidden",
    border:"1px solid rgba(220,38,38,0.2)",
    borderLeft: "3px solid #ef4444",
    flexShrink: 0
  },
  toast:{
    position:"fixed",
    bottom:30,
    right:30,
    background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
    color:"white",
    padding:"18px 26px",
    borderRadius:"18px",
    fontWeight:700,
    boxShadow:"0 20px 60px rgba(0,0,0,.35)",
    zIndex:9999,
    animation:"fadeIn .35s ease"
  },
  loaderOverlay:{
    position:"fixed",
    inset:0,
    background:"rgba(2,6,23,.85)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    zIndex:99999
  },

  loaderCard:{
    background:"#050505",
    borderRadius:0,
    border:"1px solid rgba(220,38,38,.15)",
    padding:"50px 70px",
    textAlign:"center",
    boxShadow:"0 20px 80px rgba(0,0,0,.5)"
  },
  loaderPulse:{
    width:80,
    height:80,
    borderRadius:"50%",
    margin:"0 auto 24px",
    background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
    animation:"pulse 1.4s infinite"
  },
  onboardingOverlay:{
    position:"fixed",
    inset:0,
    background:"rgba(2,6,23,.9)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    zIndex:999999
  },
  onboardingCard:{
    background:"#050505",
    borderRadius:0,
    border:"1px solid rgba(220,38,38,.15)",
    padding:"60px",
    width:"700px",
    textAlign:"center",
    boxShadow:"0 30px 100px rgba(0,0,0,.6)"
  },
  onboardingSteps:{
    display:"grid",
    gap:18,
    margin:"35px 0",
    textAlign:"left"
  },
  brandText:{
    display:"flex",
    alignItems:"center",
    gap:10,
    marginBottom:16,
    flexShrink:0
  },
  brandMini:{
    fontSize:"16px",
    fontWeight:900,
    fontStyle:"italic",
    color:"#000",
    WebkitTextStroke:"0.5px white",
    textShadow:"1px 1px 0 #ef4444",
    letterSpacing:"0.8px",
    lineHeight:"1",
    margin:0,
    whiteSpace:"nowrap"
  },
  feedbackGood:{
    padding:"8px 14px",
    borderRadius:999,
    fontSize:11,
    fontWeight:700,
    background:"rgba(34,197,94,0.12)",
    color:"#22c55e"
  },
  feedbackWarn:{
    padding:"8px 14px",
    borderRadius:999,
    fontSize:11,
    fontWeight:700,
    background:"rgba(245,158,11,0.12)",
    color:"#f59e0b"
  },
  };
