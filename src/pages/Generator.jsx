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
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem("gp_onboarded")
  );
  const [stats, setStats] = useState({
    posts: 0,
    projects: 0,
    published: 0,
    avgScore: 0,
    streak: 0
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
      showToast(tr(trendsLang, "messages.fetchTrendsFailed"));
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

  // ─── Données dérivées (pas de state — recalculées à chaque render) ─────────
  const growthData = [
    { day: "D-6", score: 0 }, { day: "D-5", score: 0 }, { day: "D-4", score: 0 },
    { day: "D-3", score: 0 }, { day: "D-2", score: 0 }, { day: "D-1", score: 0 },
    { day: "Today", score: stats.avgScore || 0 }
  ];

  // Re-fetch trends quand la langue change
  useEffect(() => {
    if (tab === "trends" && trends.length > 0) {
      fetchTrends(trendsNiche, trendsLang);
    }
  }, [trendsLang]);

  const useAsTopic = (title) => {
    setTab("create");
    setTopic(title.slice(0, 80));
    showToast(tr(trendsLang, "messages.topicImported"));
  };

  // LinkedIn state
  const [linkedinStatus, setLinkedinStatus] = useState({ connected: false, name: null });
  const [userPlan, setUserPlan] = useState({ plan: "Free", interval: null });

  useEffect(() => {
    if (token && token !== "guest") {
      fetch("https://social-ai-app-production.up.railway.app/stripe/status", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => setUserPlan(data))
        .catch(() => {});
    }
  }, [token]);

  const getPlanColor = (plan) => {
    if (plan === "Business") return "#a855f7";
    if (plan === "Pro") return "#ef4444";
    return "#475569";
  };

  const getPlanIcon = (plan) => {
    if (plan === "Business") return "🏢";
    if (plan === "Pro") return "⚡";
    return "🆓";
  };
  const [linkedinPosting, setLinkedinPosting] = useState(false);
  const [threadsStatus, setThreadsStatus] = useState({ connected: false, username: null });
  const [threadsPosting, setThreadsPosting] = useState(false);

  // ─── Données dérivées — après tous les states ──────────────────────────────
  const platformData = [
    { name:"LinkedIn", value: linkedinStatus.connected ? (stats.avgScore || 60) : 0 },
    { name:"X",        value: 0 },
    { name:"Threads",  value: threadsStatus.connected ? Math.max(0, (stats.avgScore || 50) - 15) : 0 },
  ];
  const timelineData = scheduledPosts.slice(0, 4).map(p => ({
    time: p.time || "—",
    platform: p.platform || "LinkedIn",
    status: "Scheduled"
  }));

  useEffect(() => {
    if (token && token !== "guest") {
      fetch("https://social-ai-app-production.up.railway.app/linkedin/status", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(setLinkedinStatus).catch(() => {});

      fetch("https://social-ai-app-production.up.railway.app/threads/status", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(setThreadsStatus).catch(() => {});
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
    if (params.get("threads") === "connected") {
      window.history.replaceState({}, "", "/");
      fetch("https://social-ai-app-production.up.railway.app/threads/status", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(setThreadsStatus).catch(() => {});
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
      if (data.success) showToast(tr(trendsLang, "messages.publishedLinkedin"));
      else showToast(tr(trendsLang, "messages.linkedinFailed"));
    } catch {
      showToast(tr(trendsLang, "messages.linkedinFailed"));
    } finally {
      setLinkedinPosting(false);
    }
  };

  const connectThreads = async () => {
    const res = await fetch("https://social-ai-app-production.up.railway.app/threads/connect", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const disconnectThreads = async () => {
    await fetch("https://social-ai-app-production.up.railway.app/threads/disconnect", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setThreadsStatus({ connected: false, username: null });
  };

  const postToThreads = async () => {
    if (!post) return;
    setThreadsPosting(true);
    try {
      const res = await fetch("https://social-ai-app-production.up.railway.app/threads/post", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: post })
      });
      const data = await res.json();
      if (data.success) showToast(tr(trendsLang, "buttons.publishedThreads"));
      else showToast(tr(trendsLang, "messages.threadsFailed"));
    } catch {
      showToast(tr(trendsLang, "messages.threadsFailed"));
    } finally {
      setThreadsPosting(false);
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
    tr(trendsLang, "ui.liveActivity1") || "Content generated",
    "Campaign strategy recalculated",
    "Content resonance boosted",
    "Hook structure refined",
    tr(trendsLang, "ui.aiRecommendation") || "AI analysis complete",
    tr(trendsLang, "ui.growthSignals") || "Growth signals updated"
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
  showToast(tr(trendsLang, "messages.workspaceReady"));
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
      avgScore: analysis?.score || 0,
      streak: history.length
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
    showToast(tr(trendsLang, "messages.projectSaved"));
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
    showToast(tr(trendsLang, "messages.projectDeleted"));

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
    showToast(tr(trendsLang, "messages.memoryUpdated")),
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

    showToast(tr(trendsLang, "messages.projectSaved"));

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
        campaign,
        project: selectedProject || null,
        lang: trendsLang,
      });

      await new Promise(resolve => setTimeout(resolve, 2800));

      const data = await dataPromise;

      if (data?.text) {
        setPost(data.text);
        showToast(tr(trendsLang, "messages.contentGenerated"));
      }

    } catch (error) {
      showToast(tr(trendsLang, "messages.generationFailed"));
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
    try {
      const data = await api("generate/rewrite", {
        text: post,
        mode,
        lang: trendsLang,
      });
      if (data?.text) setPost(data.text);
    } catch {
      showToast(tr(trendsLang, "messages.rewriteFailed"));
    } finally {
      setLoading(false);
    }
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
      showToast(tr(trendsLang, "messages.analysisComplete"));

    } catch (error) {
      showToast(tr(trendsLang, "messages.analysisFailed"));

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
    showToast(tr(trendsLang, "messages.copied"));

setTimeout(() => {
  setSaveStatus("");
}, 2000);
  };

  const publish = (dest) => {
    showToast(tr(trendsLang, "messages.published"));

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

                <h1>{tr(trendsLang, "ui.welcomeTitle")}</h1>
              </div>
              <p style={{color:"#94a3b8"}}>
                {tr(trendsLang, "ui.welcomeSub")}
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
                {tr(trendsLang, "ui.startBuilding")}
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
                ["create",    tr(trendsLang, "ui.qlCreate")],
                ["dashboard", tr(trendsLang, "ui.qlDashboard")],
                ["memory",    tr(trendsLang, "ui.qlMemory")],
                ["scheduler", tr(trendsLang, "ui.qlScheduler")],
                ["autopost",  tr(trendsLang, "ui.qlAutopost")],
                ["analyze",   tr(trendsLang, "ui.qlAnalyze")],
                ["planner",   tr(trendsLang, "ui.qlPlanner")],
                ["publish",   tr(trendsLang, "ui.qlPublish")],
                ["team",      tr(trendsLang, "ui.qlTeam")]
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
                    {tr(trendsLang, `nav.${key}`)}
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
                {tr(trendsLang, "ui.readyDeployment")}
              </h2>

              <p style={{ marginTop: 15 }}>
                {tr(trendsLang, "ui.createOptimize")}
              </p>

              <button
                style={{
                  ...styles.button
                }}
                onClick={() => setTab("create")}
              >
                {tr(trendsLang, "ui.startMission")}
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
                [tr(trendsLang, "ui.statPosts"), animatedStats.posts],
                [tr(trendsLang, "ui.statProjects"), animatedStats.projects],
                [tr(trendsLang, "ui.statPublished"), animatedStats.published],
                [tr(trendsLang, "ui.statAvgScore"), animatedStats.avgScore],
                [tr(trendsLang, "ui.statStreak"), animatedStats.streak]
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
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:10 }}>{tr(trendsLang, "ui.liveActivity")}</h3>

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
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:10 }}>{tr(trendsLang, "ui.publishTimeline")}</h3>

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
              <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:10 }}>{tr(trendsLang, "ui.contentPerformance")}</h3>

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

              {/* Colonne gauche — formulaire épuré */}
              <div style={{ overflowY:"auto", paddingRight:8, display:"flex", flexDirection:"column", gap:12 }}>
                {saveStatus && <div style={{ ...styles.card, padding:"10px 14px", fontSize:13, color:"#22c55e" }}>{saveStatus}</div>}

                {/* Bloc Projet */}
                <div style={{ ...styles.card, marginTop:0, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:2 }}>PROJECT</div>

                  {/* Recherche + Select fusionnés */}
                  <input
                    style={{ ...styles.input, marginBottom:0 }}
                    placeholder={tr(trendsLang, "ui.phSearchProject")}
                    value={searchProject}
                    onChange={(e) => setSearchProject(e.target.value)}
                  />
                  <select
                    style={{ ...styles.input, marginBottom:0, width:"100%", boxSizing:"border-box" }}
                    value={selectedProject}
                    onChange={(e) => selectProject(e.target.value)}
                  >
                    <option value="">{tr(trendsLang, "ui.selectProject")}</option>
                    {filteredProjects.map((p) => (
                      <option key={p.name}>{p.name}</option>
                    ))}
                  </select>

                  {/* Actions projet sur une ligne */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    <button style={{ ...styles.button, margin:0, fontSize:12, padding:"10px" }} onClick={createProject}>{tr(trendsLang, "buttons.createProject")}</button>
                    <button style={{ ...styles.button, margin:0, fontSize:12, padding:"10px" }} onClick={duplicateProject}>{tr(trendsLang, "ui.duplicate")}</button>
                  </div>

                  {/* Renommer — seulement si projet sélectionné */}
                  {selectedProject && (
                    <div style={{ display:"flex", gap:6 }}>
                      <input
                        style={{ ...styles.input, marginBottom:0, flex:1 }}
                        placeholder={tr(trendsLang, "ui.phRenameProject")}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                      />
                      <button style={{ ...styles.button, margin:0, fontSize:12, padding:"10px 14px" }} onClick={renameProject}>{tr(trendsLang, "ui.rename")}</button>
                      <button style={{ ...styles.buttonDanger, margin:0, fontSize:12, padding:"10px 14px" }} onClick={() => deleteProject(selectedProject)}>✕</button>
                    </div>
                  )}
                </div>

                {/* Bloc Génération */}
                <div style={{ ...styles.card, marginTop:0, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:2 }}>GENERATE</div>
                  <input
                    style={{ ...styles.input, marginBottom:0 }}
                    placeholder={tr(trendsLang, "ui.phTopic")}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
                  />
                  <button
                    style={{ ...styles.button, margin:0, width:"100%", opacity: loading ? 0.7 : 1 }}
                    disabled={loading}
                    onClick={generate}
                  >
                    {loading ? tr(trendsLang, "ui.aiWriting") : tr(trendsLang, "ui.generateBtn")}
                  </button>
                </div>
              </div>

              {/* Colonne droite — résultat */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflow:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.output")}</h3>
                <textarea
                  style={{ ...styles.textarea, height:280, minHeight:"unset", flex:"none", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", resize:"none", background:"#0f172a", overflowY:"auto" }}
                  placeholder={tr(trendsLang, "ui.outputPlaceholder")}
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
                      {[[tr(trendsLang,"ui.tplViral"),"viral"],[tr(trendsLang,"ui.tplAuthority"),"authority"],[tr(trendsLang,"ui.tplStory"),"story"],[tr(trendsLang,"ui.tplHook"),"hook"],[tr(trendsLang,"ui.tplShort"),"short"],[tr(trendsLang,"ui.tplCta"),"cta"]].map(([label,mode])=>(
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
                    [tr(trendsLang, "ui.bestProject"), insights.bestProject, "#ef4444"],
                    [tr(trendsLang, "ui.topPlatform"), insights.topPlatform, "#3b82f6"],
                    [tr(trendsLang, "ui.cadence"), insights.cadence, "#f59e0b"],
                    [tr(trendsLang, "ui.statAvgScore"), "87", "#22c55e"],
                  ].map(([label,val,color])=>(
                    <div key={label} style={{ ...styles.card, marginTop:0, padding:16 }}>
                      <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{label}</div>
                      <div style={{ color, fontSize:18, fontWeight:800 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* AI Recommendation */}
                <div style={{ ...styles.card, marginTop:0, padding:20, borderLeft:"3px solid #3b82f6", flex:1 }}>
                  <div style={{ color:"#3b82f6", fontSize:11, letterSpacing:"1.5px", marginBottom:12 }}>{tr(trendsLang, "ui.aiRecommendation")}</div>
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
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.platformPerformance")}</h3>
                {[
                  { platform:"LinkedIn", score: linkedinStatus.connected ? stats.avgScore || 0 : 0, color:"#0077b5" },
                  { platform:"Threads",  score: threadsStatus.connected ? Math.max(0, (stats.avgScore || 0) - 20) : 0, color:"#a855f7" },
                  { platform:"X",        score: 0, color:"#1da1f2" },
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
                  <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:12 }}>{tr(trendsLang, "ui.growthSignals")}</h3>
                  {[
                    { signal:"Engagement rate", value: stats.posts > 0 ? "+?" : "N/A", color:"#64748b" },
                    { signal:"Reach", value: stats.published > 0 ? "+?" : "N/A", color:"#64748b" },
                    { signal:"Click-through", value:"N/A", color:"#64748b" },
                    { signal:"Follower growth", value:"N/A", color:"#64748b" },
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
                <button style={{ ...styles.button, margin:0, alignSelf:"flex-start" }} onClick={loadHistory}>{tr(trendsLang, "ui.loadHistory")}</button>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.totalPosts")}</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{history.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.statProjects")}</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{projects.length}</div>
                  </div>
                </div>
                <div style={{ ...styles.card, marginTop:0, flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <p style={{ color:"#334155", fontSize:13, textAlign:"center" }}>{tr(trendsLang, "ui.clickLoadHistory")}</p>
                </div>
              </div>

              {/* Colonne droite — liste */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.contentHistory")}</h3>
                {history.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang, "ui.noHistoryLoaded")}</p>
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
              <div style={{ ...styles.card, marginTop:0, padding:16, borderLeft:`3px solid ${getPlanColor(userPlan.plan)}`, marginBottom:8 }}>
                <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:6 }}>{tr(trendsLang, "profile.currentPlan")}</div>
                <div style={{ color: getPlanColor(userPlan.plan), fontSize:18, fontWeight:900, letterSpacing:"1px" }}>{getPlanIcon(userPlan.plan)} {userPlan.plan.toUpperCase()}{userPlan.interval ? ` · ${userPlan.interval}` : ""}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ color:"#ef4444", fontSize:20, fontWeight:800 }}>{projects.length}</div>
                    <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px" }}>{tr(trendsLang, "ui.statProjects")}</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ color:"#22c55e", fontSize:20, fontWeight:800 }}>{stats.posts}</div>
                    <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px" }}>POSTS</div>
                  </div>
                </div>
              </div>

              {/* Menu navigation */}
              {[
                { key:"account",      icon:"👤", label: tr(trendsLang, "profile.menuAccount") },
                { key:"subscription", icon:"💳", label: tr(trendsLang, "profile.menuSubscription") },
                { key:"password",     icon:"🔐", label: tr(trendsLang, "profile.menuPassword") },
                { key:"email",        icon:"✉️", label: tr(trendsLang, "profile.menuEmail") },
                { key:"danger",       icon:"⚠️", label: tr(trendsLang, "profile.menuDanger") },
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
                  <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>{tr(trendsLang, "profile.accountTitle")}</h2>
                  <div style={{ display:"grid", gap:16 }}>
                    {[
                      { label: tr(trendsLang, "profile.fieldEmail"), value: token && token !== "guest" ? (() => { try { return JSON.parse(atob(token.split(".")[1])).email; } catch { return "—"; } })() : "—" },
                      { label: tr(trendsLang, "profile.fieldMember"), value:"May 2026" },
                      { label: tr(trendsLang, "profile.fieldWorkspace"), value: workspace || "PERSONAL" },
                      { label: tr(trendsLang, "profile.fieldPlan"), value:`${userPlan.plan}${userPlan.interval ? " · " + userPlan.interval : ""}` },
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
                  <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>{tr(trendsLang, "profile.passwordTitle")}</h2>
                  <p style={{ color:"#64748b", fontSize:13, margin:0 }}>{tr(trendsLang, "profile.passwordHint")}</p>
                  {[
                    { label: tr(trendsLang, "profile.labelCurrentPw"), value:currentPassword, setter:setCurrentPassword },
                    { label: tr(trendsLang, "profile.labelNewPw"), value:newPassword, setter:setNewPassword },
                    { label: tr(trendsLang, "profile.labelConfirmPw"), value:confirmPassword, setter:setConfirmPassword },
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
                    {profileLoading ? tr(trendsLang, "profile.updating") : tr(trendsLang, "profile.updatePassword")}
                  </button>
                </div>
              )}

              {/* Change Email */}
              {profileSection === "email" && (
                <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
                  <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>{tr(trendsLang, "profile.emailTitle")}</h2>
                  <p style={{ color:"#64748b", fontSize:13, margin:0 }}>{tr(trendsLang, "profile.emailHint")}</p>
                  <div>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "profile.labelCurrentEmail").toUpperCase()}</div>
                    <div style={{ padding:"14px 18px", background:"#0f172a", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", color:"#94a3b8", fontSize:14 }}>
                      {token && token !== "guest" ? (() => { try { return JSON.parse(atob(token.split(".")[1])).email; } catch { return "—"; } })() : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "profile.labelNewEmail").toUpperCase()}</div>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder={tr(trendsLang, "profile.labelNewEmail")}
                      style={{ ...styles.input, maxWidth:"100%", marginBottom:0 }}
                    />
                  </div>
                  <button
                    style={{ ...styles.button, margin:0, opacity: profileLoading ? 0.6 : 1 }}
                    onClick={changeEmailAddress}
                    disabled={profileLoading}
                  >
                    {profileLoading ? tr(trendsLang, "profile.updating") : tr(trendsLang, "profile.updateEmail")}
                  </button>
                </div>
              )}

              {/* Subscription Management */}
              {profileSection === "subscription" && (
                <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
                  <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>💳 {tr(trendsLang, "profile.menuSubscription")}</h2>

                  {/* Plan actuel */}
                  <div style={{ padding:20, border:`1px solid ${userPlan?.plan === "Free" ? "rgba(71,85,105,0.3)" : "rgba(220,38,38,0.3)"}`, borderRadius:12, background:"rgba(255,255,255,0.02)" }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "profile.currentPlan")}</div>
                    <div style={{ color: userPlan?.plan === "Free" ? "#64748b" : "#ef4444", fontSize:22, fontWeight:900 }}>
                      {userPlan?.plan === "Free" ? "🆓 FREE" : userPlan?.plan === "Business" ? "💎 BUSINESS" : "⚡ PRO"}
                      {userPlan?.interval && <span style={{ fontSize:13, color:"#64748b", fontWeight:400, marginLeft:8 }}>· {userPlan.interval === "year" ? tr(trendsLang, "profile.intervalYear") : tr(trendsLang, "profile.intervalMonth")}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {userPlan?.plan !== "Pro" && (
                      <button style={{ ...styles.button, margin:0 }} onClick={() => setPage && setPage("pricing")}>
                        ⚡ {tr(trendsLang, "profile.upgradePro")}
                      </button>
                    )}
                    {userPlan?.plan !== "Business" && (
                      <button style={{ ...styles.button, margin:0, background:"linear-gradient(135deg,#f97316,#c2410c)" }} onClick={() => setPage && setPage("pricing")}>
                        💎 {tr(trendsLang, "profile.upgradeBusiness")}
                      </button>
                    )}
                    {userPlan?.plan !== "Free" && (
                      <button
                        style={{ ...styles.buttonSecondary, margin:0 }}
                        onClick={async () => {
                          if (!window.confirm(tr(trendsLang, "profile.cancelConfirm"))) return;
                          try {
                            const res = await fetch("https://social-ai-app-production.up.railway.app/stripe/cancel", {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (data.success) showToast(tr(trendsLang, "messages.subscriptionCanceled"));
                          } catch { showToast("Error"); }
                        }}
                      >
                        🚫 {tr(trendsLang, "profile.cancelSubscription")}
                      </button>
                    )}
                  </div>

                  <p style={{ color:"#334155", fontSize:12 }}>{tr(trendsLang, "profile.cancelNote")}</p>
                </div>
              )}

              {/* Danger Zone */}
              {profileSection === "danger" && (
                <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
                  <h2 style={{ color:"#ef4444", fontSize:18, fontWeight:800, margin:0 }}>{`⚠️ ${tr(trendsLang, "profile.dangerTitle")}`}</h2>
                  <p style={{ color:"#64748b", fontSize:13, margin:0 }}>{tr(trendsLang, "ui.dangerWarning")}</p>
                  <div style={{ padding:24, border:"1px solid rgba(220,38,38,0.3)", borderRadius:12, background:"rgba(220,38,38,0.05)" }}>
                    <div style={{ color:"#fff", fontWeight:700, marginBottom:8 }}>{tr(trendsLang, "ui.deleteAccountLabel")}</div>
                    <div style={{ color:"#64748b", fontSize:13, marginBottom:16 }}>{tr(trendsLang, "ui.deleteAccountDesc")}</div>
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

            {/* Encart explicatif */}
            <div style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", gap:12, alignItems:"flex-start" }}>
              <span style={{ fontSize:20, flexShrink:0 }}>🧠</span>
              <div>
                <div style={{ color:"#3b82f6", fontWeight:700, fontSize:13, marginBottom:4 }}>{tr(trendsLang, "ui.memoryExplainTitle")}</div>
                <div style={{ color:"#64748b", fontSize:12, lineHeight:1.6 }}>{tr(trendsLang, "ui.memoryExplainDesc")}</div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 220px)" }}>

              {/* Colonne gauche — formulaire */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { key:"niche",       label: tr(trendsLang, "ui.memNiche"),       ph: tr(trendsLang, "ui.phNiche"),       hint: tr(trendsLang, "ui.memNicheHint") },
                  { key:"audience",    label: tr(trendsLang, "ui.memAudience"),    ph: tr(trendsLang, "ui.phAudience"),    hint: tr(trendsLang, "ui.memAudienceHint") },
                  { key:"tone",        label: tr(trendsLang, "ui.memTone"),        ph: tr(trendsLang, "ui.phTone"),        hint: tr(trendsLang, "ui.memToneHint") },
                  { key:"cta",         label: tr(trendsLang, "ui.memCta"),         ph: tr(trendsLang, "ui.phCta"),         hint: tr(trendsLang, "ui.memCtaHint") },
                  { key:"banned_words",label: tr(trendsLang, "ui.memBannedWords"), ph: tr(trendsLang, "ui.phBannedWords"), hint: tr(trendsLang, "ui.memBannedHint") },
                ].map(({ key, label, ph, hint }) => (
                  <div key={key}>
                    <div style={{ color:"#94a3b8", fontSize:11, letterSpacing:"1px", marginBottom:4 }}>{label}</div>
                    <input
                      style={{ ...styles.input, marginBottom:2 }}
                      placeholder={ph}
                      value={memory[key] || ""}
                      onChange={(e) => setMemory({...memory, [key]: e.target.value})}
                    />
                    {hint && <div style={{ color:"#334155", fontSize:11, paddingLeft:4 }}>{hint}</div>}
                  </div>
                ))}
                <button style={{ ...styles.button, margin:0, width:"100%" }} onClick={saveBrandMemory}>{tr(trendsLang, "ui.saveMemory")}</button>
              </div>

              {/* Colonne droite — récap brand */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:16, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.brandIntelligence")}</h3>
                {[
                  [tr(trendsLang, "ui.memNiche"), memory.niche],
                  [tr(trendsLang, "ui.memAudience"), memory.audience],
                  [tr(trendsLang, "ui.memTone"), memory.tone],
                  [tr(trendsLang, "ui.memCta"), memory.cta],
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
                [tr(trendsLang,"ui.scoreLabel"), analysis?.score ?? "—"],
                [tr(trendsLang,"ui.hookLabel"), analysis?.hookScore ?? "—"],
                [tr(trendsLang,"ui.viralityLabel"), analysis?.viralScore ?? "—"],
                [tr(trendsLang,"ui.clarityLabel"), analysis?.clarityScore ?? "—"],
                [tr(trendsLang,"ui.ctaLabel"), analysis?.ctaScore ?? "—"],
                [tr(trendsLang,"ui.readabilityLabel"), analysis?.readability ?? "—"]
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
                {tr(trendsLang, "ui.aiFeedback")}
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
                    {tr(trendsLang, "ui.strategicInsight")}
                  </h4>

                  <p style={{
                    color:"#94a3b8",
                    lineHeight:1.7,
                    fontSize:14
                  }}>
                    {analysis?.feedback ||
                      "Strong structure. Improve emotional hook for higher engagement."}
                  </p>

                  {analysis?.suggestion && (
                    <p style={{ color:"#f59e0b", fontSize:13, marginTop:10, lineHeight:1.6 }}>
                      💡 {analysis.suggestion}
                    </p>
                  )}

                  <div style={{
                    display:"flex",
                    gap:8,
                    marginTop:18,
                    flexWrap:"wrap"
                  }}>
                    <span style={analysis?.hookStrength === "STRONG" ? styles.feedbackGood : analysis?.hookStrength === "WEAK" ? styles.feedbackBad : styles.feedbackWarn}>
                      HOOK {analysis?.hookStrength || "—"}
                    </span>
                    <span style={analysis?.ctaStrength === "STRONG" ? styles.feedbackGood : analysis?.ctaStrength === "WEAK" ? styles.feedbackBad : styles.feedbackWarn}>
                      CTA {analysis?.ctaStrength || "—"}
                    </span>
                    <span style={analysis?.estimatedReach === "VIRAL" || analysis?.estimatedReach === "HIGH" ? styles.feedbackGood : styles.feedbackWarn}>
                      {analysis?.estimatedReach || "—"} REACH
                    </span>
                    {analysis?.bestPlatform && (
                      <span style={styles.feedbackGood}>📍 {analysis.bestPlatform}</span>
                    )}
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
                    {tr(trendsLang, "ui.platformDistribution")}
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
                <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px", marginBottom:4 }}>{tr(trendsLang, "ui.selectDate")}</p>
                <input style={styles.input} type="date" value={scheduleDate} onChange={(e)=>setScheduleDate(e.target.value)} />
                <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px", marginBottom:4 }}>{tr(trendsLang, "ui.selectTime")}</p>
                <input style={styles.input} type="time" value={scheduleTime} onChange={(e)=>setScheduleTime(e.target.value)} />
                <button style={{ ...styles.button, margin:0, alignSelf:"flex-start", marginTop:8 }} onClick={schedulePost}>{tr(trendsLang, "ui.schedulePost")}</button>

                {/* Stats rapides */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16 }}>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.scheduled")}</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{scheduledPosts.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.published")}</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
                  </div>
                </div>
              </div>

              {/* Colonne droite — queue */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.publishQueue")}</h3>
                {scheduledPosts.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang, "ui.noPostsScheduled")}</p>
                )}
                {scheduledPosts.map((s,i)=>(
                  <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ color:"#ef4444", fontSize:12, fontWeight:700 }}>{s.date} · {s.time}</span>
                      <span style={{ color:"#22c55e", fontSize:11, fontWeight:700 }}>{tr(trendsLang, "ui.scheduled")}</span>
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
                <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px" }}>{tr(trendsLang, "ui.selectPlatform")}</p>
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

                <button style={{ ...styles.button, margin:0, alignSelf:"flex-start", marginTop:8 }} onClick={autoPublish}>{tr(trendsLang, "ui.queuePost")}</button>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.queued")}</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{autoPosts.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.published")}</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
                  </div>
                </div>
              </div>

              {/* Colonne droite — queue */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.autoQueue")}</h3>
                {autoPosts.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang, "ui.noPostsQueued")}</p>
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
                  <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "ui.howToUse")}</div>
                  <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.6 }}>{tr(trendsLang, "ui.howToUseDesc")}</p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.plannedPosts")}</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{planner.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.scheduled")}</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{scheduledPosts.length}</div>
                  </div>
                </div>
              </div>

              {/* Colonne droite — plan */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:10, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.roadmap30")}</h3>
                {planner.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang, "ui.noPlanGenerated")}</p>
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
                <p style={{ color:"#64748b", fontSize:12, letterSpacing:"1px" }}>{tr(trendsLang, "ui.selectPublish")}</p>
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
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.published")}</div>
                    <div style={{ color:"#22c55e", fontSize:28, fontWeight:800, marginTop:8 }}>{publishLog.length}</div>
                  </div>
                  <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.queued")}</div>
                    <div style={{ color:"#ef4444", fontSize:28, fontWeight:800, marginTop:8 }}>{autoPosts.length}</div>
                  </div>
                </div>

                {/* Aperçu du post */}
                <div style={{ ...styles.card, marginTop:0, flex:1 }}>
                  <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:12 }}>{tr(trendsLang, "ui.postPreview")}</h3>
                  <p style={{ color: post ? "#94a3b8" : "#334155", fontSize:13, lineHeight:1.6 }}>
                    {post ? post.slice(0, 300) + (post.length > 300 ? "..." : "") : tr(trendsLang, "ui.noContentGenerated")}
                  </p>
                </div>
              </div>

              {/* Colonne droite — publish log */}
              <div style={{ ...styles.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.publishLog")}</h3>
                {publishLog.length === 0 && (
                  <p style={{ color:"#334155", fontSize:14 }}>{tr(trendsLang, "ui.noPublications")}</p>
                )}
                {publishLog.map((p,i)=>(
                  <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.1)", paddingBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ color:"#ef4444", fontSize:12, fontWeight:700 }}>{p.dest}</span>
                      <span style={{ color:"#22c55e", fontSize:11, fontWeight:700 }}>{tr(trendsLang, "ui.published")}</span>
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
                    [tr(trendsLang, "ui.statProjects"), projects.length, "#ef4444"],
                    [tr(trendsLang, "ui.queued"), autoPosts.length, "#f59e0b"],
                    [tr(trendsLang, "ui.scheduled"), scheduledPosts.length, "#22c55e"],
                  ].map(([label, val, color])=>(
                    <div key={label} style={{ ...styles.card, marginTop:0, padding:14 }}>
                      <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>{label}</div>
                      <div style={{ color, fontSize:26, fontWeight:800, marginTop:6 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Workspace */}
                <div style={{ ...styles.card, marginTop:0, padding:16 }}>
                  <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "ui.workspace")}</div>
                  <div style={{ color:"#ef4444", fontSize:18, fontWeight:800 }}>{workspace || "PERSONAL"}</div>
                </div>

                {/* Membres simulés */}
                <div style={{ ...styles.card, marginTop:0, flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                  <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:4 }}>{tr(trendsLang, "ui.teamMembers")}</h3>
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
                <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.teamActivity")}</h3>
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
                { key:"ai", label: tr(trendsLang, "ui.nicheAI") },
                { key:"saas", label: tr(trendsLang, "ui.nicheSaaS") },
                { key:"marketing", label: tr(trendsLang, "ui.nicheMarketing") },
                { key:"finance", label: tr(trendsLang, "ui.nicheFinance") },
                { key:"leadership", label: tr(trendsLang, "ui.nicheLeadership") },
                { key:"tech", label: tr(trendsLang, "ui.nicheTech") },
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
                <div style={{ color:"#64748b", fontSize:14 }}>{tr(trendsLang, "ui.trendsEmpty")}</div>
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
                    <div style={{ color:"#64748b", fontSize:12 }}>{tr(trendsLang, "ui.linkedinDesc")}</div>
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
                      {tr(trendsLang, "messages.linkedinPending")}
                    </p>
                  </>
                ) : (
                  <button style={{ ...styles.button, margin:0, width:"100%", touchAction:"manipulation" }}
                    onClick={connectLinkedin}
                  >
                    {tr(trendsLang, "buttons.connectLinkedin")}
                  </button>
                )}
              </div>

              {/* Threads — connecteur actif */}
              <div style={{ ...styles.card, marginTop:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:"linear-gradient(135deg,#000,#333)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:"white" }}>🧵</div>
                  <div>
                    <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>Threads</div>
                    <div style={{ color:"#64748b", fontSize:12 }}>{tr(trendsLang, "ui.linkedinDesc")}</div>
                  </div>
                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background: threadsStatus.connected ? "#22c55e" : "#475569" }} />
                    <span style={{ color: threadsStatus.connected ? "#22c55e" : "#475569", fontSize:11, fontWeight:700 }}>
                      {threadsStatus.connected ? tr(trendsLang, "labels.connected") : tr(trendsLang, "labels.disconnected")}
                    </span>
                  </div>
                </div>
                {threadsStatus.connected ? (
                  <>
                    <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#22c55e" }}>
                      ✓ Connected as <strong>@{threadsStatus.username}</strong>
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button
                        style={{ ...styles.button, margin:0, flex:1, opacity: threadsPosting ? 0.6 : 1 }}
                        onClick={postToThreads}
                        disabled={threadsPosting}
                      >
                        {threadsPosting ? tr(trendsLang, "buttons.publishing") : tr(trendsLang, "buttons.postNow")}
                      </button>
                      <button style={{ ...styles.buttonSecondary, margin:0 }} onClick={disconnectThreads}>
                        {tr(trendsLang, "buttons.disconnectThreads")}
                        {tr(trendsLang, "buttons.disconnect")}
                      </button>
                    </div>
                  </>
                ) : (
                  <button style={{ ...styles.button, margin:0, width:"100%", touchAction:"manipulation" }}
                    onClick={connectThreads}
                  >
                    {tr(trendsLang, "buttons.connectThreads")}
                  </button>
                )}
              </div>

              {/* Facebook / Instagram / X / TikTok — coming soon */}
              {[
                { name:"Facebook", icon:"f", color:"#1877f2", sub: tr(trendsLang, "ui.subFacebook") },
                { name:"Instagram", icon:"📸", color:"#e1306c", sub: tr(trendsLang, "ui.subInstagram") },
                { name:"X (Twitter)", icon:"𝕏", color:"#000", sub: tr(trendsLang, "ui.subX") },
                { name:"TikTok", icon:"🎵", color:"#ff0050", sub: tr(trendsLang, "ui.subTikTok") },
              ].map((p) => (
                <div key={p.name} style={{ ...styles.card, marginTop:0, opacity:0.5 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                    <div style={{ width:40, height:40, borderRadius:8, background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"white" }}>{p.icon}</div>
                    <div>
                      <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{p.name}</div>
                      <div style={{ color:"#64748b", fontSize:12 }}>{p.sub}</div>
                    </div>
                    <div style={{ marginLeft:"auto" }}>
                      <span style={{ color:"#475569", fontSize:11, fontWeight:700, background:"rgba(71,85,105,0.2)", padding:"4px 8px", borderRadius:4 }}>{tr(trendsLang, "labels.comingSoon")}</span>
                    </div>
                  </div>
                  <button style={{ ...styles.buttonSecondary, margin:0, width:"100%", cursor:"not-allowed" }} disabled>
                    {tr(trendsLang, "ui.comingSoonLabel")}
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
  feedbackBad:{
    padding:"8px 14px",
    borderRadius:999,
    fontSize:11,
    fontWeight:700,
    background:"rgba(239,68,68,0.12)",
    color:"#ef4444"
  },
  };
