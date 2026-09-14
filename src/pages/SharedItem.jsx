import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../db";
import { useAuth } from "../context/useAuth";
import { ExternalLink, Package, ArrowRight, Bookmark, Check } from "lucide-react";

function fmt(n) {
  if (n == null || n === "" || isNaN(Number(n))) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

function Skeleton({ w = "100%", h = "16px", r = "8px", style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "si-shimmer 1.4s ease-in-out infinite",
      ...style,
    }} />
  );
}

export default function SharedItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    db.shared.getItem(id).then(data => {
      if (cancelled) return;
      if (!data) setNotFound(true);
      else setItem(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async () => {
    if (!user) {
      // Not logged in — store redirect path and go to auth
      sessionStorage.setItem('postLoginRedirect', `/shared/item/${id}`);
      navigate('/auth');
      return;
    }
    setSaving(true);
    try {
      await db.items.add({
        name: item.name,
        price: item.price,
        link: item.link,
        image: item.image,
        category_id: null,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const priceStr = item ? fmt(item.price) : null;

  if (loading) {
    return (
      <div style={pageStyle}>
        <Header />
        <div style={cardStyle}>
          <Skeleton h="280px" r="20px" style={{ marginBottom: "1.25rem" }} />
          <Skeleton h="22px" w="70%" style={{ marginBottom: "0.6rem" }} />
          <Skeleton h="16px" w="40%" style={{ marginBottom: "1.5rem" }} />
          <Skeleton h="52px" r="14px" />
        </div>
        <Footer />
        <GlobalStyles />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={pageStyle}>
        <Header />
        <div style={{ ...cardStyle, textAlign: "center", padding: "3rem 2rem" }}>
          <Package size={56} color="#ccc" style={{ margin: "0 auto 1rem" }} />
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem", color: "#111", fontWeight: 700 }}>Item not found</h2>
          <p style={{ margin: 0, color: "#888", fontSize: "0.95rem" }}>This item may have been removed or the link is invalid.</p>
          <Link to="/" style={{
            display: "inline-block", marginTop: "1.5rem",
            padding: "0.75rem 1.5rem", borderRadius: "12px",
            background: "var(--primary, #f97316)", color: "#fff",
            fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
          }}>Go to WishFlow</Link>
        </div>
        <Footer />
        <GlobalStyles />
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Header />

      <div style={{ ...cardStyle, animation: "si-fadeup 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>

        <div style={{
          borderRadius: "20px",
          overflow: "hidden",
          background: "#f5f5f7",
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.25rem",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
        }}>
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <Package size={64} color="#ccc" />
          )}
        </div>

        <h1 style={{
          margin: "0 0 0.4rem",
          fontSize: "1.3rem",
          fontWeight: 800,
          color: "#111",
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
        }}>
          {item.name}
        </h1>

        {priceStr && (
          <p style={{
            margin: "0 0 1.5rem",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--primary, #f97316)",
            letterSpacing: "-0.01em",
          }}>
            {priceStr}
          </p>
        )}

        {!priceStr && <div style={{ marginBottom: "1.5rem" }} />}

        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.95rem 1.5rem",
              borderRadius: "14px",
              background: "var(--primary, #f97316)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.05rem",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
              transition: "opacity 0.18s, transform 0.18s",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <ExternalLink size={18} />
            Buy Now
          </a>
        ) : (
          <div style={{
            padding: "0.9rem",
            borderRadius: "14px",
            background: "#f5f5f7",
            color: "#888",
            textAlign: "center",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}>
            No purchase link available
          </div>
        )}

        {/* Save to WishFlow button */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            marginTop: "0.75rem",
            padding: "0.95rem 1.5rem",
            borderRadius: "14px",
            background: saved ? "#f0fdf4" : "#111",
            color: saved ? "#16a34a" : "#fff",
            border: saved ? "1.5px solid #bbf7d0" : "1.5px solid transparent",
            fontWeight: 700,
            fontSize: "1.05rem",
            cursor: saving || saved ? "default" : "pointer",
            transition: "all 0.2s",
            letterSpacing: "-0.01em",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
          }}
          onMouseEnter={e => { if (!saved && !saving) e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {saved ? (
            <><Check size={18} /> Saved to WishFlow!</>
          ) : saving ? (
            <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "si-spin 0.6s linear infinite" }} /> Saving...</>
          ) : (
            <><Bookmark size={18} /> {user ? "Save to My WishFlow" : "Sign in to Save"}</>
          )}
        </button>

        <div style={{ height: "1px", background: "rgba(0,0,0,0.08)", margin: "1.5rem 0" }} />

        <p style={{ margin: 0, textAlign: "center", fontSize: "0.82rem", color: "#aaa", fontWeight: 500 }}>
          Shared via{" "}
          <Link to="/" style={{ color: "var(--primary, #f97316)", fontWeight: 700, textDecoration: "none" }}>
            WishFlow
          </Link>
        </p>
      </div>

      <Footer />
      <GlobalStyles />
    </div>
  );
}

function Header() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem 1.25rem",
      maxWidth: "480px",
      margin: "0 auto",
      width: "100%",
      boxSizing: "border-box",
    }}>
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem" }}>🎁</span>
        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#111", letterSpacing: "-0.02em" }}>WishFlow</span>
      </Link>
      <Link
        to="/auth"
        style={{
          display: "flex", alignItems: "center", gap: "0.3rem",
          padding: "0.5rem 1rem", borderRadius: "10px",
          background: "var(--primary, #f97316)", color: "#fff",
          fontWeight: 700, fontSize: "0.85rem", textDecoration: "none",
          boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
        }}
      >
        Sign up free <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function Footer() {
  return (
    <div style={{
      maxWidth: "480px",
      margin: "1.5rem auto 3rem",
      padding: "1.5rem 1.25rem",
      textAlign: "center",
    }}>
      <p style={{
        margin: "0 0 0.75rem",
        fontSize: "1rem",
        fontWeight: 700,
        color: "#111",
        letterSpacing: "-0.01em",
      }}>
        Save this to your own wishlist 🎁
      </p>
      <p style={{ margin: "0 0 1.25rem", fontSize: "0.88rem", color: "#666", lineHeight: 1.5 }}>
        Create your free WishFlow account and start saving products from any website.
      </p>
      <Link
        to="/auth"
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          padding: "0.75rem 1.75rem", borderRadius: "12px",
          background: "#111", color: "#fff",
          fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          transition: "opacity 0.18s",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        Get WishFlow — it is free <ArrowRight size={16} />
      </Link>
    </div>
  );
}

const pageStyle = {
  minHeight: "100dvh",
  background: "#f8f8f8",
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const cardStyle = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "1.25rem",
  background: "#fff",
  borderRadius: "24px",
  boxShadow: "0 2px 20px rgba(0,0,0,0.07)",
  border: "1px solid rgba(0,0,0,0.06)",
};

function GlobalStyles() {
  return (
    <style>{`
      @keyframes si-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes si-fadeup {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes si-spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  );
}
