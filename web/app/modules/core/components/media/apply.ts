import { fitWithin } from "./size";

export async function applyMediaAsset(nodeIds: string[], name: string) {
  const { getComponent, updateComponent } = useDeckStore();
  const { canvasSize } = storeToRefs(useAtelierStore());

  const targets = nodeIds
    .map((id) => getComponent(id, "core.media"))
    .filter(
      (media): media is ComponentModel => !!media && media.data.src !== name,
    );

  if (targets.length === 0) return;

  const started = targets.flatMap((media) => {
    const transform = getComponent(media.node, "core.transform");

    return transform ? [{ transform, size: { ...transform.data.size } }] : [];
  });

  const natural = await applyMedia(targets, "src", name);

  if (!natural) return;

  const size = fitWithin(
    natural.width,
    natural.height,
    canvasSize.value.width,
    canvasSize.value.height,
  );

  for (const { transform, size: before } of started) {
    const latest = getComponent(transform.node, "core.transform") ?? transform;

    if (
      latest.data.size.width !== before.width ||
      latest.data.size.height !== before.height
    )
      continue;

    updateComponent({ ...latest, data: { ...latest.data, size } });
  }
}
