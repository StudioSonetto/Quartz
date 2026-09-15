import {
  anticipate,
  backIn,
  backInOut,
  backOut,
  circIn,
  circInOut,
  circOut,
  cubicBezier,
  easeIn,
  easeInOut,
  easeOut,
  spring,
} from "motion";

export const BASE_STATE = "";

const STATELESS: ComponentType[] = [
  "core.animation",
  "core.base",
  "core.event",
  "core.path",
];

export function isStateless(type: ComponentType) {
  return STATELESS.includes(type);
}

export function overridesFor(
  baseData: any,
  state: string,
  type: ComponentType,
): Record<string, any> | undefined {
  if (!state) return undefined;

  return baseData?.states?.[state]?.overrides?.[type];
}

export function stateTiming(baseData: any, state: string): Timing {
  return { easing: baseData?.states?.[state]?.easing };
}

export function applyState(
  base: Record<string, any>,
  override: Record<string, any> | undefined,
): Record<string, any> {
  return override ? deepMerge(base, override) : base;
}

export const DEFAULT_STATE_EASING = "ease-out";

export const DEFAULT_HANDLER_DURATION = 400;

export function renameState(
  components: ComponentModel[],
  from: string,
  to: string,
): ComponentModel[] {
  const changed: ComponentModel[] = [];

  for (const component of components) {
    const data = component.data;

    if (component.type === "core.base" && data?.states?.[from]) {
      const states = Object.fromEntries(
        Object.entries(data.states).map(([name, state]) => [
          name === from ? to : name,
          state,
        ]),
      );

      changed.push({ ...component, data: { ...data, states } });
    }

    if (
      component.type === "core.event" &&
      data?.handlers?.some((handler: any) => handler.state === from)
    ) {
      const handlers = data.handlers.map((handler: any) =>
        handler.state === from ? { ...handler, state: to } : handler,
      );

      changed.push({ ...component, data: { ...data, handlers } });
    }

    if (
      component.type === "core.animation" &&
      data?.stateKeys?.some((key: any) => key.name === from)
    ) {
      const stateKeys = data.stateKeys.map((key: any) =>
        key.name === from ? { ...key, name: to } : key,
      );

      changed.push({ ...component, data: { ...data, stateKeys } });
    }
  }

  return changed;
}

export interface StateKey {
  t: number;
  name: string;
  easing?: string;
}

const EASINGS: Record<string, (t: number) => number> = {
  "ease-in": easeIn,
  "ease-out": easeOut,
  "ease-in-out": easeInOut,
  "back-in": backIn,
  "back-out": backOut,
  "back-in-out": backInOut,
  "circ-in": circIn,
  "circ-out": circOut,
  "circ-in-out": circInOut,
  anticipate,
};

export const EASING_OPTIONS = ["linear", ...Object.keys(EASINGS), "spring"];

function bezierPoints(
  easing: string,
): [number, number, number, number] | undefined {
  const match = easing.match(/cubic-bezier\(([^)]+)\)/);

  if (!match) return undefined;

  const points = match[1]!.split(",").map((n) => Number(n.trim()));

  return points.length === 4 && points.every(Number.isFinite)
    ? (points as [number, number, number, number])
    : undefined;
}

const SPRING_BOUNCE = 0.25;

const springs = new Map<number, ReturnType<typeof spring>>();

function springAt(t: number, duration: number): number {
  if (duration <= 0) return t;

  let generator = springs.get(duration);

  if (!generator) {
    generator = spring({
      keyframes: [0, 1],
      duration,
      bounce: SPRING_BOUNCE,
    });

    springs.set(duration, generator);
  }

  return generator.next(t * duration).value;
}

export function ease(
  easing: string | undefined,
  t: number,
  duration = 0,
): number {
  if (!easing) return t;
  if (easing === "spring") return springAt(t, duration);

  const named = EASINGS[easing];

  if (named) return named(t);

  const points = bezierPoints(easing);

  return points ? cubicBezier(...points)(t) : t;
}

export function stateAt(keys: StateKey[] | undefined, time: number) {
  if (!keys?.length) return undefined;

  const sorted = [...keys].sort((a, b) => a.t - b.t);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;

  if (time <= first.t)
    return { from: first.name, to: first.name, t: 1, span: 0 };
  if (time >= last.t) return { from: last.name, to: last.name, t: 1, span: 0 };

  for (let i = 1; i < sorted.length; i++) {
    const b = sorted[i]!;

    if (b.t < time) continue;

    const a = sorted[i - 1]!;
    const span = b.t - a.t;

    return {
      from: a.name,
      to: b.name,
      t: span <= 0 ? 1 : (time - a.t) / span,
      span,
      easing: b.easing,
    };
  }

  return { from: last.name, to: last.name, t: 1, span: 0 };
}

export function scheduledData(
  baseData: any,
  keys: StateKey[] | undefined,
  time: number,
  type: ComponentType,
  raw: Record<string, any>,
): Record<string, any> {
  const at = stateAt(keys, time);

  if (!at) return raw;

  const to = applyState(raw, overridesFor(baseData, at.to, type));

  if (at.from === at.to || at.t >= 1) return to;

  const from = applyState(raw, overridesFor(baseData, at.from, type));

  if (from === to) return to;

  return blendData(
    from,
    to,
    ease(
      at.easing ?? stateTiming(baseData, at.to || at.from).easing,
      at.t,
      at.span,
    ),
  );
}

export function upsertStateKey(
  keys: StateKey[] | undefined,
  t: number,
  name: string,
): StateKey[] {
  const prior = keys?.find((key) => key.t === t);

  return placeKey(keys, { ...prior, t, name });
}

export function animationDuration(data: any): number {
  return Math.max(0, ...keyTimes(data));
}

export function keyTimes(data: any): number[] {
  return [
    ...(data?.stateKeys ?? []),
    ...(data?.tracks ?? []).flatMap((track: Track) => track.keys),
  ].map((key) => key.t);
}

type KeyRange = { first: number; last: number; span: number } | undefined;

const ranges = new WeakMap<object, KeyRange>();

export function keyRange(data: any): KeyRange {
  if (!data) return undefined;
  if (ranges.has(data)) return ranges.get(data);

  const times = keyTimes(data);
  const first = Math.min(...times);
  const last = Math.max(...times);
  const range = last > first ? { first, last, span: last - first } : undefined;

  ranges.set(data, range);

  return range;
}

export function loopTime(data: any, time: number): number {
  const range = data?.loop ? keyRange(data) : undefined;

  if (!range || time <= range.last) return time;

  const cycle = Math.floor((time - range.first) / range.span);
  const along = (time - range.first) % range.span;

  return data.loop === "mirror" && cycle % 2
    ? range.last - along
    : range.first + along;
}
