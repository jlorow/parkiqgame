import Phaser from 'phaser';

// ──────────────────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────────────────

/** Current press state of all four driving directions */
export type DrivingInputState = {
  forward: boolean;
  reverse: boolean;
  left: boolean;
  right: boolean;
};

/** Directional button descriptor used internally */
type ButtonDef = {
  id: keyof DrivingInputState;
  label: string;
  /** Offset from the control-pad centre (px) */
  offsetX: number;
  offsetY: number;
};

// ──────────────────────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────────────────────

const BUTTON_RADIUS = 35; // 70px diameter
const BUTTON_COLOR = 0xe8320a;
const BUTTON_DARK = 0xc42808;
const GLOW_COLOR = 0xe8320a;
const ICON_COLOR = '#FFFFFF';
const ICON_SIZE = '24px';
const SHADOW_ALPHA = 0.25;
const GLOW_ALPHA_IDLE = 0;
const GLOW_ALPHA_ACTIVE = 0.35;
const GLOW_RADIUS_EXTRA = 10; // extra px beyond button radius
const PRESS_SCALE = 0.92;
const ANIM_DURATION_DOWN = 90;
const ANIM_DURATION_UP = 100;

/** Diamond layout offsets from pad centre */
const BUTTON_DEFS: ButtonDef[] = [
  { id: 'forward', label: '▲',  offsetX: 0,       offsetY: -BUTTON_RADIUS * 2 - 8 },
  { id: 'left',    label: '◀',  offsetX: -BUTTON_RADIUS * 2 - 8, offsetY: 0 },
  { id: 'right',   label: '▶',  offsetX:  BUTTON_RADIUS * 2 + 8, offsetY: 0 },
  { id: 'reverse', label: '▼',  offsetX: 0,       offsetY:  BUTTON_RADIUS * 2 + 8 },
];

// ──────────────────────────────────────────────────────────
//  Per-button visual state
// ──────────────────────────────────────────────────────────

type ButtonState = {
  gfx: Phaser.GameObjects.Graphics;
  glow: Phaser.GameObjects.Graphics;
  shadow: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
};

/**
 * Interactive driving-control pad with press/release animations.
 *
 * Layout (diamond):
 *
 *            ▲
 *         FORWARD
 *
 *   ◀ LEFT        RIGHT ▶
 *
 *         REVERSE
 *            ▼
 *
 * Each button:
 *  - 70px circle with uiAccent fill
 *  - White arrow icon
 *  - Subtle drop shadow
 *  - Pulsing glow on press
 *  - Scale-down feedback (92% on press)
 */
export class DrivingControls {
  private scene: Phaser.Scene;
  private padX: number;
  private padY: number;
  private soundKey: string | undefined;

  /** Current input state */
  private state: DrivingInputState = {
    forward: false,
    reverse: false,
    left: false,
    right: false,
  };

  /** Per-button visual state */
  private buttons: ButtonState[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    soundKey?: string,
  ) {
    this.scene = scene;
    this.padX = x;
    this.padY = y;
    this.soundKey = soundKey;

    for (const def of BUTTON_DEFS) {
      this.createButton(def);
    }
  }

  // ────────────────────────────────────────────────────────
  //  Public API
  // ────────────────────────────────────────────────────────

  /** Returns a snapshot of the current input state */
  getState(): DrivingInputState {
    return { ...this.state };
  }

  /** Destroy all button visuals */
  destroy(): void {
    for (const btn of this.buttons) {
      btn.gfx.destroy();
      btn.glow.destroy();
      btn.shadow.destroy();
      btn.text.destroy();
    }
    this.buttons = [];
  }

  // ────────────────────────────────────────────────────────
  //  Internal
  // ────────────────────────────────────────────────────────

  private createButton(def: ButtonDef): void {
    const btnX = this.padX + def.offsetX;
    const btnY = this.padY + def.offsetY;

    // Shadow circle (offset 2px down-right, behind everything else)
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, SHADOW_ALPHA);
    shadow.fillCircle(btnX + 2, btnY + 2, BUTTON_RADIUS);
    shadow.setDepth(9);

    // Glow circle (behind button, invisible when idle)
    const glow = this.scene.add.graphics();
    glow.fillStyle(GLOW_COLOR, GLOW_ALPHA_IDLE);
    glow.fillCircle(btnX, btnY, BUTTON_RADIUS + GLOW_RADIUS_EXTRA);
    glow.setDepth(9);

    // Button circle
    const gfx = this.scene.add.graphics({ x: btnX, y: btnY });
    gfx.fillStyle(BUTTON_COLOR, 1);
    gfx.fillCircle(0, 0, BUTTON_RADIUS);
    gfx.setDepth(10);

    // Make interactive with a circular hit area
    gfx.setInteractive(
      new Phaser.Geom.Circle(0, 0, BUTTON_RADIUS),
      Phaser.Geom.Circle.Contains,
    );

    // Label text
    const text = this.scene.add.text(btnX, btnY, def.label, {
      fontSize: ICON_SIZE,
      color: ICON_COLOR,
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    text.setDepth(11);

    // ── Events ─────────────────────────────────────────

    gfx.on('pointerdown', () => {
      this.state[def.id] = true;

      // Scale down
      this.scene.tweens.killTweensOf([gfx, text]);
      this.scene.tweens.add({
        targets: [gfx, text],
        scale: PRESS_SCALE,
        duration: ANIM_DURATION_DOWN,
        ease: 'Sine.easeOut',
      });

      // Glow on
      glow.clear();
      glow.fillStyle(GLOW_COLOR, GLOW_ALPHA_ACTIVE);
      glow.fillCircle(btnX, btnY, BUTTON_RADIUS + GLOW_RADIUS_EXTRA);

      // Darken button fill
      gfx.clear();
      gfx.fillStyle(BUTTON_DARK, 1);
      gfx.fillCircle(0, 0, BUTTON_RADIUS);

      // Sound
      this.tryPlaySound();
    });

    const handleUp = () => {
      if (!this.state[def.id]) return;
      this.state[def.id] = false;

      // Animate back
      this.scene.tweens.killTweensOf([gfx, text]);
      this.scene.tweens.add({
        targets: [gfx, text],
        scale: 1.0,
        duration: ANIM_DURATION_UP,
        ease: 'Sine.easeOut',
      });

      // Glow off
      glow.clear();
      glow.fillStyle(GLOW_COLOR, GLOW_ALPHA_IDLE);
      glow.fillCircle(btnX, btnY, BUTTON_RADIUS + GLOW_RADIUS_EXTRA);

      // Restore colour
      gfx.clear();
      gfx.fillStyle(BUTTON_COLOR, 1);
      gfx.fillCircle(0, 0, BUTTON_RADIUS);
    };

    gfx.on('pointerup', handleUp);
    gfx.on('pointerout', handleUp);

    this.buttons.push({ gfx, glow, shadow, text });
  }

  private tryPlaySound(): void {
    if (!this.soundKey) return;
    try {
      this.scene.sound.play(this.soundKey);
    } catch {
      // Audio context may be locked — silently skip
    }
  }
}
