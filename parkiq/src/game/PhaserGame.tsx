import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PuzzleScene } from './scenes/PuzzleScene';

export const PhaserGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 390,
      height: 844,
      backgroundColor: '#0F0F0F',
      pixelArt: true,
      parent: containerRef.current,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 390,
        height: 844,
      },
      audio: {
        disableWebAudio: false,
      },
      scene: [PuzzleScene],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: 'min(100vw, calc(100vh * 390 / 844))',
        height: 'min(100vh, calc(100vw * 844 / 390))',
        backgroundColor: '#0F0F0F',
      }}
    />
  );
};
