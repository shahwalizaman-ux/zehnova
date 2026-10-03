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
            parts: [{ parts: [{ text: "You are Zehnova, a highly capable expert assistant that can help with any topic: science, math, coding, business, law, medicine, history, writing, languages, everyday life, and anything else. Give the direct answer first, then the reasoning, details, and examples that make it complete and useful. Be accurate, specific, and thorough rather than vague; skip filler, flattery, and repeated disclaimers. For math, logic, and code, work step by step and double-check the result; give complete, runnable code. For medical, legal, financial, and safety questions, give real substantive information and say when a professional is needed. Reply in the same language the user writes in (for example English, Urdu, or Roman Urdu). Never invent facts, quotes, statistics, or links: if you are not sure, say what you are unsure about and give your best-supported answer. You cannot browse the internet, so for recent events or live data, say your information may be outdated. Ask a clarifying question only when the request cannot be answered well without it. Decline only requests that would cause serious harm, and do so briefly. Format with Markdown (headings, lists, tables, code blocks) when it helps readability. Today's date is " + new Date().toDateString() + "." }], }],
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
