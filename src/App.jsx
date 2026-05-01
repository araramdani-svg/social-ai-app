import { useState, useEffect } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState([]);

  // Charger les posts au démarrage
  useEffect(() => {
    const saved = localStorage.getItem("posts");
    if (saved) setPosts(JSON.parse(saved));
  }, []);

  // Sauvegarder à chaque changement
  useEffect(() => {
    localStorage.setItem("posts", JSON.stringify(posts));
  }, [posts]);

  function handleGenerate() {
    const fakePost = `🔥 Post about "${input}"\n\nThis is a demo AI post.`;

    setPosts([fakePost, ...posts]);
    setInput("");
  }

  function handleDelete(index) {
    const newPosts = posts.filter((_, i) => i !== index);
    setPosts(newPosts);
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 30 }}>
      <h1>🚀 Social AI Studio</h1>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a topic..."
          style={{ flex: 1, padding: 10 }}
        />

        <button onClick={handleGenerate}>
          Generate
        </button>
      </div>

      <div style={{ marginTop: 30 }}>
        {posts.map((p, i) => (
          <div
            key={i}
            style={{
              padding: 15,
              marginBottom: 10,
              border: "1px solid #ddd",
              borderRadius: 10,
              whiteSpace: "pre-line",
            }}
          >
            <p>{p}</p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleCopy(p)}>Copy</button>
              <button onClick={() => handleDelete(i)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}