import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in environment");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Serve static frontend from "public"
app.use(express.static(path.join(__dirname, "public")));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// In-memory session storage (⚠️ resets when server restarts)
const sessions = Object.create(null);

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, model: DEFAULT_MODEL });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { sessionId, message, model } = req.body || {};
    const useModel = model || DEFAULT_MODEL;

    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message (string) required" });
    }

    if (!sessions[sessionId]) sessions[sessionId] = [];

    sessions[sessionId].push({ role: "user", parts: [{ text: message }] });

    const chat = genAI.getGenerativeModel({ model: useModel }).startChat({
      history: sessions[sessionId],
    });

    const result = await chat.sendMessage(message);
    const reply = result?.response?.text?.() || "";

    if (!reply) {
      return res.status(502).json({ error: "Empty response from Gemini" });
    }

    sessions[sessionId].push({ role: "model", parts: [{ text: reply }] });

    res.json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err?.message || err);
    res.status(500).json({
      error: "Gemini API error",
      detail: err?.message || "Unknown error",
    });
  }
});

// ✅ Always use PORT from environment (important for Render)
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`→ Model: ${DEFAULT_MODEL}`);
});
