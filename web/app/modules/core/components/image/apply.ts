import { fitWithin } from "./size";

export async function applyImageAsset(nodeIds: string[], name: string) {
  const { getNodeComponent } = useNodeComponents();
  const { updateComponent } = useDeckStore();
  const { mediaUrl } = useAssetsStore();
  const { canvasSize } = storeToRefs(useAtelierStore());

  const targets = nodeIds
    .map((id) => getNodeComponent(id, "core.image"))
    .filter(
      (image): image is ComponentModel => !!image && image.data.src !== name,
    );

  if (targets.length === 0) return;

  for (const image of targets) {
    updateComponent(withData(image, { src: name, duration: 0 }));
  }

  const url = mediaUrl(name);

  if (!url) return;

  const started = targets.flatMap((image) => {
    const transform = getNodeComponent(image.node, "core.transform");

    return transform ? [{ transform, size: { ...transform.data.size } }] : [];
  });

  const natural = await loadMediaMeta(url, name);

  if (!natural) return;

  if (natural.duration)
    for (const image of targets) {
      const latest = getNodeComponent(image.node, "core.image") ?? image;

      if (latest.data.src === name)
        updateComponent(withData(latest, { duration: natural.duration }));
    }

  const size = fitWithin(
    natural.width,
    natural.height,
    canvasSize.value.width,
    canvasSize.value.height,
  );

  for (const { transform, size: before } of started) {
    const latest =
      getNodeComponent(transform.node, "core.transform") ?? transform;

    if (
      latest.data.size.width !== before.width ||
      latest.data.size.height !== before.height
    )
      continue;

    updateComponent({ ...latest, data: { ...latest.data, size } });
  }
}
