import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { db } from "../db";
import { useSettings } from "../context/SettingsContext";
import { ArrowDown, Loader2 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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

const FOIL_BG = "linear-gradient(115deg, #bfbfbf 0%, #ffffff 15%, #999999 30%, #595959 45%, #ffffff 60%, #999999 75%, #ffffff 90%, #bfbfbf 100%)";
const GRAIN_URL = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

function CardVisual({ phase, roastText, dateStr, showButton, onDownload, downloading, isCapture, tearing }) {
  // If capturing, we remove grain and inset shadows to ensure html2canvas paints the white background correctly.
  const innerBoxShadow = isCapture ? "none" : "inset 0 2px 10px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.05)";

  const topMask = isCapture ? {} : {
    WebkitMaskImage: "radial-gradient(circle 11.5px at 0 100%, transparent 99%, #000 100%), radial-gradient(circle 11.5px at 100% 100%, transparent 99%, #000 100%)",
    WebkitMaskComposite: "source-in",
    maskComposite: "intersect"
  };

  const bottomMask = isCapture ? {} : {
    WebkitMaskImage: "radial-gradient(circle 11.5px at 0 0, transparent 99%, #000 100%), radial-gradient(circle 11.5px at 100% 0, transparent 99%, #000 100%)",
    WebkitMaskComposite: "source-in",
    maskComposite: "intersect"
  };

  return (
    <>
      <div style={{ position: "relative", width: "100%", borderTopLeftRadius: "30px", borderTopRightRadius: "30px", padding: "5px 5px 0 5px", background: FOIL_BG, backgroundSize: "300% 100%", animation: showButton ? "holoGlow 4s linear infinite" : undefined, overflow: "hidden", zIndex: 1, ...topMask }}>
        <div style={{ position: "relative", borderTopLeftRadius: "25px", borderTopRightRadius: "25px", fontFamily: "'Inter','Helvetica Neue',sans-serif", backgroundColor: "#ffffff", boxShadow: innerBoxShadow }}>
          {!isCapture && <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", opacity: 0.05, backgroundImage: GRAIN_URL, borderTopLeftRadius: "25px", borderTopRightRadius: "25px" }} />}
          <div style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", padding: "2rem 1.75rem 1.5rem", position: "relative", overflow: "hidden", borderTopLeftRadius: "25px", borderTopRightRadius: "25px" }}>
            <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(56, 189, 248, 0.1)", top: -60, right: -40 }} />
            <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(56, 189, 248, 0.08)", bottom: -30, left: -20 }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "1.4rem" }}>🔥</span>
                <span style={{ color: "#0c4a6e", fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>WishFlow Roast Card</span>
              </div>
              <div style={{ color: "#0369a1", fontSize: "0.78rem", fontWeight: 600 }}>{dateStr}</div>
            </div>
          </div>
          <div style={{ position: "relative", height: "1px", margin: 0, zIndex: 2 }}>
            <div style={{ position: "absolute", left: 16, right: 16, top: 0, borderTop: "2px dashed #e2e8f0", zIndex: 1 }} />
          </div>
          <div style={{ padding: "2rem 1.75rem", position: "relative", minHeight: "180px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src={`${window.location.origin}/192x192.png`} crossOrigin="anonymous" alt="" style={{ position: "absolute", width: "200px", height: "200px", opacity: 0.2, pointerEvents: "none", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0 }} />
            <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
              {phase === "loading" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "#94a3b8" }}>
                  <Loader2 size={32} style={{ animation: "roastSpin 1s linear infinite" }} />
                  <p style={{ fontSize: "0.95rem", fontWeight: 500 }}>Analyzing your taste...</p>
                </div>
              ) : (
                <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: phase === "error" ? "#ef4444" : "#334155", textAlign: "center", fontWeight: 500, margin: 0 }}>
                  &ldquo;{roastText}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px", padding: "0 5px 5px 5px", background: FOIL_BG, backgroundSize: "300% 100%", animation: showButton ? "holoGlow 4s linear infinite" : undefined, zIndex: 2, clipPath: tearing ? "inset(0 0 0 0 round 0 0 30px 30px)" : "none", transformOrigin: "top left", transition: tearing ? "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease-in-out, clip-path 0.8s" : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-in, clip-path 0.6s", transform: tearing ? "rotate(-12deg) translateY(150px)" : "none", opacity: tearing ? 0 : 1, ...bottomMask }}>
        <div style={{ position: "relative", borderBottomLeftRadius: "25px", borderBottomRightRadius: "25px", fontFamily: "'Inter','Helvetica Neue',sans-serif", backgroundColor: "#ffffff", boxShadow: innerBoxShadow }}>
          {!isCapture && <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", opacity: 0.05, backgroundImage: GRAIN_URL, borderBottomLeftRadius: "25px", borderBottomRightRadius: "25px" }} />}
          <div style={{ position: "relative", height: "1px", margin: 0, zIndex: 2 }}>
            <div style={{ position: "absolute", left: 16, right: 16, top: 0, borderTop: "2px dashed #e2e8f0", zIndex: 1 }} />
          </div>
          <div style={{ position: "relative", padding: "1.25rem 1.75rem", background: "#ffffff", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", borderBottomLeftRadius: "25px", borderBottomRightRadius: "25px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <img src={`${window.location.origin}/192x192.png`} crossOrigin="anonymous" alt="WishFlow Logo" style={{ width: "1.8rem", height: "1.8rem", borderRadius: "8px", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: 800, letterSpacing: "-0.01em" }}>wishflow.shop</div>
            </div>
            {showButton && (
              <button onClick={onDownload} disabled={phase === "loading" || downloading || tearing} title="Download Card"
                style={{ position: "absolute", right: "1.75rem", width: "2.6rem", height: "2.6rem", borderRadius: "50%", background: phase === "loading" ? "#9ca3af" : "radial-gradient(circle at 35% 35%, #e1f5fe 0%, #64b5f6 60%, #2196f3 100%)", color: "#ffffff", border: phase === "loading" ? "none" : "2px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: phase === "loading" ? "not-allowed" : "pointer", boxShadow: phase !== "loading" ? "0 6px 14px rgba(33,150,243,0.3), inset 0 4px 10px rgba(255,255,255,0.8), inset 0 -4px 6px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s", padding: 0 }}>
                {downloading ? <Loader2 size={18} style={{ animation: "roastSpin 1s linear infinite" }} /> : <ArrowDown size={20} strokeWidth={3} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function RoastCard({ user, onClose }) {
  const { currency } = useSettings();
  const [phase, setPhase] = useState("loading");
  const [roastText, setRoastText] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [tearing, setTearing] = useState(false);
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
      setTearing(true);
      await new Promise((r) => setTimeout(r, 1000));
      const link = document.createElement("a");
      link.download = `wishflow-roast-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setTimeout(() => { setDownloading(false); setTearing(false); }, 500);
    }
  };

  return createPortal(
    <>
      {/* HIDDEN CAPTURE TARGET — fixed 380px width, no animations, no button, no grain/shadows */}
      <div ref={captureRef} style={{ position: "fixed", top: "-9999px", left: "0px", width: "380px", pointerEvents: "none", zIndex: -1 }}>
        <CardVisual phase={phase} roastText={roastText} dateStr={dateStr} showButton={false} downloading={false} isCapture={true} tearing={false} />
      </div>

      {/* VISIBLE DISPLAY CARD */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem", overflowY: "auto" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", width: "100%", maxWidth: "380px" }}>
          <div style={{ position: "relative", width: "100%", borderRadius: "30px", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
            <CardVisual phase={phase} roastText={roastText} dateStr={dateStr} showButton={true} onDownload={handleDownload} downloading={downloading} isCapture={false} tearing={tearing} />
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
