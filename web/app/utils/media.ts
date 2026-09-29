export interface MediaTiming {
  start: number;
  duration: number;
  loop: boolean;
  volume: number;
  muted: boolean;
}

export const MEDIA_DEFAULTS = {
  volume: 1,
  muted: false,
  loop: false,
  start: 0,
  duration: 0,
};

export const mediaFields = (field: string) => ({
  unkeyed: ["start", "duration"],
  clock: (data: Record<string, any>) =>
    assetKind(data[field] ?? "") === "video"
      ? mediaSpan(data as MediaTiming)
      : undefined,
});

export const videoMs = (video: HTMLVideoElement) =>
  Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : 0;

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

  return {
    end: roundTime(timing.start + timing.duration),
    loops: !!timing.loop,
  };
}

const META_TIMEOUT_MS = 15_000;

// Resolves null on error or timeout, so callers holding an undo group never hang.
export function loadMediaMeta(
  url: string,
  name: string,
): Promise<{ width: number; height: number; duration: number } | null> {
  return new Promise((resolve) => {
    const video =
      assetKind(name) === "video" ? document.createElement("video") : null;

    const done = (meta: Awaited<ReturnType<typeof loadMediaMeta>>) => {
      clearTimeout(timer);
      resolve(meta);
      video?.removeAttribute("src");
      video?.load();
    };
    const timer = setTimeout(() => done(null), META_TIMEOUT_MS);

    if (video) {
      video.preload = "metadata";
      video.onloadedmetadata = () =>
        done({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: videoMs(video),
        });
      video.onerror = () => done(null);
      video.src = url;

      return;
    }

    const img = new Image();

    img.onload = () =>
      done({ width: img.naturalWidth, height: img.naturalHeight, duration: 0 });
    img.onerror = () => done(null);
    img.src = url;
  });
}

// The length arrives later, from the element that plays it (saveMediaLength).
export function applyMedia(
  components: ComponentModel[],
  field: string,
  name: string,
  extra: Record<string, unknown> = {},
) {
  const { updateComponent } = useDeckStore();

  for (const component of components)
    updateComponent(
      withData(component, { ...extra, [field]: name, duration: 0 }),
    );

  const url = useAssetsStore().mediaUrl(name);

  return url ? loadMediaMeta(url, name) : Promise.resolve(null);
}

export function saveMediaLength(node: string, type: ComponentType, ms: number) {
  const component = useNodeComponents().getStoredComponent(node, type);

  if (!component || component.data.duration === ms) return;

  useHistoryStore().untracked(() =>
    useDeckStore().updateComponent(withData(component, { duration: ms })),
  );
}
