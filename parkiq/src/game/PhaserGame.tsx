import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { CorrectScene } from './scenes/CorrectScene';
import { PuzzleScene } from './scenes/PuzzleScene';
import { ResultScene } from './scenes/ResultScene';
import { WrongAnswerScene } from './scenes/WrongAnswerScene';
import { getTodaysPuzzle } from '../lib/puzzle-engine';

export const PhaserGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Temporary placeholder: compute today's puzzle from device clock.
    // In production (Epic 6 Story 2), the server-side date from Devvit's
    // message bridge will replace new Date() here.
    const todaysPuzzle = getTodaysPuzzle(new Date());

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
      // PuzzleScene is started manually with puzzle data (below), not auto-started
      scene: [WrongAnswerScene, CorrectScene, ResultScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Add and start PuzzleScene with today's puzzle data on first boot
    game.scene.add('PuzzleScene', PuzzleScene, true, { puzzle: todaysPuzzle });

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
