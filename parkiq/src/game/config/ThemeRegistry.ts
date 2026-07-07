import type { PuzzleTheme } from '../puzzles/puzzle-types';

/**
 * ThemeRegistry — single source of truth for gameplay-critical palette colors.
 *
 * STRUCTURE
 * ────────────────────────────────────
 * THEME_GRID_COLORS  – per-theme road surface + lines + pillars + sidewalk
 * CARD_TINT          – per-theme translucent card overlay
 * THEME_FLAT_COLORS  – theme-independent colors (cars, exit zone, D-pad)
 *
 * REFERENCE
 * ────────────────────────────────────
 * Player car tint:      0xA8392E  (sampled from mockup, was 0xE8320A)
 * Exit zone color:      0x5F8F60  (sampled from mockup, was 0x22C55E)
 * Per-theme road values: sampled from mockup (see individual entries)
 *
 * COLORS NOT YET UPDATED FROM MOCKUP (keeping original values):
 *   - obstacleCarTint       (was 0x6B7280)
 *   - dpadAccentColor       (was 0xE8320A)
 *   - lines/pillar/pillarOutline/sidewalk per theme (keep original)
 */

// ── Per-theme grid colors ────────────────────────────────

export interface ThemeGridColors {
  road: number;
  lines: number;
  pillar: number;
  pillarOutline: number;
  sidewalk: number;
}

export const THEME_GRID_COLORS: Record<PuzzleTheme, ThemeGridColors> = {
  street: {
    road: 0x242730,
    lines: 0xffffff,
    pillar: 0x1f2937,
    pillarOutline: 0x374151,
    sidewalk: 0x2a2a2d,
  },
  garage: {
    road: 0x212429,
    lines: 0xfbbf24,
    pillar: 0x374151,
    pillarOutline: 0x4b5563,
    sidewalk: 0x1a2332,
  },
  rooftop: {
    road: 0x3a3d42,
    lines: 0xffffff,
    pillar: 0x9ca3af,
    pillarOutline: 0xb0b5bd,
    sidewalk: 0xbcc0c7,
  },
  underground: {
    road: 0x13161b,
    lines: 0xe8320a,
    pillar: 0x1e293b,
    pillarOutline: 0x334155,
    sidewalk: 0x131d33,
  },
};

// ── Per-theme card tint ──────────────────────────────────

export const CARD_TINT: Record<PuzzleTheme, number> = {
  street: 0x141428,
  garage: 0x0c1420,
  underground: 0x080c18,
  rooftop: 0x1c1c34,
};

// ── Theme-independent flat colors ────────────────────────

export const THEME_FLAT_COLORS = {
  /** Player car body tint (sampled from Downtown Night mockup) */
  playerCarTint: 0xa8392e,
  /** Obstacle car tint (NOT YET UPDATED — still using original value) */
  obstacleCarTint: 0x6b7280,
  /** Exit zone fill / border / chevron (sampled from mockup) */
  exitZoneColor: 0x5f8f60,
  /** D-pad accent color (NOT YET UPDATED — still using original value) */
  dpadAccentColor: 0xe8320a,
} as const;
