import Phaser from 'phaser';
import { getLeaderboard } from '../../lib/devvit-client';
import { getGameState } from '../PhaserGame';
import { getTodaysPuzzle } from '../../lib/puzzle-engine';

// ──────────────────────────────────────────────────────────
//  Layout Constants
// ──────────────────────────────────────────────────────────

const TITLE_Y = 40;
const LIST_START_Y = 90;
const ROW_HEIGHT = 40;
const RANK_X = 30;
const NAME_X = 60;
const SCORE_X = 360;
const BACK_BTN_Y = 700;

// ──────────────────────────────────────────────────────────
//  Scene
// ──────────────────────────────────────────────────────────

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('LeaderboardScene');
  }

  preload(): void {
    // No assets to preload
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0F0F0F');

    const gameState = getGameState();
    const currentUserId = gameState.userId;
    const serverDate = gameState.serverDate;

    this.renderTitle();
    this.renderLoading();

    // Fetch leaderboard data from the real API endpoint
    getLeaderboard()
      .then((data) => {
        this.renderLeaderboard(data.entries, currentUserId);
      })
      .catch((error) => {
        console.error('[LeaderboardScene] Failed to fetch leaderboard:', error);
        this.add
          .text(195, 200, 'Unable to load leaderboard', {
            fontSize: '14px',
            color: '#6B7280',
          })
          .setOrigin(0.5)
          .setDepth(10);
      });

    this.renderBackButton(serverDate);
  }

  // ==========================================================
  //  TITLE
  // ==========================================================

  private renderTitle(): void {
    this.add
      .text(195, TITLE_Y, "TODAY'S TOP 10", {
        fontSize: '20px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  // ==========================================================
  //  LOADING STATE
  // ==========================================================

  private loadingText?: Phaser.GameObjects.Text;

  private renderLoading(): void {
    this.loadingText = this.add
      .text(195, 200, 'Loading...', {
        fontSize: '14px',
        color: '#6B7280',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  // ==========================================================
  //  LEADERBOARD LIST
  // ==========================================================

  private renderLeaderboard(
    entries: { userId: string; score: number; rank: number }[],
    currentUserId: string,
  ): void {
    // Remove loading indicator
    if (this.loadingText) {
      this.loadingText.destroy();
    }

    if (!entries || entries.length === 0) {
      this.add
        .text(195, 200, 'No scores yet today', {
          fontSize: '16px',
          color: '#6B7280',
        })
        .setOrigin(0.5)
        .setDepth(10);
      return;
    }

    const maxDisplay = Math.min(entries.length, 10);

    for (let i = 0; i < maxDisplay; i++) {
      const entry = entries[i]!;
      const y = LIST_START_Y + i * ROW_HEIGHT;
      const isCurrentUser = entry.userId === currentUserId;

      // Highlight background for current user
      if (isCurrentUser) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xe8320a, 0.15);
        gfx.fillRoundedRect(20, y - ROW_HEIGHT / 2 + 2, 350, ROW_HEIGHT - 4, 6);
        gfx.setDepth(9);
      }

      // Rank number in muted gray
      this.add
        .text(RANK_X, y, `${entry.rank}.`, {
          fontSize: '14px',
          color: '#6B7280',
        })
        .setOrigin(0, 0.5)
        .setDepth(10);

      // Username truncated to 12 characters
      const displayName =
        entry.userId.length > 12
          ? `${entry.userId.slice(0, 12)}…`
          : entry.userId;

      this.add
        .text(NAME_X, y, displayName, {
          fontSize: '14px',
          color: isCurrentUser ? '#E8320A' : '#FFFFFF',
          fontStyle: isCurrentUser ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5)
        .setDepth(10);

      // Score right-aligned in white
      this.add
        .text(SCORE_X, y, `${entry.score}`, {
          fontSize: '14px',
          color: '#FFFFFF',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5)
        .setDepth(10);
    }
  }

  // ==========================================================
  //  BACK BUTTON
  // ==========================================================

  private renderBackButton(serverDate: Date): void {
    const backBtn = this.add
      .text(195, BACK_BTN_Y, '← Back', {
        fontSize: '18px',
        color: '#FFFFFF',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    backBtn.on('pointerdown', () => {
      void this.scene.start('PuzzleScene', {
        puzzle: getTodaysPuzzle(serverDate),
      });
    });

    // Hover effect
    backBtn.on('pointerover', () => {
      backBtn.setStyle({ color: '#E8320A' });
    });

    backBtn.on('pointerout', () => {
      backBtn.setStyle({ color: '#FFFFFF' });
    });
  }

  override update(): void {
    // No per-frame logic needed
  }
}
