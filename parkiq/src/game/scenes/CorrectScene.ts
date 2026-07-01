import Phaser from 'phaser';
import type { Puzzle, EscapeStep } from '../puzzles/puzzle-types';

/** Layout constants */
const HEADER_CHECK_Y = 30;
const HEADER_CORRECT_Y = 56;
const HEADER_PILL_Y = 84;
const CARD_START_Y = 120;
const CARD_GAP = 12;
const CARD_W = 340;
const CARD_PADDING = 20;
const CARD_LEFT = 25;
const STATS_Y = 620;
const BUTTON_Y = 680;
const TOMORROW_Y = 730;

// ──────────────────────────────────────────────────────────
//  Scene
// ──────────────────────────────────────────────────────────

export class CorrectScene extends Phaser.Scene {
  private puzzle!: Puzzle;
  private timeTaken = 0;

  constructor() {
    super('CorrectScene');
  }

  preload(): void {
    this.load.audio('success', 'assets/sounds/success.mp3');
  }

  create(): void {
    const data = this.scene.settings.data as
      | { timeTaken: number; puzzle: Puzzle }
      | undefined;

    if (!data?.puzzle) {
      this.add
        .text(195, 420, 'No puzzle data', {
          fontSize: '18px',
          color: '#FFFFFF',
        })
        .setOrigin(0.5)
        .setDepth(10);
      return;
    }

    this.puzzle = data.puzzle;
    this.timeTaken = data.timeTaken ?? 0;

    this.renderHeader();
    this.renderStepCards();
    this.renderStats();
    this.renderShareButton();
    this.renderTomorrowText();
  }

  // ==========================================================
  //  HEADER
  // ==========================================================

  private renderHeader(): void {
    const answer = this.puzzle.correctAnswer;
    const answerText = this.puzzle.options[answer];

    // Green checkmark text "✓" centered, large
    this.add
      .text(195, HEADER_CHECK_Y, '✓', {
        fontSize: '36px',
        color: '#22C55E',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // "Correct!" bold white below checkmark
    this.add
      .text(195, HEADER_CORRECT_Y, 'Correct!', {
        fontSize: '22px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Green pill: answer letter + text
    this.add
      .text(195, HEADER_PILL_Y, `${answer}: ${answerText}`, {
        fontSize: '13px',
        color: '#22C55E',
        backgroundColor: '#1a3a1a',
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  // ==========================================================
  //  STEP CARDS (stacked, not swipeable)
  // ==========================================================

  private renderStepCards(): void {
    let currentY = CARD_START_Y;

    for (const step of this.puzzle.escapeSteps) {
      const cardHeight = this.renderOneCard(step, currentY);
      currentY += cardHeight + CARD_GAP;
    }
  }

  /**
   * Render a single step card starting at (CARD_LEFT, y).
   * Returns the height of the rendered card so the caller can stack them.
   */
  private renderOneCard(step: EscapeStep, y: number): number {
    // Play success sound when the final step (step 4) renders
    if (step.stepNumber === 4) {
      try {
        this.sound.play('success');
      } catch {
        // Audio context may still be locked — silently skip
      }
    }

    const card = this.add.container(CARD_LEFT, y);
    card.setDepth(5);

    // ── Background — rounded rect ─────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x1c1c1e, 1);
    card.add(bg);

    // ── Step header: green circle + number ────────────────
    const circleGfx = this.add.graphics();
    circleGfx.fillStyle(0x22c55e, 1);
    circleGfx.fillCircle(16, 16, 11);
    card.add(circleGfx);

    const numText = this.add
      .text(16, 16, `${step.stepNumber}`, {
        fontSize: '12px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    card.add(numText);

    // Step title
    const titleText = this.add.text(36, 8, step.title, {
      fontSize: '14px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    card.add(titleText);

    // ── Description with highlighted word ─────────────────
    const hlWord = step.highlightWord;
    const desc = step.description;
    const hlIndex = desc.toLowerCase().indexOf(hlWord.toLowerCase());

    const descW = CARD_W - CARD_PADDING * 2 - 4;
    let descY = 34;

    if (hlIndex === -1) {
      // Highlight word not found — render full description in white
      const txt = this.add.text(CARD_PADDING, descY, desc, {
        fontSize: '12px',
        color: '#FFFFFF',
        wordWrap: { width: descW },
        lineSpacing: 3,
      });
      card.add(txt);
      descY += txt.height + 8;
    } else {
      // Split at the highlight word
      const before = desc.slice(0, hlIndex);
      const hl = desc.slice(hlIndex, hlIndex + hlWord.length);
      const after = desc.slice(hlIndex + hlWord.length);

      // All three parts positioned sequentially
      let cursorX = CARD_PADDING;
      const lineH = 17;

      if (before) {
        const t = this.add.text(cursorX, descY, before, {
          fontSize: '12px',
          color: '#FFFFFF',
          wordWrap: { width: descW },
          lineSpacing: 3,
        });
        card.add(t);
        // Approximate whether text wrapped to next line
        const approxLines = Math.ceil(t.width / descW);
        if (approxLines > 1) {
          cursorX = CARD_PADDING;
          descY += (approxLines - 1) * lineH;
        } else {
          cursorX += t.width;
        }
      }

      if (hl) {
        const remainingW = descW - (cursorX - CARD_PADDING);
        const t = this.add.text(cursorX, descY, hl, {
          fontSize: '12px',
          color: '#22C55E',
          fontStyle: 'bold',
          wordWrap: { width: Math.max(remainingW, descW / 2) },
          lineSpacing: 3,
        });
        card.add(t);
        cursorX += t.width;
      }

      if (after) {
        const remainingW = descW - (cursorX - CARD_PADDING);
        const t = this.add.text(cursorX, descY, after, {
          fontSize: '12px',
          color: '#FFFFFF',
          wordWrap: { width: Math.max(remainingW, descW / 2) },
          lineSpacing: 3,
        });
        card.add(t);
      }

      // Calculate total height used by description
      const descLines = Math.ceil(
        (desc.length * 7) / descW, // rough char width 7px at 12px font
      );
      descY = 34 + Math.max(descLines * lineH, 20) + 8;
    }

    const cardH = descY + 8;

    // Redraw background with proper height
    bg.clear();
    bg.fillStyle(0x1c1c1e, 1);
    bg.fillRoundedRect(0, 0, CARD_W, cardH, 10);

    return cardH;
  }

  // ==========================================================
  //  STATS
  // ==========================================================

  private renderStats(): void {
    const pillW = 100;
    const pillH = 44;
    const gap = 10;
    const totalW = 3 * pillW + 2 * gap;
    const startX = 195 - totalW / 2;

    const stats: { label: string; value: string }[] = [
      { label: 'Answer', value: this.puzzle.correctAnswer },
      { label: 'Streak', value: '--' },
      { label: 'Time', value: `${this.timeTaken}s` },
    ];

    for (let i = 0; i < stats.length; i++) {
      const px = startX + i * (pillW + gap);
      this.renderPill(px, STATS_Y, pillW, pillH, stats[i]!.label, stats[i]!.value);
    }
  }

  private renderPill(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    value: string,
  ): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x2a2a2a, 1);
    gfx.fillRoundedRect(x, y - h / 2, w, h, 8);
    gfx.setDepth(10);

    this.add
      .text(x + w / 2, y - 6, label, {
        fontSize: '9px',
        color: '#6B7280',
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(x + w / 2, y + 10, value, {
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);
  }

  // ==========================================================
  //  SHARE RESULT BUTTON
  // ==========================================================

  private renderShareButton(): void {
    const btn = this.add
      .text(195, BUTTON_Y, 'SHARE RESULT', {
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
      this.scene.start('ResultScene', {
        puzzle: this.puzzle,
        timeTaken: this.timeTaken,
        wasCorrect: true,
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

  // ==========================================================
  //  "COME BACK TOMORROW"
  // ==========================================================

  private renderTomorrowText(): void {
    this.add
      .text(195, TOMORROW_Y, 'Come back tomorrow for the next puzzle', {
        fontSize: '12px',
        color: '#6B7280',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  override update(): void {
    // No per-frame logic needed
  }
}
