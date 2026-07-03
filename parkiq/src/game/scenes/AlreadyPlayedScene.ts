import Phaser from 'phaser';
import { getGameState } from '../PhaserGame';
import { getTodaysPuzzle } from '../../lib/puzzle-engine';
import { getResultToday } from '../../lib/devvit-client';

// ──────────────────────────────────────────────────────────
//  Layout Constants
// ──────────────────────────────────────────────────────────

const TOP_BAR_Y = 24;
const PUZZLE_NUM_Y = 54;
const TITLE_Y = 220;
const STREAK_Y = 280;
const COUNTDOWN_Y = 340;
const SHARE_BTN_Y = 680;
const TOMORROW_Y = 730;

// ──────────────────────────────────────────────────────────
//  Scene
// ──────────────────────────────────────────────────────────

export class AlreadyPlayedScene extends Phaser.Scene {
  /** Countdown text object updated every second */
  private countdownText!: Phaser.GameObjects.Text;

  /** Timer event for the countdown */
  private timerEvent!: Phaser.Time.TimerEvent;

  /** Server-provided date (not device clock) */
  private serverDate!: Date;

  constructor() {
    super('AlreadyPlayedScene');
  }

  preload(): void {
    // No assets to preload
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0F0F0F');

    const gameState = getGameState();
    this.serverDate = gameState.serverDate;
    const streak = gameState.streak;

    // Get today's puzzle for the puzzle number display
    const todaysPuzzle = getTodaysPuzzle(this.serverDate);

    // ── Top bar ─────────────────────────────────────────

    this.add
      .text(20, TOP_BAR_Y, 'PARKIQ', {
        fontSize: '20px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setDepth(10);

    this.add
      .text(195, PUZZLE_NUM_Y, `PUZZLE #${todaysPuzzle.id}`, {
        fontSize: '14px',
        color: '#6B7280',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    // ── "You've already played today" ───────────────────

    this.add
      .text(195, TITLE_Y, "You've already played today", {
        fontSize: '22px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    // ── Streak display ──────────────────────────────────

    const streakText =
      streak > 0
        ? `🔥 Current Streak: ${streak} day${streak === 1 ? '' : 's'}`
        : 'No active streak';

    this.add
      .text(195, STREAK_Y, streakText, {
        fontSize: '16px',
        color: streak > 0 ? '#E8320A' : '#6B7280',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // ── Countdown to midnight ───────────────────────────

    const initialRemaining = this.calcSecondsUntilMidnight(this.serverDate);
    this.countdownText = this.add
      .text(195, COUNTDOWN_Y, `Next puzzle in ${this.formatCountdown(initialRemaining)}`, {
        fontSize: '14px',
        color: '#6B7280',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Update countdown every second
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onCountdownTick,
      callbackScope: this,
      loop: true,
    });

    // ── SHARE RESULT button ─────────────────────────────

    this.renderShareButton();

    // ── "Come back tomorrow!" ───────────────────────────

    this.add
      .text(195, TOMORROW_Y, 'Come back tomorrow!', {
        fontSize: '12px',
        color: '#6B7280',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  // ==========================================================
  //  COUNTDOWN
  // ==========================================================

  /**
   * Calculate seconds from the given server date until midnight
   * (end of the current day in the server's timezone).
   */
  private calcSecondsUntilMidnight(now: Date): number {
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  }

  private formatCountdown(totalSeconds: number): string {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private onCountdownTick(): void {
    // Advance server date by 1 second for the countdown calculation
    this.serverDate = new Date(this.serverDate.getTime() + 1000);
    const remaining = this.calcSecondsUntilMidnight(this.serverDate);

    if (remaining <= 0) {
      // Midnight passed — puzzle should now be available
      this.countdownText.setText('Next puzzle is available now!');
      this.timerEvent.destroy();
      return;
    }

    this.countdownText.setText(`Next puzzle in ${this.formatCountdown(remaining)}`);
  }

  // ==========================================================
  //  SHARE RESULT BUTTON
  // ==========================================================

  private renderShareButton(): void {
    const btn = this.add
      .text(195, SHARE_BTN_Y, 'SHARE RESULT', {
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

      void getResultToday().then((data) => {
        if (data.shareBlocks && data.shareBlocks.length > 0) {
          const blocks = data.shareBlocks.join('');
          const puzzleNum = getTodaysPuzzle(this.serverDate).id;
          const shareText = `ParkIQ #${puzzleNum}\n${blocks}\nparkiq.app`;

          void navigator.clipboard.writeText(shareText).then(() => {
            btn.setText('Copied! ✓');
            btn.setStyle({ backgroundColor: '#22C55E' });
          }).catch(() => {
            // Fallback: show the text directly
            btn.setText('Copy failed');
            btn.setStyle({ backgroundColor: '#EF4444' });
            btn.setInteractive({ useHandCursor: true });
          });
        } else {
          // No result found — show temporary message
          btn.setText('No result yet');
          btn.setStyle({ backgroundColor: '#6B7280' });
          setTimeout(() => {
            btn.setText('SHARE RESULT');
            btn.setStyle({ backgroundColor: '#E8320A' });
            btn.setInteractive({ useHandCursor: true });
          }, 2000);
        }
      }).catch(() => {
        btn.setText('Error loading');
        btn.setStyle({ backgroundColor: '#EF4444' });
        setTimeout(() => {
          btn.setText('SHARE RESULT');
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
