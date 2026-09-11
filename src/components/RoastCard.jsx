import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import html2canvas from "html2canvas";
import { db } from "../db";
import { useSettings } from "../context/SettingsContext";
import { ShoppingBag, ArrowDown, Loader2 } from "lucide-react";

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function generateRoast(items, currency) {
  if (!GEMINI_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your .env file!");
  }

  const productList = items
    .slice(0, 30)
    .map((item) => `- ${item.name}${item.price ? ` (Rs.${item.price})` : ""}`)
    .join("\n");

  let prompt = `You are a brutally honest, witty, sarcastic friend who loves roasting people shopping wishlists. 
Here is a user wishlist:
${productList}

Write a SHORT, funny roast in 2-3 sentences max. Be specific about what you see in the list. 
Be playful and clever, not mean. Use a conversational tone.
Do NOT use hashtags, emojis or markdown. Just plain witty text.`;

  if (currency === 'INR') {
    prompt += `\n\nCRITICAL INSTRUCTION: Write the entire roast in "Hinglish" (a witty, sarcastic mix of Hindi and English written in Latin script), using popular Gen-Z Indian slang. Make it hilarious.`;
  }

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
  const [stats, setStats] = useState({ count: 0, mostExpensive: 0 });
  const [downloading, setDownloading] = useState(false);
  const [tearing, setTearing] = useState(false);
  const cardRef = useRef(null);
  const hasFetched = useRef(false);

  // Parallax Tilt Setup
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

  const handleMouseMove = (e) => {
    if (downloading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      try {
        const items = await db.items.getAll();
        if (!items || items.length === 0) {
          setRoastText(
            "Your wishlist is completely empty. Even your imagination went on vacation."
          );
          setStats({ count: 0, mostExpensive: 0 });
          setPhase("ready");
          return;
        }
        const maxPrice = Math.max(...items.map((i) => Number(i.price) || 0));
        setStats({ count: items.length, mostExpensive: maxPrice });
        const roast = await generateRoast(items, currency);
        setRoastText(roast);
        setPhase("ready");
      } catch (err) {
        console.error("[RoastCard]", err);
        setRoastText(
          "Error: " + (err.message || "Failed to generate roast. Check console for details.")
        );
        setPhase("error");
      }
    })();
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    setTearing(false);
    x.set(0);
    y.set(0);
    // Wait for card to visually snap perfectly flat
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      // 1. Snapshot the card while intact
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      // 2. Trigger Tear Animation!
      setTearing(true);

      // 3. Let the user watch it drop!
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const link = document.createElement("a");
      link.download = `wishflow-roast-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setTearing(false);
      }, 500); // Wait a bit before resetting
    }
  };

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const priceStr =
    stats.mostExpensive > 0
      ? "Rs." + Number(stats.mostExpensive).toLocaleString("en-IN")
      : "-";

  const bars = [3, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 3, 2, 1, 3, 4, 2, 1, 3, 1, 2, 3, 4, 1, 2, 3, 1, 4];

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          overflowY: "auto",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
            width: "100%",
            maxWidth: "380px",
          }}
        >
          {/* ── The downloadable card ── */}
          {/* Parent 3D Wrapper */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX: downloading ? 0 : rotateX,
              rotateY: downloading ? 0 : rotateY,
              transformPerspective: 1000,
              position: "relative",
              width: "100%",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
              borderRadius: "30px", // Just for shadow clipping if needed
            }}
          >
            {/* TOP HALF WRAPPER */}
            <div
              style={{
                position: "relative",
                width: "100%",
                borderTopLeftRadius: "30px",
                borderTopRightRadius: "30px",
                padding: "5px 5px 0 5px", // Foil border thickness (left, right, top)
                background: "linear-gradient(115deg, #bfbfbf 0%, #ffffff 15%, #999999 30%, #595959 45%, #ffffff 60%, #999999 75%, #ffffff 90%, #bfbfbf 100%)",
                backgroundSize: "300% 100%",
                animation: "holoGlow 4s linear infinite",
                boxShadow: "inset 0 1px 3px rgba(255,255,255,0.8)",
                overflow: "hidden",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  borderTopLeftRadius: "25px",
                  borderTopRightRadius: "25px",
                  fontFamily: "'Inter','Helvetica Neue',sans-serif",
                  background: "#ffffff",
                  boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.05)",
                }}
              >
                {/* Grain Texture Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: "none",
                    opacity: 0.05,
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                    borderTopLeftRadius: "25px",
                    borderTopRightRadius: "25px",
                  }}
                />

                {/* Header */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                    padding: "2rem 1.75rem 1.5rem",
                    position: "relative",
                    overflow: "hidden",
                    borderTopLeftRadius: "25px",
                    borderTopRightRadius: "25px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: 180,
                      height: 180,
                      borderRadius: "50%",
                      background: "rgba(56, 189, 248, 0.1)",
                      top: -60,
                      right: -40,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      background: "rgba(56, 189, 248, 0.08)",
                      bottom: -30,
                      left: -20,
                    }}
                  />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <span style={{ fontSize: "1.4rem" }}>🔥</span>
                      <span
                        style={{
                          color: "#0c4a6e",
                          fontWeight: 900,
                          fontSize: "0.78rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                        }}
                      >
                        WishFlow Roast Card
                      </span>
                    </div>
                    <div
                      style={{
                        color: "#0369a1",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {dateStr}
                    </div>
                  </div>
                </div>

                {/* Upper Ticket perforation */}
                <div
                  style={{
                    position: "relative",
                    height: "1px",
                    margin: 0,
                    zIndex: 2,
                  }}
                >
                  <div style={{ position: "absolute", left: -11, top: -11, width: 22, height: 22, borderRadius: "50%", background: "#1e293b", zIndex: 10 }} />
                  <div style={{ position: "absolute", left: 16, right: 16, top: 0, borderTop: "2px dashed #e2e8f0", zIndex: 1 }} />
                  <div style={{ position: "absolute", right: -11, top: -11, width: 22, height: 22, borderRadius: "50%", background: "#1e293b", zIndex: 10 }} />
                </div>

                {/* Roast Text Area */}
                <div
                  style={{
                    padding: "2rem 1.75rem",
                    position: "relative",
                    minHeight: "180px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {phase === "loading" ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem",
                        color: "#94a3b8",
                      }}
                    >
                      <Loader2
                        size={32}
                        style={{ animation: "roastSpin 1s linear infinite" }}
                      />
                      <p style={{ fontSize: "0.95rem", fontWeight: 500 }}>
                        Analyzing your taste...
                      </p>
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "1.05rem",
                        lineHeight: 1.6,
                        color: phase === "error" ? "#ef4444" : "#334155",
                        textAlign: "center",
                        fontWeight: 500,
                        margin: 0,
                      }}
                    >
                      &ldquo;{roastText}&rdquo;
                    </p>
                  )}
                </div>

                {/* Upper half of the lower perforation holes */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "1px",
                    zIndex: 2,
                  }}
                >
                  <div style={{ position: "absolute", left: -11, top: -11, width: 22, height: 22, borderRadius: "50%", background: "#1e293b", zIndex: 10 }} />
                  <div style={{ position: "absolute", right: -11, top: -11, width: 22, height: 22, borderRadius: "50%", background: "#1e293b", zIndex: 10 }} />
                </div>
              </div>
            </div>

            {/* BOTTOM HALF WRAPPER (Tears off) */}
            <motion.div
              initial={{ rotateZ: 0, y: 0, opacity: 1 }}
              animate={tearing ? { rotateZ: -12, y: 150, opacity: 0 } : { rotateZ: 0, y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{
                position: "relative",
                width: "100%",
                borderBottomLeftRadius: "30px",
                borderBottomRightRadius: "30px",
                padding: "0 5px 5px 5px", // Foil border thickness (left, right, bottom)
                background: "linear-gradient(115deg, #bfbfbf 0%, #ffffff 15%, #999999 30%, #595959 45%, #ffffff 60%, #999999 75%, #ffffff 90%, #bfbfbf 100%)",
                backgroundSize: "300% 100%",
                animation: "holoGlow 4s linear infinite",
                boxShadow: "inset 0 -1px 3px rgba(0,0,0,0.2)",
                clipPath: tearing ? "inset(0 0 0 0 round 0 0 30px 30px)" : "none",
                transformOrigin: "top left",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  borderBottomLeftRadius: "25px",
                  borderBottomRightRadius: "25px",
                  fontFamily: "'Inter','Helvetica Neue',sans-serif",
                  background: "#ffffff",
                  boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.05)",
                }}
              >
                {/* Grain Texture Overlay (Bottom Half) */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: "none",
                    opacity: 0.05,
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                    borderBottomLeftRadius: "25px",
                    borderBottomRightRadius: "25px",
                  }}
                />

                {/* Ticket perforation */}
                <div
                  style={{
                    position: "relative",
                    height: "1px",
                    margin: 0,
                    zIndex: 2,
                  }}
                >
                  <div style={{ position: "absolute", left: -11, top: -11, width: 22, height: 22, borderRadius: "50%", background: "#1e293b", zIndex: 20 }} />
                  <div style={{ position: "absolute", left: 16, right: 16, top: 0, borderTop: "2px dashed #e2e8f0", zIndex: 1 }} />
                  <div style={{ position: "absolute", right: -11, top: -11, width: 22, height: 22, borderRadius: "50%", background: "#1e293b", zIndex: 20 }} />
                </div>

                {/* Logo footer */}
                <div
                  style={{
                    position: "relative",
                    padding: "1.25rem 1.75rem",
                    background: "#ffffff",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottomLeftRadius: "25px",
                    borderBottomRightRadius: "25px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <img
                      src="/192x192.png"
                      alt="WishFlow Logo"
                      style={{
                        width: '1.8rem',
                        height: '1.8rem',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <div
                      style={{
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        fontWeight: 800,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      wishflow.shop
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    data-html2canvas-ignore="true"
                    disabled={phase === "loading" || downloading || tearing}
                    title="Download Card"
                    style={{
                      position: "absolute",
                      right: "1.75rem",
                      width: '2.6rem',
                      height: '2.6rem',
                      borderRadius: '50%',
                      background: phase === "loading" ? "#9ca3af" : "radial-gradient(circle at 35% 35%, #e1f5fe 0%, #64b5f6 60%, #2196f3 100%)",
                      color: "#ffffff",
                      border: phase === "loading" ? "none" : "2px solid #ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: phase === "loading" ? "not-allowed" : "pointer",
                      boxShadow: phase !== "loading" ? "0 6px 14px rgba(33,150,243,0.3), inset 0 4px 10px rgba(255,255,255,0.8), inset 0 -4px 6px rgba(0,0,0,0.1)" : "none",
                      transition: "all 0.2s",
                      padding: 0
                    }}
                  >
                    {downloading ? (
                      <Loader2 size={18} style={{ animation: "roastSpin 1s linear infinite" }} />
                    ) : (
                      <ArrowDown size={20} strokeWidth={3} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.75rem", width: "100%", marginTop: "1.5rem" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.9rem 1.25rem",
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "16px",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                fontFamily: "inherit",
                backdropFilter: "blur(4px)"
              }}
            >
              Close
            </button>
          </div>

          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.75rem",
              margin: 0,
              textAlign: "center",
            }}
          >
            Share on Instagram, Twitter or WhatsApp!
          </p>
        </div>
      </div>

      <style>{`
        @keyframes roastSpin { to { transform: rotate(360deg); } }
        @keyframes holoGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes laserScan {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>
    </>,
    document.body
  );
}










