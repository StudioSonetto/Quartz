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
const moment = ref("start");

export function useExport() {
  const {
    slides,
    currentSlideId,
    currentSlidesIndex,
    animatedComponents,
    deckTitle,
  } = storeToRefs(useDeckStore());
  const { whenEntered } = useDeckStore();
  const { canvasSize } = storeToRefs(useAtelierStore());
  const playhead = usePlayhead();

  const { render } = useSnapshot();

  const fileName = () => deckTitle.value.trim() || "deck";

  // 1x looks soft on high-DPI screens.
  const capture = (type?: string) => render(canvasSize.value.width * 2, type);

  const enter = async (id: string) => {
    currentSlideId.value = id;

    await nextTick();
    await whenEntered();
  };

  const times = () => {
    if (moment.value === "start") return [0];
    if (moment.value === "end") return [playhead.end.value];

    return [
      ...new Set([
        0,
        ...animatedComponents.value.flatMap((c) => keyTimes(c.data)),
      ]),
    ].sort((a, b) => a - b);
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
      const blob = await capture();

      if (!blob) return alert("Nothing to export on this slide.");

      download(blob, `${fileName()}-${currentSlidesIndex.value + 1}.png`);
    });

  const pdf = () =>
    run("…", async () => {
      const start = slides.value[currentSlidesIndex.value]?.id;
      const time = playhead.time.value;
      const list = [...slides.value];
      const { width, height } = canvasSize.value;
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [width, height],
        hotfixes: ["px_scaling"],
      });

      let pages = 0;

      try {
        for (const [i, slide] of list.entries()) {
          progress.value = `${i + 1} / ${list.length}`;

          await enter(slide.id);

          for (const t of times()) {
            if (pages++) doc.addPage();

            playhead.seek(t);

            await nextTick();

            const blob = await capture("image/jpeg");

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
        }

        download(doc.output("blob"), `${fileName()}.pdf`);
      } finally {
        if (start) await enter(start);

        playhead.seek(time);
      }
    });

  return { png, pdf, progress, moment };
}
