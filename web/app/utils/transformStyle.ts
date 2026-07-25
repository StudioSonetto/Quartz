export function transformStyle(
  transform: { scale: number; rotation: number },
  scale: number,
) {
  return `scale(${transform.scale * scale}) translate(50%, 50%) rotate(${transform.rotation}deg) translate(-50%, -50%)`;
}
