module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const prompt = String((req.body || {}).prompt || "").trim().slice(0, 1000);
    if (!prompt) return res.status(400).json({ error: "Write a prompt first." });

    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, steps: 4 }),
      }
    );

    if (r.status === 429) return res.status(429).json({ error: "Daily image limit reached. Try again tomorrow." });
    if (!r.ok) return res.status(502).json({ error: "Image service error. Try again." });

    const data = await r.json();
    const image = data.result?.image;
    if (!image) return res.status(502).json({ error: "No image returned." });

    res.status(200).json({ image: `data:image/jpeg;base64,${image}` });
  } catch (e) {
    res.status(500).json({ error: "Server error." });
  }
};