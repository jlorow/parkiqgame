import Phaser from 'phaser';
import type { Puzzle } from '../puzzles/puzzle-types';
import { createParkingGrid } from '../components/ParkingGrid';
import { generateShareText } from '../../lib/share-utils';

// ──────────────────────────────────────────────────────────
//  Layout Constants
// ──────────────────────────────────────────────────────────

const TOP_BAR_Y = 24;
const PUZZLE_NUM_Y = 54;
const CARD_LEFT = 25;
const CARD_WIDTH = 340;
const CARD_CENTER_X = 195;
const CARD_TOP_Y = 120;
const CARD_H = 336;
const CARD_LOGO_Y = 28;
const MINI_GRID_SIZE = 180;
const MINI_GRID_Y = 56;
const BLOCKS_Y = 252;
const APP_Y = 296;
const BUTTON_Y = 490;
const FALLBACK_TEXT_Y = 550;

// ──────────────────────────────────────────────────────────
//  Scene
// ──────────────────────────────────────────────────────────

export class ResultScene extends Phaser.Scene {
  private puzzle!: Puzzle;
  private wasCorrect = true;

  constructor() {
    super('ResultScene');
  }

  preload(): void {}

  create(): void {
    const data = this.scene.settings.data as
      | { puzzle?: Puzzle; timeTaken?: number; wasCorrect?: boolean }
      | undefined;

    if (!data?.puzzle) {
      // Fallback when no puzzle data is provided
      this.add
        .text(20, 20, 'ResultScene', {
          color: '#FFFFFF',
          fontSize: '28px',
        })
        .setDepth(10);

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

    this.puzzle = data.puzzle;
    this.wasCorrect = data.wasCorrect ?? true;

    this.renderTopBar();
    this.renderShareCard();
    this.renderCopyButton();
  }

  // ==========================================================
  //  TOP BAR
  // ==========================================================

  private renderTopBar(): void {
    // "PARKIQ" — left-aligned
    this.add
      .text(20, TOP_BAR_Y, 'PARKIQ', {
        fontSize: '20px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setDepth(10);

    // "PUZZLE #N" — centered below
    this.add
      .text(CARD_CENTER_X, PUZZLE_NUM_Y, `PUZZLE #${this.puzzle.id}`, {
        fontSize: '14px',
        color: '#6B7280',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }

  // ==========================================================
  //  SHARE CARD
  // ==========================================================

  private renderShareCard(): void {
    // ── Card background (dark rounded rect) ───────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x1c1c1e, 1);
    bg.fillRoundedRect(CARD_LEFT, CARD_TOP_Y, CARD_WIDTH, CARD_H, 12);
    bg.setDepth(5);

    // ── "ParkIQ #N" bold white centered at top of card ───
    this.add
      .text(CARD_CENTER_X, CARD_TOP_Y + CARD_LOGO_Y, `ParkIQ #${this.puzzle.id}`, {
        fontSize: '18px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);

    // ── Miniature parking diagram (180×180, environment only, no cars) ──
    createParkingGrid(this, {
      x: CARD_CENTER_X - MINI_GRID_SIZE / 2,
      y: CARD_TOP_Y + MINI_GRID_Y,
      width: MINI_GRID_SIZE,
      height: MINI_GRID_SIZE,
      environment: this.puzzle.environment,
    }).setDepth(6);

    // ── Share blocks row (emoji blocks spaced evenly) ─────
    const blocks = this.puzzle.shareBlocks;
    const blockCount = blocks.length;
    const blockSpacing = 28; // px between block centers
    const totalWidth = (blockCount - 1) * blockSpacing;
    const blockStartX = CARD_CENTER_X - totalWidth / 2;

    for (let i = 0; i < blockCount; i++) {
      const block = blocks[i];
      if (block) {
        this.add
          .text(blockStartX + i * blockSpacing, CARD_TOP_Y + BLOCKS_Y, block, {
            fontSize: '20px',
          })
          .setOrigin(0.5)
          .setDepth(6);
      }
    }

    // ── "parkiq.app" in muted gray at bottom of card ─────
    this.add
      .text(CARD_CENTER_X, CARD_TOP_Y + APP_Y, 'parkiq.app', {
        fontSize: '12px',
        color: '#6B7280',
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  // ==========================================================
  //  COPY TO CLIPBOARD BUTTON
  // ==========================================================

  private renderCopyButton(): void {
    const btn = this.add
      .text(CARD_CENTER_X, BUTTON_Y, 'COPY TO CLIPBOARD', {
        fontSize: '15px',
        color: '#FFFFFF',
        backgroundColor: '#E8320A',
        padding: { x: 28, y: 14 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    btn.on('pointerdown', () => {
      // Disable button to prevent double-taps
      btn.disableInteractive();

      // Generate the Wordle-style share text
      const shareText = generateShareText(
        this.puzzle.id,
        this.wasCorrect,
        this.puzzle.shareBlocks
      );

      void navigator.clipboard.writeText(shareText).then(() => {
        // Success feedback
        btn.setText('Copied! ✓');
        btn.setStyle({ backgroundColor: '#22C55E' });

        // Revert after 2 seconds
        setTimeout(() => {
          btn.setText('COPY TO CLIPBOARD');
          btn.setStyle({ backgroundColor: '#E8320A' });
          btn.setInteractive({ useHandCursor: true });
        }, 2000);
      }).catch(() => {
        // Failure fallback: show share text as plain text below button
        btn.setText('Copy failed');
        btn.setStyle({ backgroundColor: '#EF4444' });

        this.add
          .text(CARD_CENTER_X, FALLBACK_TEXT_Y, shareText, {
            fontSize: '14px',
            color: '#FFFFFF',
            backgroundColor: '#2A2A2A',
            padding: { x: 16, y: 12 },
            wordWrap: { width: 300 },
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(10);

        // Re-enable button after 2 seconds
        setTimeout(() => {
          btn.setText('COPY TO CLIPBOARD');
          btn.setStyle({ backgroundColor: '#E8320A' });
          btn.setInteractive({ useHandCursor: true });
        }, 2000);
      });
    });

    // Hover effect
    btn.on('pointerover', () => {
      btn.setStyle({ backgroundColor: '#ff4422' });
    });

    btn.on('pointerout', () => {
      btn.setStyle({ backgroundColor: '#E8320A' });
    });
  }

  override update(): void {
    // No per-frame logic needed
  }
}
