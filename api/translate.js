// Vercel Serverless Function — proxies to OpenAI (translation + vision)
// Set OPENAI_API_KEY in Vercel Environment Variables

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: "API key not configured" });

  const { text, image, mode } = req.body;

  // Vision mode: translate image
  if (mode === "vision" && image) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
              { type: "text", text: 'Identify ALL Japanese text in this image. For each, provide Japanese, romaji, and English translation. Return ONLY JSON: {"items":[{"japanese":"...","romaji":"...","english":"...","context":"..."}],"summary":"..."}' }
            ]
          }],
          temperature: 0.3,
        }),
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data.error?.message });
      const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
      return res.status(200).json(JSON.parse(raw));
    } catch (err) {
      return res.status(500).json({ error: "Vision failed", detail: err.message });
    }
  }

  // Text translation mode
  if (!text?.trim()) return res.status(400).json({ error: "No text provided" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: 'You are a Japanese-English translator for a tourist. Translate the given text. If English→Japanese, if Japanese→English. Return ONLY JSON: {"original","translated","romanji","context"}. No markdown.' },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message });
    const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    return res.status(200).json(JSON.parse(raw));
  } catch (err) {
    return res.status(500).json({ error: "Translation failed", detail: err.message });
  }
}
