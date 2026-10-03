function download(blob: Blob, name: string) {
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();

  // Safari fails the download if the URL is revoked before it starts reading.
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Shared so a remounted Exports tab can't start a second run.
const busy = ref(false);
const progress = ref("");
const moment = ref("start");
const format = ref("png");

export function useExport() {
  const {
    slides,
    currentSlideId,
    currentSlidesIndex,
    currentTree,
    animatedComponents,
    deckTitle,
  } = storeToRefs(useDeckStore());
  const { whenEntered } = useDeckStore();
  const { canvasSize } = storeToRefs(useAtelierStore());
  const playhead = usePlayhead();
  const rows = useDopesheetRows();
  const display = usePlayheadDisplay(() => rows.value);

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

  const run = async (job: () => Promise<void>) => {
    if (busy.value) return;

    busy.value = true;

    try {
      await job();
    } catch (error) {
      console.error(error);
      alert("Export failed.");
    } finally {
      busy.value = false;
      progress.value = "";
    }
  };

  const png = () =>
    run(async () => {
      if (playhead.playing.value) {
        playhead.pause();
        await nextTick();
      }

      const blob = await capture();

      if (!blob) return alert("Nothing to export on this slide.");

      download(blob, `${fileName()}-${currentSlidesIndex.value + 1}.png`);
    });

  const pdf = () =>
    run(async () => {
      const start = slides.value[currentSlidesIndex.value]?.id;
      const time = playhead.time.value;
      const wasPlaying = playhead.playing.value;
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
      let missed = 0;

      try {
        for (const [i, slide] of list.entries()) {
          progress.value = `${i + 1} / ${list.length}`;

          await enter(slide.id);

          for (const t of times()) {
            if (pages++) doc.addPage();

            playhead.seek(t);

            await nextTick();

            if (currentTree.value && isEmptyTree(currentTree.value)) continue;

            // A capture is dropped if the slide changes mid-wait; one retry covers that.
            const blob =
              (await capture("image/jpeg")) ?? (await capture("image/jpeg"));

            if (!blob) {
              missed++;
              continue;
            }

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

        if (missed)
          alert(`${missed} page(s) couldn't be captured and are blank.`);
      } finally {
        try {
          if (start) await enter(start);
        } finally {
          playhead.seek(time);

          if (wasPlaying) playhead.play();
        }
      }
    });

  return {
    png,
    pdf,
    busy,
    progress,
    moment,
    format,
    slides,
    shownTime: display.shownTime,
    overrun: display.overrun,
  };
}
