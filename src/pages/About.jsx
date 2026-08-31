import React from 'react';
import { Link } from 'react-router-dom';

const BRAND = '#E97451';
const BRAND_LIGHT = 'rgba(233,116,81,0.1)';

function StatCard({ number, label }) {
  return (
    <div style={{
      background: BRAND_LIGHT,
      borderRadius: '16px',
      padding: '1.5rem',
      textAlign: 'center',
      flex: '1 1 140px',
    }}>
      <div style={{ fontSize: '2.2rem', fontWeight: 900, color: BRAND, letterSpacing: '-0.03em' }}>{number}</div>
      <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600, marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}

function ValueCard({ icon, title, description }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #F3F4F6',
      borderRadius: '16px',
      padding: '1.75rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        background: BRAND_LIGHT,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        marginBottom: '1rem',
      }}>{icon}</div>
      <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#111' }}>{title}</h3>
      <p style={{ color: '#6B7280', lineHeight: 1.7, fontSize: '0.97rem', margin: 0 }}>{description}</p>
    </div>
  );
}

export default function About() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF8F5 0%, #fff 60%)',
      color: '#111',
      fontFamily: '"Outfit", sans-serif',
      padding: '4rem 1.5rem',
    }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Back link */}
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: BRAND, textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', marginBottom: '3rem', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          ← Back to Home
        </Link>

        {/* Hero */}
        <div style={{ marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-block',
            background: BRAND_LIGHT,
            color: BRAND,
            fontWeight: 800,
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.35rem 0.9rem',
            borderRadius: '999px',
            marginBottom: '1.25rem',
          }}>
            Our Story
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', letterSpacing: '-0.03em', margin: '0 0 1.25rem 0', lineHeight: 1.15 }}>
            We built WishFlow because <span style={{ color: BRAND }}>gifting was broken.</span>
          </h1>
          <p style={{ color: '#4B5563', lineHeight: 1.75, fontSize: '1.1rem', margin: 0, maxWidth: '620px' }}>
            Every birthday, holiday, and celebration, someone is stuck guessing. Duplicate gifts pile up. Money is wasted. People return things they didn't need. We knew there was a better way.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
          <StatCard number="50K+" label="Wishlists Created" />
          <StatCard number="18+" label="Blog Articles" />
          <StatCard number="100%" label="Free to Use" />
          <StatCard number="2026" label="Founded" />
        </div>

        {/* Mission */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.6rem', margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>Our Mission</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.75, fontSize: '1.05rem', margin: '0 0 1rem 0' }}>
            WishFlow's mission is simple: <strong>eliminate the stress of gifting, forever.</strong> We believe that the act of giving a gift should feel joyful—for both the giver and the receiver—not stressful, wasteful, or awkward.
          </p>
          <p style={{ color: '#4B5563', lineHeight: 1.75, fontSize: '1.05rem', margin: 0 }}>
            We built a platform where anyone can curate a wishlist from any website, share it with loved ones, and get exactly what they want. And for gift-givers, the guessing game is completely eliminated. Everyone wins.
          </p>
        </section>

        {/* The Product */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.6rem', margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>What WishFlow Does</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.75, fontSize: '1.05rem', margin: '0 0 1rem 0' }}>
            WishFlow is a universal wishlist and gift management platform. Using our browser extension or web app, you can save products from any store on the internet—Amazon, Etsy, IKEA, a local boutique's website—into one beautiful, organized collection.
          </p>
          <p style={{ color: '#4B5563', lineHeight: 1.75, fontSize: '1.05rem', margin: 0 }}>
            From weddings and baby showers to birthday celebrations and Secret Santa exchanges, WishFlow handles every gifting occasion. You can share your collection via a simple link, organize items by priority or category, and track which items have been gifted.
          </p>
        </section>

        {/* Values */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.6rem', margin: '0 0 1.5rem 0', letterSpacing: '-0.02em' }}>Our Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <ValueCard icon="💡" title="Simplicity First" description="We obsess over making every feature as intuitive as possible. If it needs a tutorial, we rethink it." />
            <ValueCard icon="🔒" title="Privacy by Design" description="Your wishlist data is yours. We don't sell your personal information to advertisers. Full stop." />
            <ValueCard icon="🌍" title="Universal Access" description="WishFlow is free to use for everyone. Gifting joy should not be behind a paywall." />
            <ValueCard icon="🤝" title="Community Driven" description="Our best features come directly from our users. We listen, build, and iterate in the open." />
          </div>
        </section>

        {/* Who we are */}
        <section style={{
          background: '#fff',
          border: '1px solid #F3F4F6',
          borderRadius: '20px',
          padding: '2.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          marginBottom: '3.5rem',
        }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.6rem', margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>Who We Are</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.75, fontSize: '1.05rem', margin: '0 0 1rem 0' }}>
            WishFlow is built and maintained by a small, passionate team of product designers and engineers. We are a bootstrapped, independent company — meaning we are not funded by venture capital and we are not beholden to outside shareholders.
          </p>
          <p style={{ color: '#4B5563', lineHeight: 1.75, fontSize: '1.05rem', margin: 0 }}>
            Our independence allows us to make decisions based purely on what is best for our users. We grow when our users love the product, so our incentives are perfectly aligned with yours.
          </p>
        </section>

        {/* CTA */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND} 0%, #c0543a 100%)`,
          borderRadius: '20px',
          padding: '3rem 2.5rem',
          textAlign: 'center',
          color: '#fff',
        }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.8rem', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em' }}>Ready to simplify gifting?</h2>
          <p style={{ opacity: 0.9, fontSize: '1.05rem', margin: '0 0 2rem 0', lineHeight: 1.6 }}>
            Create your free wishlist in seconds. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/auth"
              style={{
                background: '#fff',
                color: BRAND,
                textDecoration: 'none',
                fontWeight: 800,
                padding: '0.85rem 2rem',
                borderRadius: '999px',
                fontSize: '1rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Get Started Free
            </Link>
            <Link
              to="/contact"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
                padding: '0.85rem 2rem',
                borderRadius: '999px',
                fontSize: '1rem',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
