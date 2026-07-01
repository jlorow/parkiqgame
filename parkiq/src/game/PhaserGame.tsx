import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { CorrectScene } from './scenes/CorrectScene';
import { PuzzleScene } from './scenes/PuzzleScene';
import { ResultScene } from './scenes/ResultScene';
import { WrongAnswerScene } from './scenes/WrongAnswerScene';

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
      parent: containerRef.current,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [PuzzleScene, WrongAnswerScene, CorrectScene, ResultScene],
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
      className="w-full h-full flex items-center justify-center bg-[#0F0F0F]"
    />
  );
};
