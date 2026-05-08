const context = require("../portfolio-context.json");

const MODEL = "gemini-2.0-flash";

function loadContext() {
  return context;
}

function buildSystemPrompt(context) {
  return [
    "You are the Portfolio Assistant for Jax Johnson.",
    "Answer questions about Jax's portfolio using ONLY the context provided.",
    "If the answer is not in the context, say you do not know and direct the user to the About page for contact.",
    "Keep responses concise and helpful.",
    "Always cite the page where the info appears.",
    "Cite format: (Source: page.html).",
    "If multiple pages are relevant, cite each page.",
    "Do not answer off-topic questions.",
    "",
    "PORTFOLIO CONTEXT:",
    JSON.stringify(context, null, 2)
  ].join("\n");
}

module.exports = async (req, res) => {
  if (req.headers.origin) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages payload" });
    }

    const context = loadContext();
    const systemPrompt = buildSystemPrompt(context);

    const geminiContents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: String(msg.content || "") }]
    }));

    const geminiPayload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload)
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini API error");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response.";

    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error("portfolio-chat error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
