export function resolveAssetDrop(
  kind: AssetKind,
  targetType: NodeType,
): NodeTypeDef | undefined {
  return allNodeTypes().find(
    (def) => def.asset?.kind === kind && canContain(targetType, def.type),
  );
}
export function resolveDropTarget(
  node: Tree | null,
  kind: AssetKind,
): { parent: Tree; def: NodeTypeDef } | null {
  for (let n = node; n; n = n.parent ?? null) {
    const def = resolveAssetDrop(kind, n.type);

    if (def) return { parent: n, def };
  }

  return null;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

export function defaultNodeSize(type: NodeType) {
  const declared = getNodeType(type)?.defaultComponents.some(
    (e) => entryType(e) === "core.transform",
  );

  if (!declared) return null;

  const { width, height } = effectiveDefaults(type, "core.transform").size;

  if (typeof width !== "number" || typeof height !== "number") return null;

  return { width, height };
}

export function dropPosition(
  point: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
  canvas: { width: number; height: number },
  size: { width: number; height: number } | null,
) {
  const x = ((point.x - rect.left) / rect.width) * canvas.width;
  const y = ((point.y - rect.top) / rect.height) * canvas.height;

  if (!size) return { x: Math.round(x), y: Math.round(y) };

  return {
    x: Math.round(
      clamp(x - size.width / 2, 0, Math.max(0, canvas.width - size.width)),
    ),
    y: Math.round(
      clamp(y - size.height / 2, 0, Math.max(0, canvas.height - size.height)),
    ),
  };
}
