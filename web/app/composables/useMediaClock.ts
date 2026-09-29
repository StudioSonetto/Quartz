const blocked = ref(false);

export function useMediaSound() {
  return { blocked: readonly(blocked), unblock: () => (blocked.value = false) };
}

export function useMediaClock(
  video: HTMLVideoElement,
  options: {
    timing: () => MediaTiming;
    audible: () => boolean;
    shown?: () => boolean;
  },
) {
  const { playing, nodeTime } = usePlayhead();
  const known = ref(0);

  const scope = effectScope();

  scope.run(() => {
    useEventListener(video, "loadedmetadata", () => {
      known.value = Number.isFinite(video.duration)
        ? Math.round(video.duration * 1000)
        : 0;
    });

    watchEffect(() => {
      const timing = options.timing();
      const { at, running } = mediaTime(nodeTime(), {
        ...timing,
        duration: known.value || timing.duration,
      });
      const seconds = at / 1000;
      const length = (known.value || timing.duration) / 1000;

      video.volume = Math.min(Math.max(timing.volume ?? 1, 0), 1);
      video.muted = !options.audible() || !!timing.muted || blocked.value;
      video.loop = !!timing.loop;

      if (options.shown?.() === false) return video.pause();

      if (playing.value && running) {
        const off = Math.abs(video.currentTime - seconds);
        const drift = video.loop ? Math.min(off, length - off) : off;
        const ready = !video.seeking && video.readyState >= 3;

        if (ready && drift > 0.15) video.currentTime = seconds;

        if (video.paused)
          video.play().catch((error: DOMException) => {
            if (error.name === "NotAllowedError" && !video.muted)
              blocked.value = true;
          });

        return;
      }

      video.pause();

      if (Math.abs(video.currentTime - seconds) > 0.001)
        video.currentTime = seconds;
    });
  });

  return () => {
    scope.stop();
    video.pause();
  };
}
