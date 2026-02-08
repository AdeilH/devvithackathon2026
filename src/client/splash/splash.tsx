import '../index.css';

import { navigateTo, context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SHAPE_TYPES, SHAPE_COLORS } from '../../shared/types/api';

type ShapeClip = {
  shape: string;
  color: string;
  clip: string;
};

const shapePalette: ShapeClip[] = SHAPE_TYPES.map((shape, idx) => ({
  shape,
  color: SHAPE_COLORS[idx % SHAPE_COLORS.length],
  clip: getClip(shape),
}));

function getClip(shape: string): string {
  switch (shape) {
    case 'triangle':
      return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'square':
      return 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
    case 'pentagon':
      return 'polygon(50% 0%, 95% 35%, 78% 100%, 22% 100%, 5% 35%)';
    case 'hexagon':
      return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    case 'octagon':
      return 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
    case 'star':
      return 'polygon(50% 0%, 61% 38%, 100% 38%, 68% 59%, 79% 100%, 50% 75%, 21% 100%, 32% 59%, 0% 38%, 39% 38%)';
    case 'arrow':
      return 'polygon(50% 0%, 90% 40%, 70% 40%, 70% 100%, 30% 100%, 30% 40%, 10% 40%)';
    default:
      return 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
  }
}

export const Splash = () => {
  const username = context.username ?? 'player';

  return (
    <div className="min-h-screen max-h-screen overflow-hidden bg-[#0b0f1a] text-white flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img className="w-14 h-14" src="/snoo.png" alt="Snoo" />
            <div>
              <p className="text-sm text-[#9fb2c8]">Welcome back, {username}!</p>
              <h1 className="text-3xl font-extrabold tracking-tight">ShapeSwifter</h1>
              <p className="text-sm text-[#b8c7db]">Flip, rotate, and morph to match the target.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              className="bg-[#2ed4ff] hover:bg-[#19bde6] text-[#0b0f1a] font-semibold px-5 py-3 rounded-full shadow-lg shadow-[#2ed4ff33] transition-colors"
              onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
            >
              Play Today’s Puzzle
            </button>
            <button
              className="bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-3 rounded-full border border-white/15 transition-colors"
              onClick={() => navigateTo('https://www.reddit.com/r/ShapeSwifter')}
            >
              View Community
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[#9fb2c8] mb-3">
            <span>Shapes</span>
            <span>Preview</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {shapePalette.map(({ shape, color, clip }) => (
              <div
                key={shape}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-2"
              >
                <div
                  className="w-12 h-12 rounded-lg"
                  style={{
                    background: color,
                    boxShadow: `0 0 16px ${color}55`,
                    clipPath: clip,
                  }}
                />
                <span className="text-sm uppercase tracking-[0.12em] text-[#d8e4f4] whitespace-nowrap">
                  {shape}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
