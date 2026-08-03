/** Device-pixel size of a captured snapshot, matching the 16:9 slide canvas. */
export const SNAPSHOT_WIDTH = 1920;
export const SNAPSHOT_HEIGHT = (SNAPSHOT_WIDTH / 16) * 9;

export type Size = { width: number; height: number };

/**
 * Resampling factor for the capture. html2canvas measures the element itself,
 * so this only has to land the output near SNAPSHOT_WIDTH — `snapshotSource`
 * corrects the exact figure afterwards.
 */
export function snapshotScale(rect: Size) {
  if (rect.width <= 0 || rect.height <= 0) return null;

  return SNAPSHOT_WIDTH / rect.width;
}

/**
 * Area of the captured canvas that html2canvas actually painted.
 *
 * `.render` is sized from viewport units (`30vw` inspector, `6.28%` padding),
 * so it re-resolves to a slightly different width inside html2canvas's clone
 * iframe than on the live page. The capture is padded out to the declared size
 * with the background colour, so cropping to the clone's own box is what keeps
 * that padding out of the thumbnail.
 */
export function snapshotSource(clone: Size, scale: number, canvas: Size) {
  // Floor, never round: rounding up samples the sub-pixel filler beyond the
  // painted content, which stretches into a visible light edge.
  const clamp = (value: number, max: number) =>
    Math.max(1, Math.min(Math.floor(value * scale), max));

  return {
    width: clamp(clone.width, canvas.width),
    height: clamp(clone.height, canvas.height),
  };
}
