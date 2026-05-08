import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }
  const wordCount = text?.trim()?.split(/\s+/)?.length || 0;
  const score = Math.min(100, 60 + Math.floor(wordCount / 5));
  const hook = text.split("\n")[0].length < 80 ? 85 : 60;
  const clarity = text.length < 1200 ? 90 : 65;
  const engagement = text.includes("?") ? 88 : 62;
  const virality = Math.round((hook + clarity + engagement) / 3);

  let diagnosis = "Solid structure overall.";
  let suggestion = "Add stronger emotional tension in the opening.";

  if (!text.includes("?")) {
    diagnosis = "Weak CTA detected.";
    suggestion = "Add a direct engagement question at the end.";
  }

  res.json({
    score,
    hook,
    clarity,
    engagement,
    virality,
    diagnosis,
    suggestion,
    feedback:
      score > 85
        ? "Excellent structure and strong engagement potential."
        : score > 70
        ? "Solid content. Improve hook intensity."
        : "Content needs stronger positioning and clarity."
  });
});

export default router;