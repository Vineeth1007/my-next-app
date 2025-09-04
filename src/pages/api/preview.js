export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!key)
    return res.status(500).json({ error: "OPENROUTER_API_KEY missing" });

  const { context, platform = "gmail" } = req.body || {};
  if (!context || typeof context !== "string") {
    return res.status(400).json({ error: "context (string) is required" });
  }

  const preset =
    {
      gmail:
        "Write a professional email with clear subject, greeting, paragraphs, and polite closing.",
      slack:
        "Write a concise Slack message with bullets and next steps. No formal greeting.",
      whatsapp:
        "Write a casual WhatsApp reply, short and friendly. Emojis allowed.",
      other: "Write a clear message appropriate for the platform.",
    }[platform] || "Write a clear message appropriate for the platform.";

  const prompt = [
    "You are drafting platform-aware replies.",
    `Platform: ${platform}`,
    `Guidelines: ${preset}`,
    "Task: Based on the user's context below, produce ONE preview.",
    "Keep it short and realistic.",
    "",
    `Context: """${context.trim()}"""`,
  ].join("\n");

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://example.com",
        "X-Title": "Nexa Preview",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const text = await resp.text();
    if (!resp.ok)
      return res
        .status(resp.status)
        .json({ error: `OpenRouter: ${text.slice(0, 500)}` });

    const json = JSON.parse(text);
    const preview = json?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ preview });
  } catch (e) {
    return res.status(500).json({ error: String(e).slice(0, 500) });
  }
}
