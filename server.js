import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

import "./server/config/db.js";
import authRoutes from "./server/routes/auth.js";
import generateRoutes from "./server/routes/generate.js";
import analyzeRoutes from "./server/routes/analyze.js";

// ✅ dotenv en premier — avant tout accès à process.env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Chaque router monté une seule fois
app.use("/auth", authRoutes);
app.use("/generate", generateRoutes);
app.use("/analyze", analyzeRoutes);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askAI(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
  } catch {
    return null;
  }
}

app.post("/generate", async (req, res) => {
  const { topic } = req.body;
  const text =
    (await askAI(`Write a viral LinkedIn post about ${topic}`)) ||
    `Nobody talks enough about ${topic}.`;
  res.json({ text });
});

app.post("/rewrite", async (req, res) => {
  const { text, mode } = req.body;
  const rewritten =
    (await askAI(`Rewrite in ${mode} mode:\n${text}`)) ||
    `${text}\n\n[${mode}]`;
  res.json({ text: rewritten });
});

app.post("/hooks", (req, res) => {
  const { topic } = req.body;
  res.json({
    hooks: [
      `Nobody talks enough about ${topic}`,
      `The truth about ${topic}`,
      `Why most fail at ${topic}`,
      `The hidden side of ${topic}`,
      `What nobody tells you about ${topic}`,
    ],
  });
});

app.post("/calendar", (req, res) => {
  res.json({
    days: [
      "Monday: Educational",
      "Tuesday: Story",
      "Wednesday: Authority",
      "Thursday: Contrarian",
      "Friday: Viral",
    ],
  });
});

app.post("/analyze", (req, res) => {
  const { text } = req.body;
  const hookStrength = text.split("\n")[0].length < 70 ? 92 : 74;
  const curiosityGap = text.includes("Nobody") || text.includes("Why") ? 89 : 68;
  const clarity = text.length < 1200 ? 90 : 71;
  const authority = text.includes("I") ? 84 : 69;
  const ctaStrength = text.includes("?") ? 91 : 55;
  const viralityPotential = Math.round(
    (hookStrength + curiosityGap + clarity + authority + ctaStrength) / 5
  );

  let recommendation = "Strong post.";
  if (ctaStrength < 70) recommendation = "Add a stronger engagement question.";
  if (hookStrength < 80) recommendation = "Strengthen the opening hook.";

  res.json({ hookStrength, curiosityGap, clarity, authority, ctaStrength, viralityPotential, recommendation });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});