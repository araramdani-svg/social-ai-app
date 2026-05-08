import { useState, useEffect } from "react";

export default function Generator() {
  const [tab, setTab] = useState("create");
  const [platform, setPlatform] = useState("LinkedIn");
  const [type, setType] = useState("Viral");
  const [voice, setVoice] = useState("Professional");
  const [topic, setTopic] = useState("");
  const [posts, setPosts] = useState([]);
  const [favorite, setFavorite] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const [analysisText, setAnalysisText] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const [search, setSearch] = useState("");

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("growthpilot-projects");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("growthpilot-projects", JSON.stringify(projects));
  }, [projects]);

  const generate = async () => {
    if (!topic) return;

    setLoading(true);

    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ platform, type, topic, voice }),
    });

    const data = await res.json();

    setPosts([
      data.text,
      `${data.text}\n\nAlternative angle`,
      `${data.text}\n\nContrarian version`,
    ]);

    setScore(data.score);
    setLoading(false);
  };

  const analyzePost = async () => {
    if (!analysisText) return;

    const res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: analysisText }),
    });

    const data = await res.json();
    setAnalysis(data);
  };

  const saveProject = () => {
    if (!posts.length) return;

    setProjects([
      ...projects,
      {
        topic,
        platform,
        score,
        posts,
        date: new Date().toLocaleDateString(),
      },
    ]);
  };

  const loadProject = (p) => {
    setTopic(p.topic);
    setPlatform(p.platform);
    setPosts(p.posts);
    setScore(p.score);
    setTab("create");
  };

  const deleteProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const filteredProjects = projects.filter((p) =>
    p.topic.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: projects.length,
    avg:
      projects.length > 0
        ? Math.round(
            projects.reduce((a, p) => a + (p.score?.overall || 0), 0) /
              projects.length
          )
        : 0,
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <h2>GrowthPilot</h2>
        <p style={styles.tagline}>AI Social Growth Engine</p>

        <NavButton label="Create" tab={tab} setTab={setTab} />
        <NavButton label="Projects" tab={tab} setTab={setTab} />
        <NavButton label="Analyze" tab={tab} setTab={setTab} />
        <NavButton label="Insights" tab={tab} setTab={setTab} />
      </aside>

      <main style={styles.main}>
        {tab === "create" && (
          <>
            <h1>Create Content</h1>

            <div style={styles.controls}>
              <select
                style={styles.input}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option>LinkedIn</option>
                <option>X</option>
                <option>Instagram</option>
              </select>

              <select
                style={styles.input}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>Viral</option>
                <option>Story</option>
                <option>Educational</option>
                <option>Authority</option>
                <option>Contrarian</option>
              </select>

              <select
                style={styles.input}
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
              >
                <option>Professional</option>
                <option>Creator</option>
                <option>Bold</option>
                <option>Authority</option>
              </select>

              <input
                style={styles.input}
                placeholder="Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />

              <button style={styles.button} onClick={generate}>
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>

            {score && (
              <Panel title="Performance Score">
                <Score label="Overall" value={score.overall} />
                <Score label="Hook" value={score.hook} />
                <Score label="Clarity" value={score.clarity} />
                <Score label="Engagement" value={score.engagement} />
              </Panel>
            )}

            {posts.map((post, i) => (
              <Panel key={i} title={`Variation ${i + 1}`}>
                <p style={{ whiteSpace: "pre-wrap" }}>{post}</p>

                <button
                  style={styles.smallButton}
                  onClick={() => setFavorite(i)}
                >
                  {favorite === i ? "Favorite ✓" : "Favorite"}
                </button>
              </Panel>
            ))}

            {posts.length > 0 && (
              <button style={styles.button} onClick={saveProject}>
                Save Project
              </button>
            )}
          </>
        )}

        {tab === "analyze" && (
          <>
            <h1>Analyze Post</h1>

            <textarea
              style={styles.textarea}
              placeholder="Paste your post here..."
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
            />

            <button style={styles.button} onClick={analyzePost}>
              Analyze
            </button>

            {analysis && (
              <Panel title="Analysis Results">
                <Score label="Hook" value={analysis.hook} />
                <Score label="Clarity" value={analysis.clarity} />
                <Score label="Engagement" value={analysis.engagement} />
                <Score label="Virality" value={analysis.virality} />

                <p><strong>Diagnosis:</strong> {analysis.diagnosis}</p>
                <p><strong>Suggestion:</strong> {analysis.suggestion}</p>
              </Panel>
            )}
          </>
        )}

        {tab === "projects" && (
          <>
            <h1>Projects</h1>

            <input
              style={styles.input}
              placeholder="Search project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {filteredProjects.map((p, i) => (
              <Panel key={i} title={p.topic}>
                <p>{p.platform}</p>
                <p>Score: {p.score?.overall}</p>

                <button
                  style={styles.smallButton}
                  onClick={() => loadProject(p)}
                >
                  Open
                </button>

                <button
                  style={styles.deleteBtn}
                  onClick={() => deleteProject(i)}
                >
                  Delete
                </button>
              </Panel>
            ))}
          </>
        )}

        {tab === "insights" && (
          <>
            <h1>Insights</h1>

            <div style={styles.analytics}>
              <Card title="Projects" value={stats.total} />
              <Card title="Avg Score" value={stats.avg} />
              <Card title="Top Platform" value="LinkedIn" />
              <Card title="Best Time" value="8:30 AM" />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function NavButton({ label, tab, setTab }) {
  return (
    <button
      style={{
        ...styles.nav,
        background: tab === label.toLowerCase() ? "#4f46e5" : "#1e293b",
      }}
      onClick={() => setTab(label.toLowerCase())}
    >
      {label}
    </button>
  );
}

function Panel({ title, children }) {
  return (
    <div style={styles.panel}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  );
}

function Score({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <strong>{label}: {value}</strong>
      <div style={styles.bar}>
        <div style={{ ...styles.fill, width: `${value}%` }} />
      </div>
    </div>
  );
}

const styles = {
  page:{display:"flex",minHeight:"100vh",background:"#0f172a",color:"white",fontFamily:"Arial"},
  sidebar:{width:240,padding:20,background:"#111827"},
  main:{flex:1,padding:30},
  controls:{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10},
  input:{padding:12,borderRadius:10,border:"none",marginBottom:10},
  textarea:{width:"100%",minHeight:200,padding:15,borderRadius:12,border:"none",marginBottom:20},
  button:{padding:12,border:"none",borderRadius:10,background:"#4f46e5",color:"white"},
  smallButton:{padding:8,border:"none",borderRadius:8,background:"#4f46e5",color:"white"},
  deleteBtn:{padding:8,border:"none",borderRadius:8,background:"#ef4444",color:"white",marginLeft:10},
  panel:{background:"#1e293b",padding:20,borderRadius:16,marginTop:20},
  card:{background:"#1e293b",padding:20,borderRadius:16},
  analytics:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:15},
  nav:{width:"100%",padding:12,border:"none",borderRadius:10,color:"white",marginBottom:10},
  bar:{width:"100%",height:10,background:"#334155",borderRadius:10},
  fill:{height:"100%",background:"#4f46e5",borderRadius:10},
  tagline:{opacity:0.7,marginBottom:20}
};