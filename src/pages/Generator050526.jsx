import { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";


export default function Generator() {
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

  const token = localStorage.getItem("token");

  const api = async (route, body = {}, method = "POST") => {
    const res = await fetch(`http://localhost:5000/${route}`, {
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
    setProjects(data || []);
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
      clearInterval(typingInterval);
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

  const pageHeader = (title, subtitle) => (
  <div style={styles.homeHeader}>
    <img src={logo} alt="logo" style={styles.homeLogo} />

    <div>
      <h1 style={styles.title}>{title}</h1>
      <p style={styles.subtitle}>{subtitle}</p>
    </div>
  </div>
);

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brandText}>
          <img src={logo} alt="logo" style={styles.sidebarLogo} />
          <h2 style={styles.brandMini}>GrowthPILOT</h2>
        </div>

        {[
          "home",
          "dashboard",
          "insights",
          "create",
          "memory",
          "scheduler",
          "autopost",
          "analyze",
          "planner",
          "history",
          "publish",
          "team",
        ].map((t) => (
          <button
            key={t}
            style={{
  ...styles.nav,
  background:
    tab === t
      ? "linear-gradient(90deg,#050505,#111827)"
      : "transparent",

  border: "none",
  borderRadius: 0,
  color: "#fff",

  borderLeft:
    tab === t
      ? "4px solid #dc2626"
      : "4px solid transparent",

  boxShadow:
    tab === t
      ? "inset 0 0 20px rgba(220,38,38,.08)"
      : "none",

  textShadow:
    tab === t
      ? "1px 0 #dc2626, -1px 0 #dc2626, 0 1px #dc2626, 0 -1px #dc2626"
      : "none"
            }}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </aside>

      <main style={styles.main}>
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
              gap: 10
            }}
          >
            <div style={styles.homeHeader}>
              <img src={logo} alt="logo" style={styles.homeLogo} />

              <div>
                <h1 style={{ ...styles.title, fontSize: 28 }}>
                  MISSION CONTROL
                </h1>
                <p style={styles.subtitle}>
                  Command every GrowthPilot capability
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                gap: 8
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
                    padding: "6px",
                    cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "#0b0b0b",
                    borderRadius: 0,
                  }}
                >
                  <h2
                    style={{
                      marginBottom: 8,
                      fontSize: 18,
                      color: "#fff",
                      textShadow:
                        "1px 0 #dc2626,-1px 0 #dc2626,0 1px #dc2626,0 -1px #dc2626"
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
                marginTop: 10,
                padding: "10px",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 0,
                background: "#0b0b0b"
              }}
            >
              <h2
                style={{
                  color: "#fff",
                  textShadow:
                    "1px 0 #dc2626,-1px 0 #dc2626,0 1px #dc2626,0 -1px #dc2626"
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
            <div style={styles.homeHeader}>
              <img src={logo} alt="logo" style={styles.homeLogo} />

              <div>
                <h1 style={{ ...styles.title, marginBottom: 8 }}>
                  DASHBOARD
                </h1>
                <p style={styles.subtitle}>
                  Your AI content command center
                </p>
              </div>
            </div>

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
                  <h3>{label}</h3>
                  <h1>{value}</h1>
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
                <h3>LIVE AI ACTIVITY</h3>

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
                <h3>PUBLISH TIMELINE</h3>

                {timelineData.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0"
                    }}
                  >
                    <span>{item.platform}</span>
                    <span>{item.status}</span>
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
              <h3>CONTENT PERFORMANCE</h3>

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
            {pageHeader(
              "CREATE",
              "Generate strategic content at scale"
            )}
            <div style={styles.formWrap}>
            {saveStatus && (
              <div style={styles.card}>
                {saveStatus}
              </div>
            )}
            <input
              style={styles.input}
              placeholder="PROJECT TITLE"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="SEARCH PROJECT"
              value={searchProject}
              onChange={(e) => setSearchProject(e.target.value)}
            />

            <select
              style={styles.input}
              value={selectedProject}
              onChange={(e) => selectProject(e.target.value)}
            >
              <option value="">SELECT PROJECT</option>
              {filteredProjects.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>

            <input
              style={styles.input}
              placeholder="RENAME PROJECT"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
            </div>
            <button style={styles.button} onClick={renameProject}>
              RENAME
            </button>

            <button style={styles.button} onClick={createProject}>
              CREATE PROJECT
            </button>

            <button style={styles.button} onClick={duplicateProject}>
              DUPLICATE
            </button>

            <button
              style={styles.buttonDanger}
              onClick={() =>
                selectedProject && deleteProject(selectedProject)
              }
            >
              DELETE
            </button>

            <input
              style={styles.input}
              placeholder="TOPIC"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            <button
              style={styles.button}
              disabled={loading}
              onClick={generate}
            >
              {loading ? "AI WRITING..." : "GENERATE"}
            </button>

            {post && (
              <div style={styles.card}>
                <textarea
                  style={styles.textarea}
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                />

                <div style={styles.card}>
                  <h3>POST METRICS</h3>
                  <p>WORDS: {postMetrics.words}</p>
                  <p>CHARS: {postMetrics.chars}</p>
                  <p>READ: {postMetrics.readTime} min</p>
                </div>

                <button style={styles.button} onClick={savePost}>SAVE</button>
                <button style={styles.button} onClick={saveDraft}>DRAFT</button>
                <button style={styles.button} onClick={copyPost}>COPY</button>
                <button style={styles.button} onClick={exportPost}>EXPORT</button>
                <button style={styles.button} onClick={analyze}>ANALYZE</button>
                <button style={styles.button} onClick={generatePlanner}>PLAN</button>

                <button style={styles.button} onClick={() => rewrite("viral")}>VIRAL</button>
                <button style={styles.button} onClick={() => rewrite("authority")}>AUTHORITY</button>
                <button style={styles.button} onClick={() => rewrite("story")}>STORY</button>
                <button style={styles.button} onClick={() => rewrite("hook")}>HOOK</button>
                <button style={styles.button} onClick={() => rewrite("short")}>SHORT</button>
                <button style={styles.button} onClick={() => rewrite("cta")}>CTA</button>
              </div>
            )}
          </>
        )}
        {tab === "insights" && (
          <>
            {pageHeader(
              "INSIGHTS",
              "Performance intelligence and strategic recommendations"
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5,minmax(0,1fr))",
                gap: 8
              }}
            >
              <div style={styles.card}><h3>BEST PROJECT</h3><p>{insights.bestProject}</p></div>
              <div style={styles.card}><h3>TOP PLATFORM</h3><p>{insights.topPlatform}</p></div>
              <div style={styles.card}><h3>CADENCE</h3><p>{insights.cadence}</p></div>
              <div style={styles.card}><h3>AI RECOMMENDATION</h3><p>{insights.recommendation}</p></div>
            </div>
          </>
        )}
        {tab === "history" && (
          <>
            {pageHeader(
              "HISTORY",
              "Generate strategic content at scale"
            )}
            <button style={styles.button} onClick={loadHistory}>LOAD HISTORY</button>

            {history.map((h,i)=>(
              <div key={i} style={styles.card}>
                <h3>{h.title}</h3>
                <p>{h.content?.slice(0,200)}</p>
              </div>
            ))}
          </>
        )}
        {tab==="profile" && (
        <>
          {pageHeader(
            "PROFILE",
            "Generate strategic content at scale"
          )}

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>ACCOUNT</h3>
              <p>demo@growthpilot.ai</p>
            </div>

            <div style={styles.card}>
              <h3>PLAN</h3>
              <p>PREMIUM</p>
            </div>

            <div style={styles.card}>
              <h3>PROJECTS</h3>
              <p>{projects.length}</p>
            </div>

            <div style={styles.card}>
              <h3>POSTS</h3>
              <p>{stats.posts}</p>
            </div>
          </div>

          <div style={styles.card}>
            <button
              style={styles.button}
              onClick={() => {
                const pass = prompt("Enter new password");
                if(pass) alert("Password updated");
              }}
            >
              CHANGE PASSWORD
            </button>

            <button
              style={styles.button}
              onClick={changeEmail}
            >
              CHANGE EMAIL ADDRESS
            </button>

            <button
              style={styles.buttonDanger}
              onClick={deleteAccount}
            >
              DELETE ACCOUNT
            </button>
          </div>
        </>
        )}
        {tab === "memory" && (
          <>
            {pageHeader(
              "BRAND MEMORY",
              "Train AI on your brand identity"
            )}
            <div style={styles.formWrap}>
            <input
              style={styles.input}
              placeholder="NICHE"
              value={memory.niche}
              onChange={(e)=>setMemory({...memory,niche:e.target.value})}
            />

            <input
              style={styles.input}
              placeholder="AUDIENCE"
              value={memory.audience}
              onChange={(e)=>setMemory({...memory,audience:e.target.value})}
            />
            </div>
            <button style={styles.button} onClick={saveBrandMemory}>
              SAVE MEMORY
            </button>
          </>
        )}
        {tab==="analyze" && (
          <>
            {pageHeader(
              "CONTENT ANALYTICS",
              "Measure and optimize performance"
            )}

            <div style={styles.grid}>
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
                    border:`2px solid ${metricColor(value)}`
                  }}
                >
                  <h3>{label}</h3>
                  <h1 style={{color:metricColor(value)}}>{value}</h1>
                </div>
              ))}
            </div>

            <div style={styles.card}>
              <h3>AI FEEDBACK</h3>
              <div style={styles.chartCard}>
                <h3>PLATFORM DISTRIBUTION</h3>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformData}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p>
                {analysis?.feedback ||
                  "Strong structure. Improve emotional hook for higher engagement."}
              </p>
            </div>
          </>
        )}
        {tab==="scheduler" && (
          <>
            {pageHeader(
              "SCHEDULER",
              "Plan and automate your publishing flow"
            )}
            <div style={styles.formWrap}>
            <input
              style={styles.input}
              type="date"
              value={scheduleDate}
              onChange={(e)=>setScheduleDate(e.target.value)}
            />

            <input
              style={styles.input}
              type="time"
              value={scheduleTime}
              onChange={(e)=>setScheduleTime(e.target.value)}
            />
            </div>
            <button style={styles.button} onClick={schedulePost}>
              SCHEDULE POST
            </button>

            {scheduledPosts.map((s,i)=>(
              <div key={i} style={styles.card}>
                <strong>{s.date} • {s.time}</strong>
                <p>{s.content}</p>
              </div>
            ))}
          </>
        )}
        {tab==="autopost" && (
          <>
            {pageHeader(
              "AUTOPOST",
              "Automated multi-platform distribution"
            )}
            <div style={styles.formWrap}>
            <select
              style={styles.input}
              value={autoPlatform}
              onChange={(e)=>setAutoPlatform(e.target.value)}
            >
              <option>LINKEDIN</option>
              <option>X</option>
              <option>THREADS</option>
            </select>
            </div>
            <button style={styles.button} onClick={autoPublish}>
              QUEUE POST
            </button>

            {autoPosts.map((p,i)=>(
              <div key={i} style={styles.card}>
                <strong>{p.platform}</strong>
                <p>{p.content}</p>
                <p>STATUS: {p.status}</p>
                <p>{p.date}</p>
              </div>
            ))}
          </>
        )}
        {tab==="planner" && (
          <>
            {pageHeader(
              "PLANNER",
              "30-day strategic content roadmap"
            )}

            {planner.map((p,i)=>(
              <div key={i} style={styles.card}>
                {p}
              </div>
            ))}
          </>
        )}
        {tab==="publish" && (
          <>
            {pageHeader(
              "PUBLISH CENTER",
              "Distribute across every platform"
            )}

            <button style={styles.button} onClick={()=>publish("LINKEDIN")}>
              LINKEDIN
            </button>

            <button style={styles.button} onClick={()=>publish("X")}>
              X
            </button>

            <button style={styles.button} onClick={()=>publish("THREADS")}>
              THREADS
            </button>

            {publishStatus && (
              <div style={styles.card}>
                {publishStatus}
              </div>
            )}

            {publishLog.map((p,i)=>(
              <div key={i} style={styles.card}>
                {p.dest} • {p.date}
              </div>
            ))}
          </>
        )}
        {tab==="team" && (
          <>
            {pageHeader(
              "TEAM MODE",
              "Collaborative content operations"
            )}

            <div style={styles.grid}>
              <div style={styles.card}>
                <h3>ACTIVE USERS</h3>
                <h1>{projects.length}</h1>
              </div>

              <div style={styles.card}>
                <h3>CONTENT QUEUED</h3>
                <h1>{autoPosts.length}</h1>
              </div>

              <div style={styles.card}>
                <h3>SCHEDULED</h3>
                <h1>{scheduledPosts.length}</h1>
              </div>

              <div style={styles.card}>
                <h3>WORKSPACE</h3>
                <h1>{workspace}</h1>
              </div>
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
    minHeight: "100vh",
    background: "#0f172a",
    color: "white"
  },
  sidebar:{
    width:240,
    padding:24,
    background:"#111827",
    borderRight:"1px solid rgba(220,38,38,.18)",
    boxShadow:"10px 0 40px rgba(0,0,0,.25)"
  },
  main: {
    flex: 1,
    padding: "18px 22px",
    height: "calc(100vh - 10px)",
    overflowY: "auto",
    boxSizing: "border-box"
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
    padding:"16px 20px",
    marginBottom:10,
    background:"#050505",
    borderRadius:0,
    border:"1px solid rgba(255,255,255,.04)",
    color:"white",
    fontSize:"15px",
    outline:"none"
  },
  formWrap:{
    maxWidth:"560px"
  },
  button: {
    padding: "14px 22px",
    margin: 8,
    background: "#050505",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 0,
    cursor: "pointer",
    fontWeight: 800,
    letterSpacing: "1px",
    textShadow:
      "1px 0 #dc2626, -1px 0 #dc2626, 0 1px #dc2626, 0 -1px #dc2626",
    transition: "all .25s ease"
  },
  buttonDanger:{
    padding:"14px 22px",
    margin:8,
    background:"#7f1d1d",
    color:"#fff",
    border:"none",
    borderRadius:0,
    cursor:"pointer",
    fontWeight:800,
    letterSpacing:"1px"
  },
  buttonSecondary:{
    padding:"14px 22px",
    margin:8,
    background:"#050505",
    color:"#fff",
    border:"1px solid rgba(255,255,255,.06)",
    borderRadius:0,
    cursor:"pointer",
    fontWeight:700,
    textShadow:
      "1px 0 #dc2626, -1px 0 #dc2626, 0 1px #dc2626, 0 -1px #dc2626"
  },
  card: {
    borderRadius: 0,
    background: "#050505",
    border:"1px solid rgba(220,38,38,.08)",
    padding: 24,
    marginTop: 0,
    boxSizing: "border-box",
    overflow: "hidden"
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
    marginBottom:50,
    paddingTop:10
  },
  sidebarLogo: {
    width:46,
    height:46,
    objectFit:"contain",
    filter:"drop-shadow(0 0 12px rgba(99,102,241,.45))"
  },
  homeHeader:{
    display:"flex",
    alignItems:"center",
    gap:24,
    marginBottom:18
  },
  homeLogo:{
    width:95,
    filter:"drop-shadow(0 0 28px rgba(99,102,241,.45))"
  },
  subtitle:{
    color:"#94a3b8",
    marginTop:8,
    fontSize:16
  },
  chartCard:{
    background:"#050505",
    padding:30,
    borderRadius:0,
    boxShadow:"0 20px 60px rgba(0,0,0,.35)",
    marginTop:30,
    width:"100%",
    minHeight:170,
    overflow: "hidden",
    border:"1px solid rgba(220,38,38,.08)",
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
    fontSize:"56px",
    fontWeight:900,
    fontStyle:"italic",
    color:"#000",
    WebkitTextStroke:"2px white",
    textShadow:`
      2px 2px 0 #ef4444,
      -2px -2px 0 #ef4444,
      2px -2px 0 #ef4444,
      -2px 2px 0 #ef4444
    `,
    display:"flex",
    alignItems:"center",
    gap:10,
    marginBottom:26,
    letterSpacing:"1px"
  },
  brandMini:{
    paddingRight:"8px",
    fontSize:"24px",
    fontWeight:900,
    fontStyle:"italic",
    color:"#000",
    WebkitTextStroke:"0.5px white",
    textShadow:"1px 1px 0 #ef4444",
    letterSpacing:"0.8px",
    lineHeight:"1",
    margin:0
  },
};