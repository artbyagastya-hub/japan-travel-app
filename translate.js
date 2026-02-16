// Vercel Serverless Function — proxies translation requests to OpenAI
// Your OPENAI_API_KEY stays safe on the server, never exposed to the browser.

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "No text provided" });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: "API key not configured" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'You are a Japanese-English translator for a tourist in Japan. Translate the given text. If the input is in English, translate to Japanese. If in Japanese, translate to English. Return ONLY a JSON object with these fields: "original", "translated", "romanji" (romanized Japanese if translating to Japanese), "context" (a very brief usage tip, max 10 words). No markdown, no backticks, just raw JSON.',
          },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "OpenAI error" });
    }

    const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Translation failed", detail: err.message });
  }
}
