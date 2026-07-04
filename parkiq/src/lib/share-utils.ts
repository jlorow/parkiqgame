/**
 * Generates a Wordle-style shareable text card for the puzzle result.
 *
 * Format:
 *   ParkIQ #N
 *   🟩🟥🟩🟩🟩
 *   parkiq.app
 *
 * If the answer was incorrect, the first block is replaced with 🟥.
 * Otherwise, the original shareBlocks are used as-is.
 */
export function generateShareText(
  puzzleId: number,
  wasCorrect: boolean,
  shareBlocks: string[]
): string {
  const blocks = wasCorrect
    ? shareBlocks.join('')
    : '🟥' + shareBlocks.slice(1).join('');
  return `ParkIQ #${puzzleId}\n${blocks}\nparkiq.app`;
}
