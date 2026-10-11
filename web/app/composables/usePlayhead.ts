const MIN_SPAN = 500;
const DEFAULT_SPAN = 5000;

const time = ref(0);
const playing = ref(false);
const held = ref(false);
const end = ref(0);
const canPlay = ref(false);
const endless = ref(false);
const view = reactive<TimeView>({ start: 0, span: DEFAULT_SPAN });

const duration = computed(() =>
  canPlay.value ? Math.max(end.value, view.start + view.span) : 0,
);

const limit = () => Math.max(end.value, DEFAULT_SPAN) * 2;

const moveTo = (start: number) =>
  (view.start = Math.max(Math.min(start, limit() - view.span), 0));

function zoom(delta: number, at: number) {
  const span = Math.min(
    Math.max(view.span * Math.exp(delta / 500), MIN_SPAN),
    limit(),
  );
  const start = at - ((at - view.start) * span) / view.span;

  view.span = span;
  moveTo(start);
}

const pan = (by: number) => moveTo(view.start + by);

function fit() {
  view.start = 0;
  view.span = Math.max(end.value * 1.1, DEFAULT_SPAN);
}

const playable = computed(() => end.value > 0);

let frame = 0;

function stop() {
  cancelAnimationFrame(frame);
  playing.value = false;
  held.value = false;
}

function pause() {
  if (!playing.value) return;

  stop();
  time.value = roundTime(time.value);
  held.value = true;
}

function play() {
  if (playing.value || !playable.value) return;
  if (endless.value ? time.value === end.value : time.value >= end.value)
    time.value = 0;

  const startedAt = performance.now() - time.value;

  playing.value = true;
  held.value = false;

  frame = requestAnimationFrame(function tick(now) {
    const t = now - startedAt;

    if (t >= end.value && !endless.value) return seek(end.value);

    time.value = t;
    frame = requestAnimationFrame(tick);
  });
}

function seek(to: number, hold = false) {
  stop();
  const last = endless.value ? Infinity : duration.value;

  time.value = canPlay.value ? Math.min(Math.max(to, 0), last) : 0;
  held.value = hold && canPlay.value;
}

const nodeTime = (anim?: any) =>
  playing.value || held.value ? loopTime(anim, time.value) : time.value;

function keyTime(anim?: any) {
  const t = nodeTime(anim);

  if (playing.value) return roundTime(t);

  return Math.round(t > (held.value ? end : duration).value ? end.value : t);
}

function setLength(ms: number, hasKeys: boolean, loops = false) {
  end.value = ms;
  canPlay.value = hasKeys;
  endless.value = loops;
}

export function usePlayhead() {
  function reset() {
    stop();
    time.value = 0;
  }

  return {
    time,
    playing,
    held: readonly(held),
    end: readonly(end),
    endless: readonly(endless),
    duration,
    view: readonly(view),
    canPlay,
    playable,
    nodeTime,
    keyTime,
    setLength,
    zoom,
    pan,
    fit,
    play,
    pause,
    seek,
    reset,
  };
}
