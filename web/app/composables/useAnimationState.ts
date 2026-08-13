import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";

type Transition = { from: string; to: string; t: number };

export type Timing = {
  duration?: number;
  delay?: number;
  easing?: string;
  repeat?: number;
  repeatType?: "loop" | "reverse" | "mirror";
};

export const REPEAT_TYPES = ["loop", "reverse", "mirror"];

const active = reactive(new Map<string, string>());

const transitions = reactive(new Map<string, Transition>());
const running = new Map<string, AnimationPlaybackControls>();

export const EASING_OPTIONS = [
  "linear",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "back-in",
  "back-out",
  "back-in-out",
  "circ-in",
  "circ-out",
  "circ-in-out",
  "anticipate",
  "spring",
];

const motionEase = (easing: string) =>
  easing.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

function easingOptions(easing?: string): Record<string, any> {
  if (!easing) return {};
  if (easing === "spring") return { type: "spring", bounce: 0.25 };

  const bezier = easing.match(/cubic-bezier\(([^)]+)\)/);

  if (bezier) {
    const points = bezier[1]!.split(",").map((n) => Number(n.trim()));

    if (points.length === 4 && points.every(Number.isFinite))
      return { ease: points };
  }

  return { ease: motionEase(easing) };
}

function halt(nodeId: string) {
  running.get(nodeId)?.stop();
  running.delete(nodeId);
  transitions.delete(nodeId);
}

export function useAnimationState() {
  function activeState(nodeId: string): string {
    return active.get(nodeId) ?? BASE_STATE;
  }

  function transition(nodeId: string): Transition | undefined {
    return transitions.get(nodeId);
  }

  function setState(nodeId: string, name: string) {
    halt(nodeId);
    active.set(nodeId, name);
  }

  function animateTo(nodeId: string, name: string, timing: Timing = {}) {
    if (activeState(nodeId) === name) return;

    const from = activeState(nodeId);
    const {
      duration = 0,
      delay = 0,
      easing,
      repeat = 0,
      repeatType = "loop",
    } = timing;

    halt(nodeId);
    active.set(nodeId, name);

    if (duration <= 0) return;

    transitions.set(nodeId, { from, to: name, t: 0 });

    const entry = transitions.get(nodeId)!;

    running.set(
      nodeId,
      animate(
        entry,
        { t: 1 },
        {
          duration: duration / 1000,
          ...(delay ? { delay: delay / 1000 } : {}),
          ...easingOptions(easing),
          ...(repeat
            ? { repeat: repeat < 0 ? Infinity : repeat, repeatType }
            : {}),
          onComplete: () => halt(nodeId),
        },
      ),
    );
  }

  function toggleState(nodeId: string, name: string, timing: Timing = {}) {
    const next = activeState(nodeId) === name ? BASE_STATE : name;

    animateTo(nodeId, next, timing);
  }

  function reset() {
    for (const nodeId of [...running.keys()]) halt(nodeId);

    active.clear();
    transitions.clear();
  }

  return { activeState, transition, setState, animateTo, toggleState, reset };
}
