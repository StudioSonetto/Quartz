import type { ComponentType } from "#shared/types";

export interface TrackKey {
  t: number;
  value: number | string;
}

export interface Track {
  type: ComponentType;
  path: string[];
  easing?: string;
  keys: TrackKey[];
}

export function tracksDuration(tracks: Track[] | undefined): number {
  let last = 0;

  for (const track of tracks ?? [])
    for (const key of track.keys) if (key.t > last) last = key.t;

  return last;
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
      : blendValue(a.value, b.value, (time - a.t) / span);
  }

  return last.value;
}

export function findTrack(
  tracks: Track[] | undefined,
  type: ComponentType,
  path: string[],
): Track | undefined {
  return tracks?.find(
    (track) => track.type === type && track.path.join(".") === path.join("."),
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

  const keys = [
    ...(existing?.keys ?? []).filter((key) => key.t !== t),
    { t, value },
  ].sort((a, b) => a.t - b.t);

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

export function keyedAt(
  tracks: Track[] | undefined,
  type: ComponentType,
  path: string[],
  t: number,
): boolean {
  return !!findTrack(tracks, type, path)?.keys.some((key) => key.t === t);
}

export function moveTrackKey(
  tracks: Track[] | undefined,
  type: ComponentType,
  path: string[],
  from: number,
  to: number,
): Track[] {
  const key = findTrack(tracks, type, path)?.keys.find((k) => k.t === from);

  if (!key || from === to) return tracks ?? [];

  const cleared = (tracks ?? []).map((track) =>
    track.type === type && track.path.join(".") === path.join(".")
      ? { ...track, keys: track.keys.filter((k) => k.t !== from) }
      : track,
  );

  return upsertKey(cleared, type, path, to, key.value);
}

export function timeAtPointer(
  box: DOMRect,
  clientX: number,
  duration: number,
): number {
  const ratio = Math.min(Math.max((clientX - box.left) / box.width, 0), 1);

  return Math.round(ratio * duration);
}

export const timePercent = (t: number, duration: number) =>
  `${duration ? (t / duration) * 100 : 0}%`;
