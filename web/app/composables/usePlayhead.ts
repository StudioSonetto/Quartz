import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";

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

const limit = computed(() => Math.max(end.value, DEFAULT_SPAN) * 2);

const clampSpan = (span: number) =>
  Math.min(Math.max(span, MIN_SPAN), limit.value);

const clampStart = (start: number, span: number) =>
  Math.max(Math.min(start, limit.value - span), 0);

let glider: AnimationPlaybackControls | undefined;

function setView(start: number, span: number) {
  glider?.stop();
  view.start = start;
  view.span = span;
}

// Animates a number and copies it in, never motion animating `view` itself.
function glide(start: number, span: number) {
  const from = { ...view };

  glider?.stop();
  glider = animate(0, 1, {
    duration: 0.2,
    ease: "easeOut",
    onUpdate: (p) => {
      view.start = from.start + (start - from.start) * p;
      view.span = from.span + (span - from.span) * p;
    },
  });
}

const moveTo = (start: number) =>
  setView(clampStart(start, view.span), view.span);

const resize = (span: number) => setView(view.start, clampSpan(span));

function zoom(delta: number, at: number, smooth = false) {
  const span = clampSpan(view.span * Math.exp(delta / 500));
  const start = clampStart(at - ((at - view.start) / view.span) * span, span);

  (smooth ? glide : setView)(start, span);
}

const pan = (by: number) => moveTo(view.start + by);

const fitSpan = computed(() => Math.max(end.value * 1.1, DEFAULT_SPAN));

const fit = () => glide(0, fitSpan.value);

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
    limit,
    fitSpan,
    canPlay,
    playable,
    nodeTime,
    keyTime,
    setLength,
    zoom,
    pan,
    moveTo,
    resize,
    fit,
    play,
    pause,
    seek,
    reset,
  };
}
