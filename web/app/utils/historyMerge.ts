export const MERGE_WINDOW_MS = 500;

export interface HistoryEntry {
  label: string;
  mergeKey?: string;
  at: number;
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

  return { ...top, redo: next.redo, at: now };
}
