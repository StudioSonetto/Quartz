const MIN_SPAN = 5000;

const time = ref(0);
const playing = ref(false);
const held = ref(false);
const end = ref(0);
const canPlay = ref(false);
const endless = ref(false);

const duration = computed(() =>
  canPlay.value ? Math.max(end.value, MIN_SPAN) : 0,
);

const playable = computed(() => end.value > 0);

let frame = 0;

function stop() {
  cancelAnimationFrame(frame);
  playing.value = false;
  held.value = false;
}

// Keeps the raw time, so a mirror loop resumes in the direction it was going.
function pause() {
  if (!playing.value) return;

  stop();
  time.value = roundTime(time.value);
  held.value = true;
}

function play() {
  if (playing.value || !playable.value) return;
  // A slide that never ends restarts only from its end, not when joined past it.
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

// Paused past the timeline, a key lands at the end rather than stretching it.
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
    canPlay,
    playable,
    nodeTime,
    keyTime,
    setLength,
    play,
    pause,
    seek,
    reset,
  };
}
