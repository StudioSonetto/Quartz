import html2canvas from "html2canvas";

export function useSnapshot() {
  const client = useSupabaseClient();

  const { currentSlides, trees } = storeToRefs(useDeckStore());

  const capture = async () => {
    if (isEmptyTree(trees.value[currentSlides.value.index])) return;

    const blob = await html2canvas(document.querySelector(".render")!, {
      width: 192,
      height: 108,
      scale: 10,
      useCORS: true,
      onclone: (document, clone) => {
        clone.style.borderRadius = "0px";

        // TODO: Use another method to get the elements.
        const elements = document.querySelectorAll(".element");

        elements.forEach((element) => {
          (element as HTMLElement).style.transform = `scale(${192 / 1920})`;
        });
      },
    }).then(
      (canvas) =>
        new Promise<Blob>((resolve) =>
          canvas.toBlob((blob) => resolve(blob!), "image/png")
        )
    );

    const { error } = await client.storage
      .from("snapshots")
      .upload(
        `${currentSlides.value.deck}/${currentSlides.value.id}.png`,
        blob,
        {
          upsert: true,
          contentType: "image/png",
        }
      );

    if (error) throw error;
  };

  const fetch = async (
    deck: string = currentSlides.value.deck,
    slides: string = currentSlides.value.id
  ) => {
    if (currentSlides.value?.id === slides) {
      if (isEmptyTree(trees.value[currentSlides.value.index])) {
        return;
      }
    }

    const { data, error } = await client.storage.from("snapshots").list(deck, {
      search: `${slides}.png`,
    });

    if (!data?.length || error) return;

    const { url } = await getStorageObject("snapshots", deck, `${slides}.png`);

    return url.toString();
  };

  return {
    capture,
    fetch,
  };
}
