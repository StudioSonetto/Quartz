import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";

const MIN_SPAN = 5000;
const CLOCK_SPAN = 3_600_000;

const time = ref(0);
const playing = ref(false);
const end = ref(0);
const canPlay = ref(false);
const endless = ref(false);

const duration = computed(() =>
  canPlay.value ? Math.max(end.value, MIN_SPAN) : 0,
);

const playable = computed(() => end.value > 0);

watch(time, (t) => {
  if (playing.value && t >= end.value && !endless.value) seek(end.value);
});

let controls: AnimationPlaybackControls | null = null;

function dispose() {
  controls?.stop();
  controls = null;
}

function timeline() {
  if (controls) return controls;

  controls = animate(0, CLOCK_SPAN, {
    duration: CLOCK_SPAN / 1000,
    ease: "linear",
    autoplay: false,
    onUpdate: (ms) => (time.value = ms),
    onComplete: () => (playing.value = false),
  });

  controls.time = time.value / 1000;

  return controls;
}

function play() {
  if (playing.value || !playable.value) return;
  if (time.value >= end.value) seek(0);

  timeline().play();
  playing.value = true;
}

function seek(to: number) {
  playing.value = false;

  if (!canPlay.value) {
    dispose();
    time.value = 0;
    return;
  }

  timeline();

  controls!.pause();
  controls!.time = Math.min(Math.max(to, 0), duration.value) / 1000;
}

const nodeTime = (anim?: any) =>
  playing.value ? loopTime(anim, time.value) : time.value;

const keyTime = (anim?: any) =>
  playing.value ? roundTime(nodeTime(anim)) : Math.round(time.value);

function setLength(ms: number, hasKeys: boolean, loops = false) {
  end.value = ms;
  canPlay.value = hasKeys;
  endless.value = loops;
}

export function usePlayhead() {
  function reset() {
    dispose();
    time.value = 0;
    playing.value = false;
  }

  return {
    time,
    playing,
    end: readonly(end),
    endless: readonly(endless),
    duration,
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
