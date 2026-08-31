import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const BRAND = '#E97451';
const BRAND_LIGHT = 'rgba(233,116,81,0.1)';

function ContactCard({ icon, title, value, href, description }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: '1.25rem',
        alignItems: 'flex-start',
        background: '#fff',
        border: `1px solid ${hovered ? BRAND : '#F3F4F6'}`,
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: hovered ? '0 8px 24px rgba(233,116,81,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        width: '52px',
        height: '52px',
        minWidth: '52px',
        background: BRAND_LIGHT,
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{title}</div>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111', marginBottom: '0.25rem' }}>{value}</div>
        <div style={{ fontSize: '0.92rem', color: '#6B7280', lineHeight: 1.5 }}>{description}</div>
      </div>
    </a>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid #F3F4F6',
      paddingBottom: '1.25rem',
      marginBottom: '1.25rem',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 0,
          fontFamily: '"Outfit", sans-serif',
          textAlign: 'left',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111' }}>{question}</span>
        <span style={{ fontSize: '1.4rem', color: BRAND, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none', marginLeft: '1rem', minWidth: '24px', textAlign: 'center' }}>+</span>
      </button>
      {open && (
        <p style={{ color: '#4B5563', lineHeight: 1.7, fontSize: '1rem', margin: '0.85rem 0 0 0' }}>{answer}</p>
      )}
    </div>
  );
}

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate form submission with a small delay
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    border: '1.5px solid #E5E7EB',
    borderRadius: '12px',
    fontSize: '1rem',
    fontFamily: '"Outfit", sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    background: '#FAFAFA',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF8F5 0%, #fff 60%)',
      color: '#111',
      fontFamily: '"Outfit", sans-serif',
      padding: '4rem 1.5rem',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

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
            Get In Touch
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', letterSpacing: '-0.03em', margin: '0 0 1.25rem 0', lineHeight: 1.15 }}>
            We'd love to <span style={{ color: BRAND }}>hear from you.</span>
          </h1>
          <p style={{ color: '#4B5563', lineHeight: 1.75, fontSize: '1.1rem', margin: 0, maxWidth: '580px' }}>
            Whether you have a question about features, need help with your account, want to report a bug, or just want to say hello — we're here.
          </p>
        </div>

        {/* Contact Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '4rem' }}>
          <ContactCard
            icon="✉️"
            title="Email Us"
            value="support@wishflow.app"
            href="mailto:support@wishflow.app"
            description="We typically respond within 24 hours on business days."
          />
          <ContactCard
            icon="📝"
            title="Read Our Blog"
            value="WishFlow Blog"
            href="/blog"
            description="Find tips, gift guides, and answers to common questions."
          />
          <ContactCard
            icon="⚡"
            title="Response Time"
            value="Within 24 Hours"
            href="mailto:support@wishflow.app"
            description="Our support team operates Monday through Friday."
          />
        </div>

        {/* Contact Form */}
        <div style={{
          background: '#fff',
          border: '1px solid #F3F4F6',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          marginBottom: '4rem',
        }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.6rem', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>Send Us a Message</h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.97rem', margin: '0 0 2rem 0' }}>Fill out the form and we'll get back to you as soon as possible.</p>

          {submitted ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              background: 'rgba(34, 197, 94, 0.07)',
              borderRadius: '16px',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ fontWeight: 900, fontSize: '1.4rem', margin: '0 0 0.5rem 0', color: '#059669' }}>Message Sent!</h3>
              <p style={{ color: '#4B5563', fontSize: '1rem', margin: 0 }}>
                Thanks for reaching out, <strong>{formData.name}</strong>! We'll reply to <strong>{formData.email}</strong> within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Jane Smith"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = BRAND}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="jane@example.com"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = BRAND}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>Subject *</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{ ...inputStyle, cursor: 'pointer', color: formData.subject ? '#111' : '#9CA3AF' }}
                  onFocus={e => e.target.style.borderColor = BRAND}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                >
                  <option value="" disabled>Select a subject...</option>
                  <option value="General Question">General Question</option>
                  <option value="Account Help">Account Help</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Billing & Subscription">Billing &amp; Subscription</option>
                  <option value="Partnership">Partnership Inquiry</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Tell us how we can help you..."
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '130px' }}
                  onFocus={e => e.target.style.borderColor = BRAND}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: submitting ? '#D1D5DB' : `linear-gradient(135deg, ${BRAND} 0%, #c0543a 100%)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '1rem 2.5rem',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  fontFamily: '"Outfit", sans-serif',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  alignSelf: 'flex-start',
                  boxShadow: submitting ? 'none' : '0 4px 15px rgba(233,116,81,0.35)',
                }}
                onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'scale(1.03)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {submitting ? 'Sending...' : 'Send Message →'}
              </button>
            </form>
          )}
        </div>

        {/* FAQ */}
        <section>
          <h2 style={{ fontWeight: 900, fontSize: '1.6rem', margin: '0 0 2rem 0', letterSpacing: '-0.02em' }}>Frequently Asked Questions</h2>
          <FaqItem
            question="Is WishFlow free to use?"
            answer="Yes! WishFlow's core features are completely free. You can create wishlists, add items from any website, and share your lists without paying anything. We offer a premium tier with additional features for power users."
          />
          <FaqItem
            question="How do I add items from any website?"
            answer="You can add items by pasting the product URL directly into WishFlow. We also offer a browser extension that lets you add items with a single click while you're shopping on any website."
          />
          <FaqItem
            question="Can I share my wishlist with people who don't have an account?"
            answer="Absolutely. Your shared wishlist link is publicly accessible without requiring a login. Anyone with the link can view your wishlist and see which items have already been claimed."
          />
          <FaqItem
            question="How do I delete my account and data?"
            answer="You can request account deletion at any time from your Profile settings. We will permanently delete your account and all associated data within 30 days of your request."
          />
          <FaqItem
            question="What should I do if I find a bug?"
            answer="Please use the contact form above with the subject 'Bug Report' and include as much detail as possible — what you were doing, what happened, and what browser/device you were using. We take all bug reports seriously and will follow up with you."
          />
        </section>

      </div>
    </div>
  );
}
