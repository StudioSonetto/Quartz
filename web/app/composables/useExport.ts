function download(blob: Blob, name: string) {
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();

  // Safari fails the download if the URL is revoked before it starts reading.
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Shared so a remounted Exports tab can't start a second run.
const progress = ref<string | null>(null);

export function useExport() {
  const { slides, currentSlideId, currentSlidesIndex, deckTitle } =
    storeToRefs(useDeckStore());
  const { whenEntered } = useDeckStore();
  const { canvasSize } = storeToRefs(useAtelierStore());

  const { render } = useSnapshot();

  const fileName = () => deckTitle.value.trim() || "deck";

  const renderSlide = async (id: string, type?: string) => {
    currentSlideId.value = id;

    await nextTick();
    await whenEntered();

    // 1x looks soft on high-DPI screens.
    return render(canvasSize.value.width * 2, type);
  };

  const run = async (label: string, job: () => Promise<void>) => {
    if (progress.value) return;

    progress.value = label;

    try {
      await job();
    } catch (error) {
      console.error(error);
      alert("Export failed.");
    } finally {
      progress.value = null;
    }
  };

  const png = () =>
    run("…", async () => {
      const index = currentSlidesIndex.value;
      const blob = await renderSlide(slides.value[index]!.id);

      if (!blob) return alert("Nothing to export on this slide.");

      download(blob, `${fileName()}-${index + 1}.png`);
    });

  const pdf = () =>
    run("…", async () => {
      const start = currentSlideId.value;
      const list = [...slides.value];
      const { width, height } = canvasSize.value;
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [width, height],
        hotfixes: ["px_scaling"],
      });

      try {
        for (const [i, slide] of list.entries()) {
          progress.value = `${i + 1} / ${list.length}`;

          if (i > 0) doc.addPage();

          // JPEG goes into the PDF as-is; PNG gets decoded and re-packed in JS.
          const blob = await renderSlide(slide.id, "image/jpeg");
          if (!blob) continue;

          doc.addImage(
            new Uint8Array(await blob.arrayBuffer()),
            "JPEG",
            0,
            0,
            width,
            height,
          );
        }

        download(doc.output("blob"), `${fileName()}.pdf`);
      } finally {
        currentSlideId.value = start;
      }
    });

  return { png, pdf, progress };
}
