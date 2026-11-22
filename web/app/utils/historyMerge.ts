export const MERGE_WINDOW_MS = 500;

export class HistoryUnreachable extends Error {}

export interface HistoryEntry {
  label: string;
  mergeKey?: string;
  at: number;
  slides?: string[];
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

export function mergeInto(
  top: HistoryEntry,
  next: Omit<HistoryEntry, "at">,
  now: number,
): HistoryEntry | null {
  if (!top.mergeKey || !next.mergeKey) return null;
  if (top.mergeKey !== next.mergeKey) return null;
  if (now - top.at > MERGE_WINDOW_MS) return null;

  const slides =
    top.slides || next.slides
      ? [...new Set([...(top.slides ?? []), ...(next.slides ?? [])])]
      : undefined;

  return { ...top, slides, redo: next.redo, at: now };
}
