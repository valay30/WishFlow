import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { db } from "../db";
import { useSettings } from "../context/SettingsContext";
import { GoogleGenerativeAI } from "@google/generative-ai";
import CardVisual from "./CardVisual";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

import { API_URL as API } from "../config";
import { ROAST_THEMES } from "./CardVisual";

async function generateRoast(items, currency) {
  if (!GEMINI_KEY) throw new Error("VITE_GEMINI_API_KEY is not set in your .env file!");
  const productList = items.slice(0, 30).map((item) => `- ${item.name}${item.price ? ` (Rs.${item.price})` : ""}`).join("\n");
  let prompt = `You are a brutally honest, witty, sarcastic friend who loves roasting people shopping wishlists.\nHere is a user wishlist:\n${productList}\n\nWrite a SHORT, funny roast in 2-3 sentences max. Be specific about what you see in the list.\nBe playful and clever, not mean. Use a conversational tone.\nDo NOT use hashtags, emojis or markdown. Just plain witty text.`;
  if (currency === "INR") prompt += `\n\nCRITICAL INSTRUCTION: Write the entire roast in "Hinglish" (a witty, sarcastic mix of Hindi and English written in Latin script), using popular Gen-Z Indian slang. Make it hilarious.`;
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const models = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"];
  let lastError;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err) {
      console.warn(`[RoastCard] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

export default function RoastCard({ user, onClose }) {
  const { currency } = useSettings();
  const [phase, setPhase] = useState("loading");
  const [roastText, setRoastText] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [tearing, setTearing] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      const cached = localStorage.getItem('wishflow_roast_enabled_themes');
      if (cached) {
        const parsed = JSON.parse(cached);
        const allowed = ROAST_THEMES.filter(t => parsed.includes(t.id));
        if (allowed.length > 0) return allowed[Math.floor(Math.random() * allowed.length)];
      }
    } catch (e) {}
    return ROAST_THEMES[Math.floor(Math.random() * ROAST_THEMES.length)];
  });
  const captureRef = useRef(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    (async () => {
      try {
        const items = await db.items.getAll();

        if (!items || items.length === 0) {
          setRoastText("Your wishlist is completely empty. Even your imagination went on vacation.");
          setPhase("ready");
          return;
        }
        const roast = await generateRoast(items, currency);
        setRoastText(roast);
        setPhase("ready");
      } catch (err) {
        console.error("[RoastCard]", err);
        setRoastText("Error: " + (err.message || "Failed to generate roast."));
        setPhase("error");
      }
    })();
  }, []);

  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const handleDownload = async () => {
    if (!captureRef.current || downloading) return;
    setDownloading(true);
    setTearing(false);
    await new Promise((r) => setTimeout(r, 100));
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      if (activeTheme?.layout === 'ticket') {
        setTearing(true);
        await new Promise((r) => setTimeout(r, 1000));
      }
      const link = document.createElement("a");
      link.download = `wishflow-roast-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setTimeout(() => { setDownloading(false); setTearing(false); }, activeTheme?.layout === 'ticket' ? 500 : 200);
    }
  };

  return createPortal(
    <>
      {/* HIDDEN CAPTURE TARGET — fixed 380px width, no animations, no button, no grain/shadows */}
      <div ref={captureRef} style={{ position: "fixed", top: "-9999px", left: "0px", width: "380px", pointerEvents: "none", zIndex: -1 }}>
        <CardVisual phase={phase} roastText={roastText} dateStr={dateStr} showButton={false} downloading={false} isCapture={true} tearing={false} theme={activeTheme} />
      </div>

      {/* VISIBLE DISPLAY CARD */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 1rem", overflowY: "auto" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", width: "100%", maxWidth: "380px" }}>
          <div style={{ position: "relative", width: "100%", borderRadius: "30px", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
            <CardVisual phase={phase} roastText={roastText} dateStr={dateStr} showButton={true} onDownload={handleDownload} downloading={downloading} isCapture={false} tearing={tearing} theme={activeTheme} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", width: "100%", marginTop: "1.5rem" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "0.9rem 1.25rem", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "16px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(4px)" }}>Close</button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", margin: 0, textAlign: "center" }}>Share on Instagram, Twitter or WhatsApp!</p>
        </div>
      </div>

      <style>{`
        @keyframes roastSpin { to { transform: rotate(360deg); } }
        @keyframes holoGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>,
    document.body
  );
}
