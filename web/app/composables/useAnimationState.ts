import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";

type Transition = { from: string; to: string; t: number };

export type Timing = {
  duration?: number;
  easing?: string;
};

const active = reactive(new Map<string, string>());

const transitions = reactive(new Map<string, Transition>());
const running = new Map<string, AnimationPlaybackControls>();

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
    const { duration = 0, easing } = timing;

    halt(nodeId);
    active.set(nodeId, name);

    if (duration <= 0) return;

    transitions.set(nodeId, { from, to: name, t: 0 });

    const entry = transitions.get(nodeId)!;

    running.set(
      nodeId,
      animate(0, 1, {
        duration: duration / 1000,
        ease: (p: number) => ease(easing, p, duration),
        onUpdate: (t) => (entry.t = t),
        onComplete: () => halt(nodeId),
      }),
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
    usePlayhead().reset();
  }

  return { activeState, transition, setState, animateTo, toggleState, reset };
}
