import html2canvas from "html2canvas";

// Crops the painted area out of the capture and rescales it to a thumbnail.
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

  const capture = async () => {
    const slides = currentSlides.value;
    if (!slides) return;

    const tree = trees.value.get(slides.id);
    if (!tree || isEmptyTree(tree)) return;

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
      });

    if (error) throw error;
  };

  const fetch = async (
    deck: string = currentSlides.value?.deck ?? "",
    slides: string = currentSlides.value?.id ?? "",
  ) => {
    const current = currentSlides.value;
    if (current?.id === slides) {
      const tree = trees.value.get(current.id);
      if (!tree || isEmptyTree(tree)) return;
    }

    const { data, error } = await client.storage.from("snapshots").list(deck, {
      search: `${slides}.png`,
    });

    if (error) return;

    const file = data?.find((object) => object.name === `${slides}.png`);

    if (!file) return;

    return await signStorageObject("snapshots", deck, file.name);
  };

  return {
    capture,
    fetch,
  };
}
