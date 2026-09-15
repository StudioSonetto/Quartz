import type { ComponentType } from "#shared/types";

export interface TrackKey {
  t: number;
  value: number | string;
  easing?: string;
}

export interface Track {
  type: ComponentType;
  path: string[];
  keys: TrackKey[];
}

export function placeKey<K extends { t: number }>(
  keys: K[] | undefined,
  key: K,
): K[] {
  return [...(keys ?? []).filter((k) => k.t !== key.t), key].sort(
    (a, b) => a.t - b.t,
  );
}

export function moveKey<K extends { t: number }>(
  keys: K[] | undefined,
  from: number,
  to: number,
): K[] {
  const key = keys?.find((k) => k.t === from);

  if (!key || from === to) return keys ?? [];

  return placeKey(
    keys!.filter((k) => k.t !== from),
    { ...key, t: to },
  );
}

export function setEasingAt<K extends { t: number; easing?: string }>(
  keys: K[] | undefined,
  t: number,
  easing: string | undefined,
): K[] {
  const key = keys?.find((k) => k.t === t);

  return key ? placeKey(keys, { ...key, easing }) : (keys ?? []);
}

export function valueAt(
  keys: TrackKey[],
  time: number,
): number | string | undefined {
  if (!keys.length) return undefined;

  const first = keys[0]!;
  const last = keys[keys.length - 1]!;

  if (time <= first.t) return first.value;
  if (time >= last.t) return last.value;

  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]!;

    if (b.t < time) continue;

    const a = keys[i - 1]!;
    const span = b.t - a.t;

    return span <= 0
      ? b.value
      : blendValue(a.value, b.value, ease(b.easing, (time - a.t) / span, span));
  }

  return last.value;
}

export function findTrack(
  tracks: Track[] | undefined,
  type: ComponentType,
  path: string[],
): Track | undefined {
  return tracks?.find(
    (track) =>
      track.type === type &&
      track.path.length === path.length &&
      track.path.every((key, i) => key === path[i]),
  );
}

export function upsertKey(
  tracks: Track[] | undefined,
  type: ComponentType,
  path: string[],
  t: number,
  value: number | string,
): Track[] {
  const existing = findTrack(tracks, type, path);

  // Re-keying a value must not drop the key's easing.
  const prior = existing?.keys.find((key) => key.t === t);
  const keys = placeKey(existing?.keys, { ...prior, t, value });

  const next: Track = { ...(existing ?? { type, path }), keys };

  return existing
    ? (tracks ?? []).map((track) => (track === existing ? next : track))
    : [...(tracks ?? []), next];
}

export function sampleTracks(
  tracks: Track[] | undefined,
  time: number,
  type: ComponentType,
  data: Record<string, any>,
): Record<string, any> {
  if (!tracks?.length) return data;

  let out = data;

  for (const track of tracks) {
    if (track.type !== type) continue;

    const value = valueAt(track.keys, time);

    if (value !== undefined) out = setNested(out, track.path, value);
  }

  return out;
}

export function removeKey(
  tracks: Track[] | undefined,
  type: ComponentType,
  path: string[],
  t: number,
): Track[] {
  const existing = findTrack(tracks, type, path);

  if (!existing) return tracks ?? [];

  const keys = existing.keys.filter((key) => key.t !== t);

  // A track with no keys still claims the field, so the value would stick.
  return keys.length
    ? (tracks ?? []).map((track) =>
        track === existing ? { ...existing, keys } : track,
      )
    : (tracks ?? []).filter((track) => track !== existing);
}

function editTrackKeys(
  tracks: Track[] | undefined,
  type: ComponentType,
  path: string[],
  edit: (keys: TrackKey[]) => TrackKey[],
): Track[] {
  const existing = findTrack(tracks, type, path);

  if (!existing) return tracks ?? [];

  return tracks!.map((track) =>
    track === existing ? { ...track, keys: edit(track.keys) } : track,
  );
}

export function moveTrackKey(
  tracks: Track[] | undefined,
  type: ComponentType,
  path: string[],
  from: number,
  to: number,
): Track[] {
  return editTrackKeys(tracks, type, path, (keys) => moveKey(keys, from, to));
}

export function setKeyEasing(
  tracks: Track[] | undefined,
  type: ComponentType,
  path: string[],
  t: number,
  easing: string | undefined,
): Track[] {
  return editTrackKeys(tracks, type, path, (keys) =>
    setEasingAt(keys, t, easing),
  );
}

export function changedPaths(a: any, b: any, path: string[] = []): string[][] {
  if (a === b) return [];

  if (isPlainObject(a) && isPlainObject(b))
    return Object.keys(b).flatMap((k) =>
      changedPaths(a[k], b[k], [...path, k]),
    );

  return [path];
}

export function timeAtPointer(
  box: DOMRect,
  clientX: number,
  duration: number,
): number {
  const ratio = Math.min(Math.max((clientX - box.left) / box.width, 0), 1);

  return roundTime(ratio * duration);
}

// Matches the 0.00s readout, so a time you can see is a time a key can sit on.
const TIME_STEP = 10;

export const roundTime = (ms: number) => Math.round(ms / TIME_STEP) * TIME_STEP;

export const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

export function snapTime(t: number, targets: number[], within: number) {
  const nearest = targets.reduce(
    (best, target) =>
      Math.abs(target - t) < Math.abs(best - t) ? target : best,
    Infinity,
  );

  return Math.abs(nearest - t) <= within ? nearest : t;
}

export const timePercent = (t: number, duration: number) =>
  `${duration ? (t / duration) * 100 : 0}%`;
