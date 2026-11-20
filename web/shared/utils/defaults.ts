export const EXTENSIONS: Record<AssetKind, string[]> = {
  image: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  video: [".mp4", ".webm", ".mov"],
  font: [".ttf", ".otf", ".woff", ".woff2"],
  model: [".fbx", ".glb", ".gltf", ".obj", ".stl"],
};

export function assetKind(name: string): AssetKind | undefined {
  const lower = name.toLowerCase();

  return (Object.keys(EXTENSIONS) as AssetKind[]).find((kind) =>
    EXTENSIONS[kind]!.some((ext) => lower.endsWith(ext)),
  );
}

const TIME_STEP = 10;

export const roundTime = (ms: number) => Math.round(ms / TIME_STEP) * TIME_STEP;

export const DEFAULT_STATE_EASING = "ease-out";

export const DEFAULT_HANDLER_DURATION = 400;

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

export function mediaSpan(timing: MediaTiming) {
  if (!(timing.duration > 0)) return undefined;

  return {
    end: roundTime(timing.start + timing.duration),
    loops: !!timing.loop,
  };
}

export const mediaFields = (field: string) => ({
  unkeyed: ["start", "duration"],
  clock: (data: Record<string, any>) =>
    assetKind(data[field] ?? "") === "video"
      ? mediaSpan(data as MediaTiming)
      : undefined,
});
