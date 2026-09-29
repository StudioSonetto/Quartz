export interface MediaTiming {
  start: number;
  duration: number;
  loop: boolean;
  volume: number;
  muted: boolean;
}

export function mediaTime(
  t: number,
  { start, duration, loop }: Pick<MediaTiming, "start" | "duration" | "loop">,
) {
  const local = t - start;

  if (local < 0 || duration <= 0) return { at: 0, running: false };
  if (loop) return { at: local % duration, running: true };

  return { at: Math.min(local, duration), running: local < duration };
}

export function mediaSpan(timing: MediaTiming) {
  if (!(timing.duration > 0)) return undefined;

  return { end: timing.start + timing.duration, loops: !!timing.loop };
}

export function loadMediaMeta(
  url: string,
  name: string,
): Promise<{ width: number; height: number; duration: number } | null> {
  return new Promise((resolve) => {
    if (assetKind(name) === "video") {
      const video = document.createElement("video");

      video.preload = "metadata";
      video.onloadedmetadata = () =>
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Number.isFinite(video.duration)
            ? Math.round(video.duration * 1000)
            : 0,
        });
      video.onerror = () => resolve(null);
      video.src = url;

      return;
    }

    const img = new Image();

    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        duration: 0,
      });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
