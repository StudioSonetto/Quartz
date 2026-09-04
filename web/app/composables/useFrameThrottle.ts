export const useFrameThrottle = createSharedComposable(() => {
  const fps = useFps();

  return computed(() => (fps.value ? Math.round(1000 / fps.value) : 16));
});
