import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PhaserGame } from '../game/PhaserGame';

export const App = () => {
  return (
    <div className="w-full h-full overflow-hidden bg-[#0F0F0F]">
      <PhaserGame />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
