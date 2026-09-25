import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { db } from "../db";
import { useSettings } from "../context/SettingsContext";
import CardVisual from "./CardVisual";

import { API_URL as API } from "../config";
import { ROAST_THEMES } from "./CardVisual";

// ── Module-level pre-warm cache ──────────────────────────────────────────────
// Stores a { promise, itemsKey } so that if the user hovers the button before
// clicking, the API request is already in-flight when the card mounts.
let _prewarmCache = null;

function makeItemsKey(items) {
  return items
    .slice(0, 15)
    .map((i) => i.id || i.name)
    .join(',');
}

async function fetchRoast(items, currency) {
  const res = await fetch(`${API}/api/ai/roast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.slice(0, 15).map(({ name, price }) => ({ name, price })),
      currency,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || `Server error ${res.status}`);
  }

  const { roast } = await res.json();
  if (!roast) throw new Error('Empty roast received from server.');
  return roast;
}

/**
 * Call this on hover / pointer-enter of the "Roast Me" button.
 * It kicks off the API request early so the result is ready (or nearly ready)
 * by the time the user actually clicks.
 */
export function prefetchRoast(currency) {
  db.items.getAll().then((items) => {
    if (!items?.length) return;
    const key = makeItemsKey(items);
    // Don't double-fetch if the cache already covers these items
    if (_prewarmCache?.key === key) return;
    _prewarmCache = { key, promise: fetchRoast(items, currency) };
  }).catch(() => {});
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

        const key = makeItemsKey(items);
        let roastPromise;

        if (_prewarmCache?.key === key) {
          // ✅ Pre-warm hit — reuse the already in-flight (or resolved) promise
          roastPromise = _prewarmCache.promise;
        } else {
          // Cache miss — fire now
          roastPromise = fetchRoast(items, currency);
          _prewarmCache = { key, promise: roastPromise };
        }

        const roast = await roastPromise;
        setRoastText(roast);
        setPhase("ready");

        // Clear the cache after use so a fresh roast is generated next time
        _prewarmCache = null;
      } catch (err) {
        console.error("[RoastCard]", err);
        setRoastText("Error: " + (err.message || "Failed to generate roast."));
        setPhase("error");
        _prewarmCache = null;
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
