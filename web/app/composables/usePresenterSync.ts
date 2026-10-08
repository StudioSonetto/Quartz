import { createClient } from "@supabase/supabase-js";

type WatchState = {
  slide: string | null;
  time: number;
  playing: boolean;
  states: Record<string, string>;
  seq: number;
};

type SessionKeys = { publicKey: JsonWebKey; privateKey?: JsonWebKey };

const ECDSA = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };
const encode = (text: string) => new TextEncoder().encode(text);

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
  const deck = useDeckStore();
  const { currentSlides } = storeToRefs(deck);
  const playhead = usePlayhead();
  const { snapshot, restore } = useAnimationState();

  const channel = client.channel(`discord:${instanceId}`, {
    config: { broadcast: { self: false } },
  });

  const send = (event: string, payload: object = {}) =>
    channel.send({ type: "broadcast", event, payload });

  let signKey: CryptoKey | undefined;
  let verifyKey: CryptoKey | undefined;
  let seq = 0;
  let lastSeq = 0;

  async function trust({ publicKey, privateKey }: SessionKeys) {
    verifyKey = await crypto.subtle.importKey("jwk", publicKey, ECDSA, false, [
      "verify",
    ]);
    signKey = privateKey
      ? await crypto.subtle.importKey("jwk", privateKey, ECDSA, false, ["sign"])
      : undefined;
  }

  // Signed so only the presenter can move viewers; seq stops replays.
  async function sendState() {
    if (!signKey) return;

    seq = Math.max(seq + 1, Date.now());

    const body = JSON.stringify({
      slide: currentSlides.value?.id ?? null,
      time: playhead.time.value,
      playing: playhead.playing.value,
      states: snapshot(),
      seq,
    } satisfies WatchState);

    const sig = await crypto.subtle.sign(ECDSA, signKey, encode(body));

    send("state", {
      body,
      sig: btoa(String.fromCharCode(...new Uint8Array(sig))),
    });
  }

  async function receive({ body, sig }: { body?: unknown; sig?: unknown }) {
    if (!verifyKey || typeof body !== "string" || typeof sig !== "string")
      return;

    const signature = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));

    const valid = await crypto.subtle
      .verify(ECDSA, verifyKey, signature, encode(body))
      .catch(() => false);

    if (!valid) return;

    const state = JSON.parse(body) as WatchState;

    if (!(state.seq > lastSeq)) return;

    lastSeq = state.seq;

    apply(state);
  }

  let latest = 0;

  async function apply({ slide, time, playing, states }: WatchState) {
    const turn = ++latest;

    if (slide) deck.goToSlide(deck.slides.findIndex((s) => s.id === slide));

    // Lets a slide change start the store's enter step, whose reset must land first.
    await nextTick();
    await deck.whenEntered();

    if (turn !== latest) return;

    playhead.seek(time);
    restore(states ?? {});

    if (playing) playhead.play();
  }

  const reply = useThrottleFn(sendState, 1000, true);

  channel
    .on("broadcast", { event: "request-state" }, () => {
      if (presenting.value) reply();
    })
    .on("broadcast", { event: "state" }, ({ payload }) => {
      if (!presenting.value) receive(payload);
    })
    .on("broadcast", { event: "deck" }, () => {
      if (!presenting.value) onDeck();
    })
    .subscribe();

  const stopWatch = watch(
    [
      () => currentSlides.value?.id,
      playhead.playing,
      () => (playhead.playing.value ? null : playhead.time.value),
      () => presenting.value && JSON.stringify(snapshot()),
    ],
    () => {
      if (presenting.value) sendState();
    },
  );

  return {
    trust,
    requestState: () => send("request-state"),
    announceDeck: () => send("deck"),
    stop() {
      stopWatch();
      client.removeChannel(channel);
    },
  };
}
