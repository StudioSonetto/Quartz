function transformStyle(
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
    ...offsetStyle(transform.position),
    zIndex: transform.position.z,
    transform: transformStyle(transform, scale),
  };
}

export function offsetStyle(position: { x: number; y: number }) {
  return {
    left: `${(position.x / 1920) * 100}%`,
    top: `${(position.y / 1080) * 100}%`,
  };
}
