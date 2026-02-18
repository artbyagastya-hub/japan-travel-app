// Vercel Serverless Function — proxies full chat conversations to OpenAI
// Set OPENAI_API_KEY in Vercel Environment Variables

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: "API key not configured" });

  const { messages, max_tokens = 800 } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens,
        messages,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message });

    const content = data.choices[0].message.content;
    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: "Chat failed", detail: err.message });
  }
}
