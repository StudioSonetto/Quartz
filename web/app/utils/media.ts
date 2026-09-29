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
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: videoMs(video),
        });
        video.removeAttribute("src");
        video.load();
      };
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

// Sets the asset, then its length once known, unless it changed meanwhile.
export async function applyMedia(
  components: ComponentModel[],
  field: string,
  name: string,
  extra: Record<string, unknown> = {},
) {
  const { getNodeComponent } = useNodeComponents();
  const { updateComponent } = useDeckStore();

  for (const component of components)
    updateComponent(
      withData(component, { ...extra, [field]: name, duration: 0 }),
    );

  const url = useAssetsStore().mediaUrl(name);
  const meta = url ? await loadMediaMeta(url, name) : null;

  if (meta?.duration)
    for (const { node, type } of components) {
      const latest = getNodeComponent(node, type);

      if (latest?.data[field] === name)
        updateComponent(withData(latest, { duration: meta.duration }));
    }

  return meta;
}
