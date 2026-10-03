module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });

  try {
    let { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ reply: "No messages provided." });
    }

    messages = messages.slice(-20).map(m => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.text || "").slice(0, 4000) }],
    }));

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are Zehnova, a helpful, friendly AI assistant. Answer clearly and honestly. Use Markdown for formatting. If you are unsure, say so." }],
          },
          contents: messages,
        }),
      }
    );

    if (r.status === 429) return res.status(429).json({ reply: "Too many requests. Please try again in a minute." });
    if (!r.ok) return res.status(502).json({ reply: "The AI service had a problem. Please try again." });

    const data = await r.json();
    const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "Sorry, I couldn't generate a reply.";
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ reply: "Server error. Please try again." });
  }
};
