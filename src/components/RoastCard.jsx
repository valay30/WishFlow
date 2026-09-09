import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { db } from "../db";

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function generateRoast(items) {
  if (!GEMINI_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your .env file!");
  }

  const productList = items
    .slice(0, 30)
    .map((item) => `- ${item.name}${item.price ? ` (Rs.${item.price})` : ""}`)
    .join("\n");

  const prompt = `You are a brutally honest, witty, sarcastic friend who loves roasting people shopping wishlists. 
Here is a user wishlist:
${productList}

Write a SHORT, funny roast in 2-3 sentences max. Be specific about what you see in the list. 
Be playful and clever, not mean. Use a conversational tone.
Do NOT use hashtags, emojis or markdown. Just plain witty text.`;

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
  const [phase, setPhase] = useState("loading");
  const [roastText, setRoastText] = useState("");
  const [stats, setStats] = useState({ count: 0, mostExpensive: 0 });
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);
  const hasFetched = useRef(false);

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
        const roast = await generateRoast(items);
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
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `wishflow-roast-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  const username = user?.username
    ? `@${user.username}`
    : user?.name || "Wishlist Enjoyer";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const priceStr =
    stats.mostExpensive > 0
      ? "Rs." + Number(stats.mostExpensive).toLocaleString("en-IN")
      : "-";

  const bars = [3,1,4,2,3,1,2,4,1,3,2,1,4,3,2,1,3,4,2,1,3,1,2,3,4,1,2,3,1,4];

  return createPortal(
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
        <div
          ref={cardRef}
          style={{
            width: "100%",
            borderRadius: "28px",
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
            fontFamily: "'Inter','Helvetica Neue',sans-serif",
            background: "#ffffff",
          }}
        >
          {/* Header */}
          <div
            style={{
              background:
                "linear-gradient(135deg,#7c3aed 0%,#db2777 55%,#f97316 100%)",
              padding: "2rem 1.75rem 1.5rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
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
                background: "rgba(255,255,255,0.06)",
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
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  WishFlow Roast Report
                </span>
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                {username} &nbsp;·&nbsp; {dateStr}
              </div>
            </div>
          </div>

          {/* Roast text */}
          <div
            style={{ padding: "1.75rem 1.75rem 1.5rem", background: "#fff" }}
          >
            {phase === "loading" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "1rem 0",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: "3px solid #f3e8ff",
                    borderTopColor: "#7c3aed",
                    borderRadius: "50%",
                    animation: "roastSpin 0.8s linear infinite",
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    color: "#9ca3af",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                  }}
                >
                  Analyzing your questionable taste...
                </p>
              </div>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: "1.05rem",
                  lineHeight: 1.65,
                  color: "#1f2937",
                  fontWeight: 500,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{roastText}&rdquo;
              </p>
            )}
          </div>

          {/* Stats */}
          {phase !== "loading" && (
            <div
              style={{
                display: "flex",
                borderTop: "1px solid #f3f4f6",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "1rem",
                  textAlign: "center",
                  borderRight: "1px solid #f3f4f6",
                }}
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    color: "#7c3aed",
                  }}
                >
                  {stats.count}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#9ca3af",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginTop: "0.15rem",
                  }}
                >
                  Items Saved
                </div>
              </div>
              <div
                style={{ flex: 1, padding: "1rem", textAlign: "center" }}
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    color: "#db2777",
                  }}
                >
                  {priceStr}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#9ca3af",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginTop: "0.15rem",
                  }}
                >
                  Most Expensive
                </div>
              </div>
            </div>
          )}

          {/* Ticket perforation */}
          <div
            style={{
              position: "relative",
              height: "1px",
              margin: "0 -1px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.75)",
                flexShrink: 0,
                marginLeft: -11,
              }}
            />
            <div
              style={{
                flex: 1,
                borderTop: "2px dashed #e5e7eb",
                margin: "0 4px",
              }}
            />
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.75)",
                flexShrink: 0,
                marginRight: -11,
              }}
            />
          </div>

          {/* Barcode footer */}
          <div
            style={{
              padding: "1.25rem 1.75rem",
              background: "#fff",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: "2px",
                height: 40,
                marginBottom: "0.5rem",
              }}
            >
              {bars.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: i % 3 === 0 ? 3 : 2,
                    height: h * 8,
                    background: "#1f2937",
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#9ca3af",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              wishflow.shop
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
          <button
            onClick={handleDownload}
            disabled={phase === "loading" || downloading}
            style={{
              flex: 1,
              padding: "0.9rem 1.25rem",
              background:
                phase === "loading"
                  ? "#9ca3af"
                  : "linear-gradient(135deg,#7c3aed,#db2777)",
              color: "#fff",
              border: "none",
              borderRadius: "16px",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: phase === "loading" ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              boxShadow:
                phase !== "loading"
                  ? "0 8px 20px rgba(124,58,237,0.35)"
                  : "none",
              transition: "all 0.2s",
            }}
          >
            {downloading ? "Saving..." : "Download Card"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "0.9rem 1.25rem",
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "16px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              fontFamily: "inherit",
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

      <style>{`@keyframes roastSpin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
}








