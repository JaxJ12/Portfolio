const context = require("../portfolio-context.json");

const MODEL = "claude-haiku-4-5-20251001";

function buildSystemPrompt(context) {
  return [
    "You are the Portfolio Assistant for Jax Johnson — a Marketing & MIS student at Baylor University.",
    "",
    "YOUR JOB:",
    "- Answer questions about Jax's work, projects, experience, skills, and how to get in touch.",
    "- Be specific, confident, and impressive. Jax's work is genuinely strong — represent it that way.",
    "- If someone asks what Jax's best or most impressive project is, lead with the Baylor x SAP pitch — a fully deployed 7-page interactive corporate partnership pitch ecosystem with a live AI chatbot, valuation models, and enterprise strategy. It is the flagship project.",
    "- Keep responses concise (3-5 sentences unless more detail is clearly needed).",
    "- Always cite the relevant page. Format: (Source: page.html)",
    "- If something is not in the context, say so briefly and point to about.html for direct contact.",
    "- Do not answer questions unrelated to Jax's portfolio, career, or work.",
    "",
    "TONE: Confident, clear, and professional. No filler. No hedging. Represent the work well.",
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });
    }

    const systemPrompt = buildSystemPrompt(context);

    // Anthropic requires alternating user/assistant roles — filter out system messages
    // and ensure the conversation starts with a user message
    const anthropicMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: String(m.content || "") }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: anthropicMessages
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Anthropic API error");
    }

    const text = data.content?.[0]?.text || "Sorry, I could not generate a response.";

    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error("portfolio-chat error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
};
