import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  const {
    topic,
    template,
    voice,
    campaign
  } = req.body;

  const generated = `
${template.toUpperCase()} CONTENT

Topic: ${topic}

Voice: ${voice}
Campaign: ${campaign}

Hook:
Most people misunderstand ${topic}.

Body:
The biggest leverage point is consistency and strategic positioning.

CTA:
What's your take on ${topic}?
`;

  res.json({
    text: generated.trim()
  });
});

export default router;