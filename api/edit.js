module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, image } = req.body || {};
    const m = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(image || "");
    if (!prompt || !m) return res.status(400).json({ error: "Upload an image and describe the edit." });

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: String(prompt).slice(0, 1000) },
              { inlineData: { mimeType: m[1], data: m[2] } },
            ],
          }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (r.status === 429) return res.status(429).json({ error: "Edit limit reached. Try again later." });
    if (!r.ok) return res.status(502).json({ error: "Editing isn't available right now." });

    const data = await r.json();
    const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) return res.status(502).json({ error: "The model returned no image. Try a different prompt." });

    res.status(200).json({ image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
  } catch (e) {
    res.status(500).json({ error: "Server error." });
  }
};
