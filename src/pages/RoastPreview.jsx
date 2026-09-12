import React, { useState } from 'react';
import CardVisual, { ROAST_THEMES } from '../components/CardVisual';

export default function RoastPreview() {
  const [phase, setPhase] = useState('ready'); // 'loading', 'ready', 'error'
  const [roastText, setRoastText] = useState("Oh look, another person buying an aesthetic water bottle they’ll use twice. Your wishlist screams ‘I want to be a Pinterest board’ but your budget says ‘maybe next month’. Please, save your money for something you actually need.");
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(4); // Default to Emerald theme (Index 4)
  const [showButton, setShowButton] = useState(false); // Clean card view like the reference image
  
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ minHeight: '100vh', background: '#eef1f5', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#141c38', marginBottom: '0.5rem', fontWeight: 900 }}>Roast Card Design Preview</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Comparing Emerald theme with user reference image</p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', justifyContent: 'center' }}>
        <button 
          onClick={() => setPhase('loading')}
          style={{ padding: '0.5rem 1rem', background: phase === 'loading' ? '#141c38' : '#fff', color: phase === 'loading' ? '#fff' : '#141c38', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Loading
        </button>
        <button 
          onClick={() => setPhase('ready')}
          style={{ padding: '0.5rem 1rem', background: phase === 'ready' ? '#141c38' : '#fff', color: phase === 'ready' ? '#fff' : '#141c38', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Ready
        </button>
        <button 
          onClick={() => setShowButton(!showButton)}
          style={{ padding: '0.5rem 1rem', background: showButton ? '#f97316' : '#fff', color: showButton ? '#fff' : '#141c38', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          {showButton ? 'Hide Download Button' : 'Show Download Button'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {ROAST_THEMES.map((theme, idx) => (
          <button 
            key={theme.id}
            onClick={() => setSelectedThemeIndex(idx)}
            title={theme.id}
            style={{ 
              padding: '0.4rem 0.8rem',
              borderRadius: '20px', cursor: 'pointer',
              background: theme.bg || '#ffffff',
              color: idx === 0 ? '#111' : (theme.textColor || '#111'),
              fontWeight: 700,
              fontSize: '0.85rem',
              border: selectedThemeIndex === idx ? '2px solid #141c38' : '1px solid #cbd5e1',
              boxShadow: selectedThemeIndex === idx ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              transform: selectedThemeIndex === idx ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.15s'
            }}
          >
            {theme.id.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '380px', marginBottom: '2rem' }}>
        <label style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Edit text to see how it looks:</label>
        <textarea 
          value={roastText} 
          onChange={(e) => setRoastText(e.target.value)}
          style={{ width: '100%', height: '80px', padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ width: '100%', maxWidth: '380px' }}>
        <CardVisual 
          phase={phase} 
          roastText={roastText} 
          dateStr={dateStr} 
          showButton={showButton} 
          onDownload={() => console.log('Download clicked')} 
          downloading={false} 
          isCapture={false} 
          tearing={false} 
          theme={ROAST_THEMES[selectedThemeIndex]}
        />
      </div>

      <style>{`
        @keyframes roastSpin { to { transform: rotate(360deg); } }
        @keyframes holoGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
