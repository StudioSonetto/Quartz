import type { AssetKind } from "#shared/types";

const EXTENSIONS: Record<AssetKind, string[]> = {
  image: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  video: [".mp4", ".webm", ".mov"],
  font: [".ttf", ".otf", ".woff", ".woff2"],
  model: [".fbx", ".glb", ".gltf", ".obj", ".stl"],
};

// Supabase's default per-file upload limit.
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const unsupportedFile = (name: string) =>
  `Can't use ${name}. Use an image, an .mp4, .webm or .mov video, a font, or a 3D model.`;

export const ASSET_ACCEPT = Object.values(EXTENSIONS).flat().join(",");

export function hasFiles(event: DragEvent) {
  return event.dataTransfer?.types.includes("Files") ?? false;
}

export function assetKind(name: string): AssetKind | undefined {
  const lower = name.toLowerCase();

  return (Object.keys(EXTENSIONS) as AssetKind[]).find((kind) =>
    EXTENSIONS[kind]!.some((ext) => lower.endsWith(ext)),
  );
}

export function assetStem(name: string): string {
  const dot = name.lastIndexOf(".");

  return dot > 0 ? name.slice(0, dot) : name;
}

export function assetKey(name: string): string {
  return assetKind(name) === "font" ? assetStem(name) : name;
}

export function uniqueAssetName(name: string, taken: Set<string>): string {
  if (!taken.has(assetKey(name))) return name;

  const stem = assetStem(name);
  const ext = name.slice(stem.length);

  for (let n = 1; ; n++) {
    const candidate = `${stem}-${n}${ext}`;

    if (!taken.has(assetKey(candidate))) return candidate;
  }
}
