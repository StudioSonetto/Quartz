import { createClient } from "@supabase/supabase-js";

type WatchState = { slide: string | null; time: number; playing: boolean };

export function usePresenterSync(
  instanceId: string,
  presenting: Readonly<Ref<boolean>>,
  onDeck: () => void,
) {
  const client = createClient(
    `${location.origin}/.proxy/supabase`,
    useRuntimeConfig().public.supabase.key,
    { auth: { persistSession: false } },
  );
  const { currentSlideId, currentSlides, currentTree } =
    storeToRefs(useDeckStore());
  const playhead = usePlayhead();

  const channel = client.channel(`discord:${instanceId}`, {
    config: { broadcast: { self: false } },
  });

  const send = (event: string, payload: object = {}) =>
    channel.send({ type: "broadcast", event, payload });

  const state = (): WatchState => ({
    slide: currentSlides.value?.id ?? null,
    time: playhead.time.value,
    playing: playhead.playing.value,
  });

  let latest = 0;

  async function apply({ slide, time, playing }: WatchState) {
    const turn = ++latest;

    if (slide) currentSlideId.value = slide;

    await until(currentTree).toMatch((tree) => !!tree?.id);

    if (turn !== latest) return;

    playhead.seek(time);

    if (playing) playhead.play();
  }

  channel
    .on("broadcast", { event: "request-state" }, () => {
      if (presenting.value) send("state", state());
    })
    .on("broadcast", { event: "state" }, ({ payload }) => {
      if (!presenting.value) apply(payload as WatchState);
    })
    .on("broadcast", { event: "deck" }, () => {
      if (!presenting.value) onDeck();
    })
    .subscribe();

  const stopWatch = watch(
    [() => currentSlides.value?.id, playhead.playing],
    () => {
      if (presenting.value) send("state", state());
    },
  );

  return {
    requestState: () => send("request-state"),
    announceDeck: () => send("deck"),
    stop() {
      stopWatch();
      client.removeChannel(channel);
    },
  };
}
