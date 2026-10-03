import html2canvas from "html2canvas";

function toBlob(
  captured: HTMLCanvasElement,
  source: Size,
  width: number,
  type: string,
) {
  const output = document.createElement("canvas");

  output.width = width;
  output.height = Math.round((width * source.height) / source.width);

  const context = output.getContext("2d")!;

  context.drawImage(
    captured,
    0,
    0,
    source.width,
    source.height,
    0,
    0,
    output.width,
    output.height,
  );

  return new Promise<Blob>((resolve) =>
    output.toBlob((blob) => resolve(blob!), type),
  );
}

export function useSnapshot() {
  const client = useSupabaseClient();

  const { findRenderEl } = useCanvasScale();

  const { currentSlides, currentTree } = storeToRefs(useDeckStore());

  const { refreshSnapshot, dropSnapshot } = useSnapshotsStore();

  const render = async (width: number, type = "image/png") => {
    const el = findRenderEl();
    const tree = currentTree.value;

    if (!el || !tree || isEmptyTree(tree)) return;

    const nodes = flattenTree(tree);
    const deadline = AbortSignal.timeout(15000);

    await Promise.race([
      Promise.all([
        document.fonts.ready,
        ...[...el.querySelectorAll("img")].map((img) =>
          img.decode().catch(() => {}),
        ),
        ...nodes.map((node) =>
          Promise.resolve()
            .then(() => getNodeType(node.type)?.ready?.(node.id))
            .catch(() => {}),
        ),
      ]),
      new Promise((resolve) => deadline.addEventListener("abort", resolve)),
    ]);

    await nextTick();
    await document.fonts.ready;

    if (currentTree.value !== tree) return;

    const rect = el.getBoundingClientRect();

    const scale = snapshotScale(rect, width);

    if (!scale) return;

    let painted: Size = rect;

    const restores: (() => void)[] = [];
    let capturing: Promise<HTMLCanvasElement>;

    try {
      for (const node of nodes) {
        const restore = getNodeType(node.type)?.snapshot?.(node.id);

        if (restore) restores.push(restore);
      }

      capturing = html2canvas(el, {
        scale,
        useCORS: true,
        onclone: async (doc, clone) => {
          const loaded = [...document.fonts].filter(
            (face) => face.status === "loaded",
          );

          for (const face of loaded) {
            try {
              doc.fonts.add(face);
            } catch {}
          }

          await Promise.all(
            [...doc.fonts]
              .filter((face) =>
                loaded.some(
                  (l) =>
                    l.family === face.family &&
                    l.weight === face.weight &&
                    l.style === face.style,
                ),
              )
              .map((face) => face.load().catch(() => {})),
          );

          clone.style.borderRadius = "0px";

          painted = clone.getBoundingClientRect();
        },
      });
    } finally {
      restores.forEach((restore) => restore());
    }

    const captured = await capturing;

    return toBlob(
      captured,
      snapshotSource(painted, scale, captured),
      width,
      type,
    );
  };

  const capture = async () => {
    const slides = currentSlides.value;

    if (!slides) return;

    const tree = currentTree.value;
    if (!tree) return;

    if (isEmptyTree(tree)) return await dropSnapshot(slides.deck, slides.id);

    const blob = await render(SNAPSHOT_WIDTH);

    if (!blob) return;

    const { error } = await client.storage
      .from("snapshots")
      .upload(`${slides.deck}/${slides.id}.png`, blob, {
        upsert: true,
        contentType: "image/png",
        cacheControl: "31536000",
      });

    if (error) throw error;

    await refreshSnapshot(slides.deck, slides.id);
  };

  return {
    capture,
    render,
  };
}
