import { describe, it, expect } from "vitest";

const keys = [
  { t: 0, name: "" },
  { t: 1000, name: "hot" },
  { t: 2000, name: "cold" },
];

describe("stateAt", () => {
  it("is undefined with no keys, so an unscheduled node skips the layer entirely", () => {
    expect(stateAt(undefined, 500)).toBeUndefined();
    expect(stateAt([], 500)).toBeUndefined();
  });

  it("holds the first key before it, the way a track holds its first value", () => {
    expect(stateAt(keys, -10)).toEqual({ from: "", to: "", t: 1, span: 0 });
    expect(stateAt(keys, 0)).toEqual({ from: "", to: "", t: 1, span: 0 });
  });

  it("holds the last key after it", () => {
    expect(stateAt(keys, 5000)).toEqual({
      from: "cold",
      to: "cold",
      t: 1,
      span: 0,
    });
  });

  it("lands exactly on a key, fully arrived at it", () => {
    expect(stateAt(keys, 1000)).toEqual({
      from: "",
      to: "hot",
      t: 1,
      span: 1000,
    });
  });

  it("blends across the gap, which is what makes the gap the duration", () => {
    // span is the gap, and the gap is what a spring is timed against.
    expect(stateAt(keys, 1500)).toEqual({
      from: "hot",
      to: "cold",
      t: 0.5,
      span: 1000,
    });
  });

  it("sorts, so a key dragged past its neighbour still reads in time order", () => {
    const shuffled = [
      { t: 2000, name: "cold" },
      { t: 0, name: "" },
    ];

    expect(stateAt(shuffled, 1000)).toEqual({
      from: "",
      to: "cold",
      t: 0.5,
      span: 2000,
    });
  });
});

describe("scheduledData", () => {
  const base = {
    states: {
      hot: { overrides: { "core.layout": { padding: 10 } }, easing: "linear" },
    },
  };

  it("applies the scheduled state's overrides over the sampled data", () => {
    const out = scheduledData(
      base,
      [{ t: 0, name: "hot" }],
      500,
      "core.layout" as any,
      { padding: 0, gap: 4 },
    );

    expect(out).toEqual({ padding: 10, gap: 4 });
  });

  it("blends halfway across a gap", () => {
    const out = scheduledData(
      base,
      [
        { t: 0, name: "" },
        { t: 1000, name: "hot" },
      ],
      500,
      "core.layout" as any,
      { padding: 0, gap: 4 },
    );

    expect(out.padding).toBe(5);
  });

  it("a key's own easing beats its state's", () => {
    const out = scheduledData(
      base,
      [
        { t: 0, name: "" },
        { t: 1000, name: "hot", easing: "ease-in" },
      ],
      500,
      "core.layout" as any,
      { padding: 0, gap: 4 },
    );

    expect(out.padding).toBeCloseTo(ease("ease-in", 0.5) * 10);
  });

  it("leaves the sampled data alone when nothing is scheduled", () => {
    const raw = { padding: 0 };

    expect(scheduledData(base, [], 500, "core.layout" as any, raw)).toBe(raw);
  });

  it("returning to base borrows the leaving state's easing, not linear", () => {
    const easedBase = {
      states: {
        hot: {
          overrides: { "core.layout": { padding: 100 } },
          easing: "ease-in",
        },
      },
    };

    const out = scheduledData(
      easedBase,
      [
        { t: 0, name: "hot" },
        { t: 1000, name: "" },
      ],
      500,
      "core.layout" as any,
      { padding: 0 },
    );

    expect(out.padding).toBeCloseTo(68.462, 2);
  });
});

describe("layer order", () => {
  it("lets an interactive state beat a scheduled one for the fields it names", () => {
    const base = {
      states: {
        hot: { overrides: { "core.layout": { padding: 10, gap: 1 } } },
        hover: { overrides: { "core.layout": { padding: 99 } } },
      },
    };

    const scheduled = scheduledData(
      base,
      [{ t: 0, name: "hot" }],
      0,
      "core.layout" as any,
      { padding: 0, gap: 0 },
    );

    const out = applyState(
      scheduled,
      overridesFor(base, "hover", "core.layout" as any),
    );

    expect(out.padding).toBe(99);
    // The scheduled state still owns what the hover does not name.
    expect(out.gap).toBe(1);
  });
});

describe("upsertStateKey", () => {
  it("replaces the key at the same time and keeps the list sorted", () => {
    const out = upsertStateKey(
      [
        { t: 1000, name: "hot" },
        { t: 0, name: "" },
      ],
      1000,
      "cold",
    );

    expect(out).toEqual([
      { t: 0, name: "" },
      { t: 1000, name: "cold" },
    ]);
  });
});

describe("animationDuration", () => {
  it("is zero when nothing is keyed, so an unanimated slide has an inert playhead", () => {
    expect(animationDuration(undefined)).toBe(0);
    expect(animationDuration({ tracks: [], stateKeys: [] })).toBe(0);
  });

  it("counts state keys as well as tracks, so a scheduled state extends the slide", () => {
    const data = {
      tracks: [
        {
          type: "core.transform",
          path: ["position", "x"],
          keys: [{ t: 800, value: 5 }],
        },
      ],
      stateKeys: [{ t: 2800, name: "hot" }],
    };

    expect(animationDuration(data)).toBe(2800);
  });
});

describe("loopTime", () => {
  const keyed = (loop?: string) => ({
    loop,
    tracks: [
      {
        type: "core.transform",
        path: ["position", "x"],
        keys: [
          { t: 1000, value: 0 },
          { t: 3000, value: 10 },
        ],
      },
    ],
  });

  it("leaves time alone until the last key, so an intro before the first key plays once", () => {
    expect(loopTime(keyed("on"), 500)).toBe(500);
    expect(loopTime(keyed("on"), 3000)).toBe(3000);
    expect(loopTime(keyed(), 9000)).toBe(9000);
  });

  it("on wraps back to the first key", () => {
    expect(loopTime(keyed("on"), 3500)).toBe(1500);
    expect(loopTime(keyed("on"), 5500)).toBe(1500);
  });

  it("mirror runs backwards on odd cycles, so there is no jump at the wrap", () => {
    expect(loopTime(keyed("mirror"), 3500)).toBe(2500);
    expect(loopTime(keyed("mirror"), 5500)).toBe(1500);
  });
});
