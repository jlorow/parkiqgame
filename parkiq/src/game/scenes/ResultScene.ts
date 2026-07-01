import Phaser from 'phaser';
import type { Puzzle } from '../puzzles/puzzle-types';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  preload(): void {}

  create(): void {
    const data = this.scene.settings.data as
      | { puzzle?: Puzzle; timeTaken?: number; wasCorrect?: boolean }
      | undefined;

    if (!data?.puzzle) {
      this.add.text(20, 20, 'ResultScene', {
        color: '#FFFFFF',
        fontSize: '28px',
      });

      const btn = this.add
        .text(195, 420, '→ PuzzleScene', {
          fontSize: '20px',
          color: '#ffffff',
          backgroundColor: '#e8320a',
          padding: { x: 16, y: 12 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.scene.start('PuzzleScene', { test: true });
        });

      btn.setDepth(10);
      return;
    }

    // Real data from CorrectScene
    const { puzzle, timeTaken, wasCorrect } = data;

    this.add
      .text(195, 100, wasCorrect ? 'Correct!' : 'Incorrect', {
        fontSize: '24px',
        color: wasCorrect ? '#22C55E' : '#EF4444',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(195, 140, `Puzzle #${puzzle.id}`, {
        fontSize: '16px',
        color: '#FFFFFF',
      })
      .setOrigin(0.5)
      .setDepth(10);

    if (timeTaken !== undefined) {
      this.add
        .text(195, 180, `Time: ${timeTaken}s`, {
          fontSize: '14px',
          color: '#6B7280',
        })
        .setOrigin(0.5)
        .setDepth(10);
    }

    // Navigation back to PuzzleScene
    const btn = this.add
      .text(195, 420, '← Back to Puzzle', {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#e8320a',
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    btn.on('pointerdown', () => {
      this.scene.start('PuzzleScene', { test: true });
    });
  }

  override update(): void {}
}
