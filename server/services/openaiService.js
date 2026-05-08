import openai from "../config/openai.js";

export async function generatePost(platform, type, topic, voice) {
  const prompt = `
Write a high-performing ${platform} post.

Type: ${type}
Topic: ${topic}
Voice: ${voice}

Rules:
- Strong hook
- Short paragraphs
- Viral formatting
- Clear CTA
- Natural and engaging
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const score = {
    overall: Math.floor(Math.random() * 20) + 80,
    hook: Math.floor(Math.random() * 20) + 80,
    clarity: Math.floor(Math.random() * 20) + 80,
    engagement: Math.floor(Math.random() * 20) + 80,
  };

  return {
    text: response.choices[0].message.content,
    score,
  };
}