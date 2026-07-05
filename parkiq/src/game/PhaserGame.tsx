import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PuzzleScene } from './scenes/PuzzleScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { AlreadyPlayedScene } from './scenes/AlreadyPlayedScene';
import { getTodaysPuzzle } from '../lib/puzzle-engine';
import { getUserData } from '../lib/devvit-client';

type GameState = {
  userId: string;
  streak: number;
  lastPlayed: string | null;
  serverDate: Date;
};

// Global game state (module-level)
let globalGameState: GameState = {
  userId: 'anonymous',
  streak: 0,
  lastPlayed: null,
  serverDate: new Date(),
};

export const PhaserGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Async initialization: fetch user data from server, then create game
    const initGame = async () => {
      // Fetch user data from Devvit backend (replaces device clock with server time)
      const userData = await getUserData();
      const serverDate = new Date(userData.serverDate);

      // Store game state globally for access by scenes
      globalGameState = {
        userId: userData.userId,
        streak: userData.streak,
        lastPlayed: userData.lastPlayed,
        serverDate,
      };

      console.log(
        '[PhaserGame] Initialized with:',
        globalGameState
      );

      // Get today's puzzle using server-provided date (not device clock)
      const todaysPuzzle = getTodaysPuzzle(serverDate);

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 390,
        height: 844,
        backgroundColor: '#0F0F0F',
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
        // PuzzleScene is started manually with puzzle data (below), not auto-started
        scene: [LeaderboardScene, AlreadyPlayedScene],
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      // Check if user already played today
      const today = new Date(serverDate).toISOString().split('T')[0];
      const alreadyPlayed = globalGameState.lastPlayed === today;

      if (alreadyPlayed) {
        // Show the "Already Played Today" screen instead of the puzzle
        game.scene.add('PuzzleScene', PuzzleScene, false);
        game.scene.start('AlreadyPlayedScene');
      } else {
        // Add and start PuzzleScene with today's puzzle data on first boot
        game.scene.add('PuzzleScene', PuzzleScene, true, { puzzle: todaysPuzzle });
      }
    };

    void initGame();

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

/**
 * Get the current game state (userId, streak, etc.)
 * Used by scenes to access shared data.
 */
export function getGameState(): GameState {
  return globalGameState;
}
