import { fitWithin, loadImageSize } from "./size";

export async function applyImageAsset(nodeIds: string[], name: string) {
  const { getNodeComponent } = useNodeComponents();
  const { updateComponent } = useDeckStore();
  const { imageUrl } = useAssetsStore();
  const { canvasSize } = storeToRefs(useAtelierStore());

  const targets = nodeIds
    .map((id) => getNodeComponent(id, "core.image"))
    .filter(
      (image): image is ComponentModel => !!image && image.data.src !== name,
    );

  if (targets.length === 0) return;

  for (const image of targets) {
    updateComponent({ ...image, data: { ...image.data, src: name } });
  }

  const url = imageUrl(name);

  if (!url) return;

  const started = targets.flatMap((image) => {
    const transform = getNodeComponent(image.node, "core.transform");

    return transform ? [{ transform, size: { ...transform.data.size } }] : [];
  });

  const natural = await loadImageSize(url);

  if (!natural) return;

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
