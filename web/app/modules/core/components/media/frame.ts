const wanted = shallowReactive(new Map<string, number>());

export const wantsFrame = (node: string) => wanted.has(node);

export async function frameReady(node: string) {
  const video = document.getElementById(node)?.querySelector("video");

  if (!video) return;

  wanted.set(node, (wanted.get(node) ?? 0) + 1);

  const signal = AbortSignal.timeout(3000);

  try {
    await nextTick();

    while (
      (video.seeking || video.readyState < 2) &&
      !video.error &&
      !signal.aborted
    )
      await new Promise((resolve) => {
        for (const event of ["seeked", "loadeddata", "canplay", "error"])
          video.addEventListener(event, resolve, { once: true, signal });

        signal.addEventListener("abort", resolve, { once: true });
      });
  } finally {
    const count = wanted.get(node)! - 1;

    if (count) wanted.set(node, count);
    else wanted.delete(node);
  }
}
