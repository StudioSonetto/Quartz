import type { AssetKind } from "#shared/types";

const EXTENSIONS: Record<AssetKind, string[]> = {
  image: [".png", ".jpg", ".jpeg"],
  font: [".ttf", ".otf", ".woff", ".woff2"],
  model: [".fbx", ".glb", ".gltf", ".obj", ".stl"],
};

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

export function uniqueAssetName(name: string, existing: Set<string>): string {
  if (!existing.has(name)) return name;

  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";

  for (let n = 1; ; n++) {
    const candidate = `${stem}-${n}${ext}`;

    if (!existing.has(candidate)) return candidate;
  }
}
