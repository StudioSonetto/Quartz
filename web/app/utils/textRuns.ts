import type {
  Run,
  TypographyMarks,
} from "~/modules/core/components/typography/types";

const NO_MARKS: Partial<TypographyMarks> = {};

function copyRun(run: Run, text = run.text): Run {
  return run.marks ? { text, marks: { ...run.marks } } : { text };
}

function cleanMarks(
  marks: Partial<TypographyMarks>,
  base?: Record<string, any>,
): Partial<TypographyMarks> | undefined {
  const entries = Object.entries(marks).filter(
    ([key, value]) =>
      value !== undefined && (!base || !deepEqual(value, base[key])),
  );

  return entries.length
    ? (Object.fromEntries(entries) as Partial<TypographyMarks>)
    : undefined;
}

export function toRuns(content: unknown): Run[] {
  if (Array.isArray(content))
    return content.length ? (content as Run[]) : [{ text: "" }];

  return [{ text: content == null ? "" : String(content) }];
}

export function runsText(runs: Run[]): string {
  return runs.map((run) => run.text).join("");
}

export function fromRuns(runs: Run[]): string | Run[] {
  const [first] = runs;

  return runs.length === 1 && first && !first.marks ? first.text : runs;
}

export function mergeRuns(runs: Run[]): Run[] {
  const out: Run[] = [];

  for (const run of runs) {
    if (!run.text) continue;

    const last = out[out.length - 1];

    if (last && deepEqual(last.marks ?? NO_MARKS, run.marks ?? NO_MARKS)) {
      last.text += run.text;
    } else out.push(copyRun(run));
  }

  return out.length ? out : [{ text: "" }];
}

function sliceRuns(runs: Run[], start: number, end: number): Run[] {
  const out: Run[] = [];
  let at = 0;

  for (const run of runs) {
    const from = Math.max(start - at, 0);
    const to = Math.min(end - at, run.text.length);

    at += run.text.length;

    if (to > from) out.push(copyRun(run, run.text.slice(from, to)));
  }

  return out;
}

export function applyMarks(
  runs: Run[],
  start: number,
  end: number,
  patch: Partial<TypographyMarks>,
  base?: Record<string, any>,
): Run[] {
  if (end <= start) return runs;

  const marked = sliceRuns(runs, start, end).map((run) => {
    const marks = cleanMarks({ ...run.marks, ...patch }, base);

    return marks ? { text: run.text, marks } : { text: run.text };
  });

  return mergeRuns([
    ...sliceRuns(runs, 0, start),
    ...marked,
    ...sliceRuns(runs, end, Infinity),
  ]);
}

export function selectionMark(
  runs: Run[],
  start: number,
  end: number,
  key: keyof TypographyMarks,
  base: Record<string, any>,
): any {
  const values: any[] = [];
  let at = 0;

  for (const run of runs) {
    const from = at;
    const to = at + run.text.length;

    at = to;

    if (to <= start || from >= end) continue;

    values.push(run.marks?.[key] ?? base[key]);
  }

  if (!values.length) return undefined;

  const first = values[0];

  return values.every((value) => deepEqual(value, first)) ? first : undefined;
}

export function spliceText(runs: Run[], next: string): Run[] {
  const prev = runsText(runs);

  if (prev === next) return runs;

  let head = 0;

  while (head < prev.length && head < next.length && prev[head] === next[head])
    head++;

  let tail = 0;

  while (
    tail < prev.length - head &&
    tail < next.length - head &&
    prev[prev.length - 1 - tail] === next[next.length - 1 - tail]
  )
    tail++;

  const kept = sliceRuns(runs, 0, head);
  const inserted = next.slice(head, next.length - tail);

  const owner = kept[kept.length - 1];

  return mergeRuns([
    ...kept,
    owner ? copyRun(owner, inserted) : { text: inserted },
    ...sliceRuns(runs, prev.length - tail, Infinity),
  ]);
}
