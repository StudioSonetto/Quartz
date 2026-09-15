import html2canvas from "html2canvas";

function toPng(captured: HTMLCanvasElement, source: Size) {
  const output = document.createElement("canvas");

  output.width = SNAPSHOT_WIDTH;
  output.height = SNAPSHOT_HEIGHT;

  const context = output.getContext("2d")!;

  context.drawImage(
    captured,
    0,
    0,
    source.width,
    source.height,
    0,
    0,
    SNAPSHOT_WIDTH,
    SNAPSHOT_HEIGHT,
  );

  return new Promise<Blob>((resolve) =>
    output.toBlob((blob) => resolve(blob!), "image/png"),
  );
}

export function useSnapshot() {
  const client = useSupabaseClient();

  const { findRenderEl } = useCanvasScale();

  const { currentSlides, trees } = storeToRefs(useDeckStore());

  const { refreshSnapshot, dropSnapshot } = useSnapshotsStore();

  const capture = async () => {
    const slides = currentSlides.value;

    if (!slides) return;

    const tree = trees.value.get(slides.id);
    if (!tree) return;

    if (isEmptyTree(tree)) return await dropSnapshot(slides.deck, slides.id);

    const render = findRenderEl();
    if (!render) return;

    const rect = render.getBoundingClientRect();

    const scale = snapshotScale(rect);
    if (!scale) return;

    let painted: Size = rect;

    const captured = await html2canvas(render, {
      scale,
      useCORS: true,
      onclone: (_, clone) => {
        clone.style.borderRadius = "0px";

        painted = clone.getBoundingClientRect();
      },
    });

    const source = snapshotSource(painted, scale, captured);

    const blob = await toPng(captured, source);

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
  };
}
