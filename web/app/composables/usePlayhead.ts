const MIN_SPAN = 5000;

const time = ref(0);
const playing = ref(false);
const end = ref(0);
const canPlay = ref(false);
const endless = ref(false);

const duration = computed(() =>
  canPlay.value ? Math.max(end.value, MIN_SPAN) : 0,
);

const playable = computed(() => end.value > 0);

// Only a slide that never ends can run past the visible timeline.
const beyond = computed(() => time.value > duration.value);

let frame = 0;

function stop() {
  cancelAnimationFrame(frame);
  playing.value = false;
}

function play() {
  if (playing.value || !playable.value) return;
  // A slide that never ends restarts only from its end, not when joined past it.
  if (endless.value ? time.value === end.value : time.value >= end.value)
    time.value = 0;

  const startedAt = performance.now() - time.value;

  playing.value = true;

  frame = requestAnimationFrame(function tick(now) {
    const t = now - startedAt;

    if (t >= end.value && !endless.value) return seek(end.value);

    time.value = t;
    frame = requestAnimationFrame(tick);
  });
}

function seek(to: number) {
  stop();
  const last = endless.value ? Infinity : duration.value;

  time.value = canPlay.value ? Math.min(Math.max(to, 0), last) : 0;
}

const nodeTime = (anim?: any) =>
  playing.value ? loopTime(anim, time.value) : time.value;

// Paused past the timeline, a key lands at the end rather than stretching it.
const keyTime = (anim?: any) =>
  playing.value
    ? roundTime(nodeTime(anim))
    : Math.round(beyond.value ? end.value : time.value);

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
    end: readonly(end),
    endless: readonly(endless),
    duration,
    beyond,
    canPlay,
    playable,
    nodeTime,
    keyTime,
    setLength,
    play,
    seek,
    reset,
  };
}
