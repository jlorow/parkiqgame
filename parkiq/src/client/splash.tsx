import './index.css';

import { context, requestExpandedMode } from '@devvit/web/client';
import { useEffect, useState } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const BG_FALLBACK = '#0f0f14';

export const Splash = () => {
  const [bgReady, setBgReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgReady(true);
    img.onerror = () =>
      console.warn(
        '[ParkIQ] public/splash-bg.webp not found — using fallback solid background.',
      );
    img.src = '/splash-bg.webp';
  }, []);

  return (
    <div
      className="flex relative flex-col justify-center items-center min-h-screen"
      style={{
        backgroundColor: BG_FALLBACK,
        backgroundImage: bgReady ? 'url(/splash-bg.webp)' : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* PLAY button */}
      <button
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        className="cursor-pointer select-none"
        style={{
          backgroundColor: '#E8320A',
          color: '#FFFFFF',
          fontSize: '28px',
          fontWeight: 800,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '4px',
          padding: '14px 48px',
          border: '3px solid #000000',
          borderRadius: '6px',
          boxShadow: '0 4px 0 #000000, 0 6px 12px rgba(0,0,0,0.5)',
        }}
      >
        PLAY
      </button>

      {/* Credit — bottom-left */}
      <span
        className="absolute bottom-3 left-3"
        style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '11px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Made by u/{context.username ?? 'ParkIQ'}
      </span>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>,
);
