import Phaser from 'phaser';

/**
 * Draws a green dashed curved arrow from (startX, startY) to (endX, endY)
 * using a quadratic bezier curve with a natural perpendicular offset.
 * Returns the Graphics object so the caller can add it to a container if desired.
 */
export function createPathArrow(
  scene: Phaser.Scene,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  parent?: Phaser.GameObjects.Container,
): Phaser.GameObjects.Graphics {
  const gfx = scene.add.graphics();

  // ── Quadratic bezier control point ──────────────────────
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const dx = endX - startX;
  const dy = endY - startY;

  // Perpendicular offset for a natural curve (40% of direction)
  const perpX = -dy * 0.4;
  const perpY = dx * 0.4;
  const cpX = midX + perpX;
  const cpY = midY + perpY;

  // ── Pre-calculate bezier points ─────────────────────────
  const NUM_POINTS = 60;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = i / NUM_POINTS;
    const t1 = 1 - t;
    points.push({
      x: t1 * t1 * startX + 2 * t1 * t * cpX + t * t * endX,
      y: t1 * t1 * startY + 2 * t1 * t * cpY + t * t * endY,
    });
  }

  // ── Draw dashed line (4 pts drawn, 4 pts skipped = 15 dashes) ──
  const DASH = 4;
  const GAP = 4;
  gfx.lineStyle(3, 0x22c55e, 0.9);

  let drawing = true;
  let counter = 0;

  gfx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;

    if (i === 0) {
      gfx.moveTo(p.x, p.y);
      counter++;
      continue;
    }

    if (drawing) {
      gfx.lineTo(p.x, p.y);
    }

    counter++;
    if (counter >= (drawing ? DASH : GAP)) {
      counter = 0;
      if (drawing) {
        gfx.strokePath();
      }
      drawing = !drawing;
      if (drawing) {
        gfx.beginPath();
        gfx.moveTo(p.x, p.y);
      }
    }
  }

  // Flush remaining drawn segment
  if (drawing) {
    gfx.strokePath();
  }

  // ── Arrowhead ───────────────────────────────────────────
  // Tangent direction at the end of the curve
  const endTangent = Math.atan2(endY - cpY, endX - cpX);
  const headLen = 10;
  const headAngle = Math.PI / 6;

  gfx.fillStyle(0x22c55e, 0.9);
  gfx.beginPath();
  gfx.moveTo(endX, endY);
  gfx.lineTo(
    endX - headLen * Math.cos(endTangent - headAngle),
    endY - headLen * Math.sin(endTangent - headAngle),
  );
  gfx.lineTo(
    endX - headLen * Math.cos(endTangent + headAngle),
    endY - headLen * Math.sin(endTangent + headAngle),
  );
  gfx.closePath();
  gfx.fillPath();

  // ── Add to parent container if provided ─────────────────
  if (parent) {
    parent.add(gfx);
    gfx.setDepth(5);
  }

  gfx.setDepth(5);
  return gfx;
}
