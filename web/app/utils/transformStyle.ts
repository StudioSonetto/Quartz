export function transformStyle(
  transform: { scale: number; rotation: number },
  scale: number,
) {
  return `scale(${transform.scale * scale}) translate(50%, 50%) rotate(${transform.rotation}deg) translate(-50%, -50%)`;
}

export function boxStyle(
  transform: {
    scale: number;
    rotation: number;
    position: { x: number; y: number; z: number };
  },
  scale: number,
): Record<string, string | number> {
  return {
    left: `${(transform.position.x / 1920) * 100}%`,
    top: `${(transform.position.y / 1080) * 100}%`,
    zIndex: transform.position.z,
    transform: transformStyle(transform, scale),
  };
}
