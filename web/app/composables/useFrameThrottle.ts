export function useFrameThrottle() {
  return computed(() => Math.round(1000 / useFps().value));
}
