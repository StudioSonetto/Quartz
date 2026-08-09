import type { AssetKind } from "#shared/types";

const EXTENSIONS: Record<AssetKind, string[]> = {
  image: [".png", ".jpg", ".jpeg"],
  font: [".ttf", ".otf", ".woff", ".woff2"],
  model: [".fbx", ".glb", ".gltf", ".obj"],
};

export function assetKind(name: string): AssetKind | undefined {
  const lower = name.toLowerCase();

  return (Object.keys(EXTENSIONS) as AssetKind[]).find((kind) =>
    EXTENSIONS[kind]!.some((ext) => lower.endsWith(ext)),
  );
}
