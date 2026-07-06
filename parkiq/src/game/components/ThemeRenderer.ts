import Phaser from 'phaser';
import type { PuzzleTheme } from '../puzzles/puzzle-types';

/**
 * ThemeRenderer — owns all environment drawing that lives outside the parking grid.
 *
 * Responsibilities:
 *  - Full-screen background (sky/ground gradient)
 *  - Environment beyond the lot boundary (buildings, sky, ground plane)
 *  - Theme props that frame the lot (trees, pipes, railings, building silhouettes)
 *
 * Does NOT own:
 *  - Road surface fill (ParkingGrid)
 *  - Bay lines (ParkingGrid)
 *  - Cars, shadows, exit zone, UI
 */
export class ThemeRenderer {
  private bgGfx: Phaser.GameObjects.Graphics;
  private envGfx: Phaser.GameObjects.Graphics;

  constructor(
    private scene: Phaser.Scene,
    private backgroundLayer: Phaser.GameObjects.Container,
    private themeLayer: Phaser.GameObjects.Container,
  ) {
    this.bgGfx = scene.add.graphics();
    this.envGfx = scene.add.graphics();
    backgroundLayer.add(this.bgGfx);
    themeLayer.add(this.envGfx);
  }

  render(theme: PuzzleTheme): void {
    this.bgGfx.clear();
    this.envGfx.clear();
    this.drawBackground(theme);
    this.drawEnvironment(theme);
  }

  destroy(): void {
    this.bgGfx.destroy();
    this.envGfx.destroy();
  }

  // ── Background (full-screen base) ──────────────────────────

  private drawBackground(theme: PuzzleTheme): void {
    const W = 390;
    const H = 844;

    switch (theme) {
      case 'street':
        this.drawGradient(this.bgGfx, W, H, 0x0f0f0f, 0x1a1a1a);
        break;
      case 'garage':
        this.bgGfx.fillStyle(0x0a0f14, 1);
        this.bgGfx.fillRect(0, 0, W, H);
        break;
      case 'underground':
        this.bgGfx.fillStyle(0x060a0f, 1);
        this.bgGfx.fillRect(0, 0, W, H);
        break;
      case 'rooftop':
        this.drawGradient(this.bgGfx, W, 60, 0x0a0e1a, 0x2a303f);
        this.bgGfx.fillStyle(0x9ca3af, 0.35);
        this.bgGfx.fillRect(0, 60, W, H - 60);
        break;
    }

    // Vignette edges — always applied on top of background
    this.bgGfx.fillStyle(0x000000, 0.25);
    this.bgGfx.fillRect(0, 0, W, 18);
    this.bgGfx.fillRect(0, H - 18, W, 18);
    this.bgGfx.fillRect(0, 0, 10, H);
    this.bgGfx.fillRect(W - 10, 0, 10, H);
  }

  // ── Environment (theme-specific surroundings) ──────────────

  private drawEnvironment(theme: PuzzleTheme): void {
    const W = 390;
    const H = 844;

    switch (theme) {
      case 'street':
        this.drawStreetEnv(W, H);
        break;
      case 'garage':
        this.drawGarageEnv(W, H);
        break;
      case 'underground':
        this.drawUndergroundEnv(W, H);
        break;
      case 'rooftop':
        this.drawRooftopEnv(W, H);
        break;
    }
  }

  private drawStreetEnv(W: number, H: number): void {
    const gfx = this.envGfx;
    // Sky gradient above card
    for (let y = 0; y < 120; y++) {
      const t = y / 120;
      const r = Math.floor(0x0a + (0x1a - 0x0a) * t);
      const c = (r << 16) | (r << 8) | r;
      gfx.fillStyle(c, 0.8 + 0.2 * (1 - t));
      gfx.fillRect(0, y, W, 1);
    }
    // Ground below card
    for (let y = 447; y < H; y++) {
      const t = (y - 447) / (H - 447);
      const r = Math.floor(0x2a + (0x1a - 0x2a) * Math.min(t * 2, 1));
      const g = Math.floor(0x22 + (0x14 - 0x22) * Math.min(t * 2, 1));
      const b = Math.floor(0x18 + (0x0c - 0x18) * Math.min(t * 2, 1));
      gfx.fillStyle((r << 16) | (g << 8) | b, 1);
      gfx.fillRect(0, y, W, 1);
    }
    // Grass line
    gfx.fillStyle(0x1a4a1a, 0.4);
    gfx.fillRect(0, 442, W, 6);
  }

  private drawGarageEnv(W: number, H: number): void {
    const gfx = this.envGfx;
    gfx.fillStyle(0x0a0f14, 1);
    gfx.fillRect(0, 0, W, 52);
    gfx.fillStyle(0x1f2937, 1);
    gfx.fillRect(0, 44, W, 8);
    gfx.fillStyle(0x0d1117, 1);
    gfx.fillRect(0, 447, W, H - 447);
    gfx.lineStyle(1, 0x374151, 0.4);
    gfx.beginPath();
    gfx.moveTo(0, 447);
    gfx.lineTo(W, 447);
    gfx.strokePath();
  }

  private drawUndergroundEnv(W: number, H: number): void {
    const gfx = this.envGfx;
    gfx.fillStyle(0x060a0f, 1);
    gfx.fillRect(0, 0, W, 52);
    for (let sx = 0; sx < W; sx += 8) {
      const isRed = Math.floor(sx / 8) % 2 === 0;
      gfx.fillStyle(isRed ? 0xe8320a : 0xffffff, isRed ? 0.35 : 0.12);
      gfx.fillRect(sx, 44, 8, 8);
    }
    gfx.fillStyle(0x4a5568, 0.6);
    gfx.fillRect(50, 30, 8, 16);
    gfx.fillRect(130, 28, 10, 18);
    gfx.fillRect(210, 32, 8, 14);
    gfx.fillRect(290, 29, 10, 17);
    gfx.fillRect(350, 31, 8, 15);
    gfx.fillStyle(0x060a0f, 1);
    gfx.fillRect(0, 447, W, H - 447);
    gfx.lineStyle(1, 0xe8320a, 0.15);
    gfx.beginPath();
    gfx.moveTo(0, 447);
    gfx.lineTo(W, 447);
    gfx.strokePath();
  }

  private drawRooftopEnv(W: number, H: number): void {
    const gfx = this.envGfx;
    for (let y = 0; y < 60; y++) {
      const t = y / 60;
      const r = Math.floor(0x0a + (0x2a - 0x0a) * t);
      const g = Math.floor(0x0e + (0x30 - 0x0e) * t);
      const b = Math.floor(0x1a + (0x40 - 0x1a) * t);
      gfx.fillStyle((r << 16) | (g << 8) | b, 1);
      gfx.fillRect(0, y, W, 1);
    }
    gfx.fillStyle(0x1a1a2e, 0.7);
    const buildings = [
      { x: 0, w: 50, h: 42 }, { x: 55, w: 30, h: 32 },
      { x: 90, w: 44, h: 44 }, { x: 140, w: 26, h: 28 },
      { x: 172, w: 38, h: 36 }, { x: 218, w: 48, h: 48 },
      { x: 270, w: 20, h: 24 }, { x: 295, w: 95, h: 38 },
    ];
    for (const b of buildings) {
      gfx.fillRect(b.x, 52 - b.h, b.w, b.h);
    }
    gfx.fillStyle(0x4a6741, 0.3);
    const windows: Array<{ x: number; y: number }> = [
      { x: 16, y: 22 }, { x: 32, y: 30 },
      { x: 100, y: 18 }, { x: 114, y: 26 },
      { x: 182, y: 24 }, { x: 196, y: 20 },
      { x: 230, y: 14 }, { x: 244, y: 22 }, { x: 254, y: 34 },
    ];
    for (const w of windows) {
      gfx.fillRect(w.x, 52 - w.y, 4, 4);
    }
    gfx.fillStyle(0x9ca3af, 0.35);
    gfx.fillRect(0, 447, W, H - 447);
    gfx.lineStyle(2, 0x6b7280, 0.5);
    gfx.beginPath();
    gfx.moveTo(0, 450);
    gfx.lineTo(W, 450);
    for (let px = 0; px < W; px += 30) {
      gfx.moveTo(px, 447);
      gfx.lineTo(px, 453);
    }
    gfx.strokePath();
  }

  // ── Utility ────────────────────────────────────────────────

  private drawGradient(
    gfx: Phaser.GameObjects.Graphics,
    W: number,
    H: number,
    colorTop: number,
    colorBottom: number,
  ): void {
    const steps = 32;
    const stepH = Math.ceil(H / steps);
    const rTop = (colorTop >> 16) & 0xff;
    const gTop = (colorTop >> 8) & 0xff;
    const bTop = colorTop & 0xff;
    const rBot = (colorBottom >> 16) & 0xff;
    const gBot = (colorBottom >> 8) & 0xff;
    const bBot = colorBottom & 0xff;

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(rTop + (rBot - rTop) * t);
      const g = Math.floor(gTop + (gBot - gTop) * t);
      const b = Math.floor(bTop + (bBot - bTop) * t);
      gfx.fillStyle((r << 16) | (g << 8) | b, 1);
      gfx.fillRect(0, i * stepH, W, stepH);
    }
  }
}
