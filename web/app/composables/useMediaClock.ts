import { clamp } from "@vueuse/core";

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
  let refused = false;

  const scope = effectScope();

  scope.run(() => {
    useEventListener(video, "loadedmetadata", () => {
      known.value = videoMs(video);
    });
    useEventListener(video, "emptied", () => (known.value = 0));

    watchEffect(() => {
      const timing = options.timing();
      const duration = known.value || timing.duration;
      const { at, running } = mediaTime(nodeTime(), { ...timing, duration });
      const seconds = at / 1000;

      video.volume = clamp(timing.volume ?? 1, 0, 1);
      video.muted = !options.audible() || !!timing.muted || blocked.value;
      video.loop = !!timing.loop;

      if (options.shown?.() === false) return video.pause();

      if (playing.value && running) {
        const off = Math.abs(video.currentTime - seconds);
        const drift = video.loop ? Math.min(off, duration / 1000 - off) : off;
        const ready = !video.seeking && video.readyState >= 3;

        if (ready && drift > 0.15) video.currentTime = seconds;

        if (video.paused && !refused)
          video.play().catch((error: DOMException) => {
            if (error.name !== "NotAllowedError") return;

            // Muted and still refused: wait for the next play, not the next frame.
            if (video.muted) refused = true;
            else blocked.value = true;
          });

        return;
      }

      refused = false;
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
