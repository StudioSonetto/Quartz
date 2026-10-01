export const SNAPSHOT_WIDTH = 768;

export type Size = { width: number; height: number };

export function snapshotScale(rect: Size, width: number) {
  if (rect.width <= 0 || rect.height <= 0) return null;

  return width / rect.width;
}

export function snapshotSource(clone: Size, scale: number, canvas: Size) {
  const clamp = (value: number, max: number) =>
    Math.max(1, Math.min(Math.floor(value * scale), max));

  return {
    width: clamp(clone.width, canvas.width),
    height: clamp(clone.height, canvas.height),
  };
}
