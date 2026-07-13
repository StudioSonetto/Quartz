export function useSnapshotScheduler() {
  const sync = useDeckSync();
  const { status } = storeToRefs(sync);

  let stopWatch: (() => void) | null = null;
  let idleHandle: number | null = null;

  function schedule() {
    if (idleHandle !== null) return;
    const run = async () => {
      idleHandle = null;
      try {
        await useSnapshot().capture(); // fire-and-forget; never awaited on edit path
      } catch {
        // snapshots are best-effort; ignore failures
      }
    };
    // Capture only once things have settled.
    idleHandle =
      "requestIdleCallback" in window
        ? (requestIdleCallback(run, { timeout: 5000 }) as unknown as number)
        : (setTimeout(run, 3000) as unknown as number);
  }

  function start() {
    // Capture shortly after a successful flush (edits have landed on the server).
    stopWatch = watch(status, (s) => {
      if (s === "saved") schedule();
    });
  }

  function stop() {
    stopWatch?.();
    stopWatch = null;
    if (idleHandle !== null && "cancelIdleCallback" in window) {
      cancelIdleCallback(idleHandle);
    }
    idleHandle = null;
  }

  return { start, stop };
}
