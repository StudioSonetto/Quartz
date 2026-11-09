export function useSnapshotScheduler() {
  const sync = useDeckSync();
  const { status, hasPending } = storeToRefs(sync);

  const stops: (() => void)[] = [];
  let idleHandle: number | null = null;
  let edited = false;

  async function run() {
    cancel();
    edited = false;
    try {
      await useSnapshot().capture();
    } catch {
      // snapshots are best-effort; ignore failures
    }
  }

  function schedule() {
    if (idleHandle !== null) return;

    idleHandle =
      "requestIdleCallback" in window
        ? (requestIdleCallback(run, { timeout: 5000 }) as unknown as number)
        : (setTimeout(run, 3000) as unknown as number);
  }

  function cancel() {
    if (idleHandle === null) return;

    if ("cancelIdleCallback" in window) cancelIdleCallback(idleHandle);
    else clearTimeout(idleHandle);

    idleHandle = null;
  }

  function start() {
    stops.push(
      watch(hasPending, (pending) => pending && (edited = true)),
      watch(status, (s) => s === "saved" && schedule()),
    );
  }

  function stop() {
    stops.splice(0).forEach((stop) => stop());
    cancel();
  }

  function settle() {
    if (!edited) return;

    return Promise.race([
      run(),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
  }

  return { start, stop, settle };
}
