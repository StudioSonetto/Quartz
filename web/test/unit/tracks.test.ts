import { describe, it, expect } from "vitest";

describe("animationDuration across tracks", () => {
  it("is the furthest key across every track, which is what makes a slide's length derived", () => {
    const tracks = [
      {
        type: "core.transform",
        path: ["position", "x"],
        keys: [
          { t: 0, value: 0 },
          { t: 800, value: 50 },
        ],
      },
      {
        type: "core.typography",
        path: ["size"],
        keys: [
          { t: 0, value: 12 },
          { t: 2000, value: 24 },
        ],
      },
    ];

    expect(animationDuration({ tracks })).toBe(2000);
  });

  it("ignores a track with no keys rather than counting it as zero-length", () => {
    const tracks = [
      { type: "core.transform", path: ["position", "x"], keys: [] },
      {
        type: "core.transform",
        path: ["position", "y"],
        keys: [{ t: 500, value: 10 }],
      },
    ];

    expect(animationDuration({ tracks })).toBe(500);
  });
});

describe("valueAt", () => {
  const keys: TrackKey[] = [
    { t: 0, value: 0 },
    { t: 1000, value: 100 },
  ];

  it("holds the first key before the track starts, so a late track does not snap in from nowhere", () => {
    expect(valueAt(keys, -50)).toBe(0);
  });

  it("holds the last key after the track ends", () => {
    expect(valueAt(keys, 5000)).toBe(100);
  });

  it("returns the key's own value when the playhead sits exactly on it", () => {
    expect(valueAt(keys, 1000)).toBe(100);
  });

  it("interpolates between the surrounding pair", () => {
    expect(valueAt(keys, 250)).toBe(25);
  });

  it("interpolates colours, so a hex-valued track fades rather than stepping", () => {
    const colours: TrackKey[] = [
      { t: 0, value: "#000000" },
      { t: 100, value: "#ffffff" },
    ];

    expect(valueAt(colours, 50)).toBe("#808080");
  });

  it("eases into a key using that key's own easing", () => {
    const eased: TrackKey[] = [
      { t: 0, value: 0 },
      { t: 1000, value: 100, easing: "ease-in" },
    ];

    expect(valueAt(eased, 500)).toBeCloseTo(ease("ease-in", 0.5) * 100);
  });

  it("is undefined for an empty track rather than throwing", () => {
    expect(valueAt([], 0)).toBeUndefined();
  });
});

describe("sampleTracks", () => {
  const tracks: Track[] = [
    {
      type: "core.transform",
      path: ["position", "x"],
      keys: [
        { t: 0, value: 0 },
        { t: 1000, value: 200 },
      ],
    },
    {
      type: "core.typography",
      path: ["size"],
      keys: [
        { t: 0, value: 10 },
        { t: 1000, value: 20 },
      ],
    },
  ];

  it("writes only the keyed field, leaving the rest of the component's data alone", () => {
    const data = { position: { x: 999, y: 7 }, rotation: 45 };
    const out = sampleTracks(tracks, 500, "core.transform", data);

    expect(out.position.x).toBe(100);
    expect(out.position.y).toBe(7);
    expect(out.rotation).toBe(45);
  });

  it("ignores tracks belonging to another component type", () => {
    const data = { size: 99 };

    expect(sampleTracks(tracks, 500, "core.typography", data).size).toBe(15);
  });

  it("returns the data untouched when there are no tracks, so unanimated nodes cost nothing", () => {
    const data = { position: { x: 1, y: 2 } };

    expect(sampleTracks(undefined, 500, "core.transform", data)).toBe(data);
  });
});

describe("states composed over tracks", () => {
  // The rule the whole design rests on: sample first, then apply the state, so
  // a hover tint still works on a node that is mid-move. Both halves are pure,
  // so this asserts the ordering without a store.
  const tracks: Track[] = [
    {
      type: "core.transform",
      path: ["position", "x"],
      keys: [
        { t: 0, value: 0 },
        { t: 1000, value: 200 },
      ],
    },
  ];

  it("lets a state override win for the field it names", () => {
    const sampled = sampleTracks(tracks, 500, "core.transform", {
      position: { x: 0, y: 0 },
    });

    expect(applyState(sampled, { position: { x: 999 } }).position.x).toBe(999);
  });

  it("leaves the sampled value in place for fields the state does not name", () => {
    const sampled = sampleTracks(tracks, 500, "core.transform", {
      position: { x: 0, y: 0 },
      rotation: 0,
    });

    const out = applyState(sampled, { rotation: 90 });

    expect(out.position.x).toBe(100);
    expect(out.rotation).toBe(90);
  });
});

describe("upsertKey", () => {
  it("creates the track when the field has none yet", () => {
    const out = upsertKey(
      undefined,
      "core.transform",
      ["position", "x"],
      500,
      40,
    );

    expect(out).toHaveLength(1);
    expect(out[0]!.keys).toEqual([{ t: 500, value: 40 }]);
  });

  it("keeps keys sorted by time, because valueAt scans them in order", () => {
    let out = upsertKey(
      undefined,
      "core.transform",
      ["position", "x"],
      900,
      90,
    );
    out = upsertKey(out, "core.transform", ["position", "x"], 100, 10);

    expect(out[0]!.keys.map((k) => k.t)).toEqual([100, 900]);
  });

  it("replaces the key already at that time rather than stacking a second one", () => {
    let out = upsertKey(
      undefined,
      "core.transform",
      ["position", "x"],
      500,
      40,
    );
    out = upsertKey(out, "core.transform", ["position", "x"], 500, 75);

    expect(out[0]!.keys).toEqual([{ t: 500, value: 75 }]);
  });

  it("keeps a key's easing when its value is re-keyed or it is dragged", () => {
    let out = upsertKey(
      undefined,
      "core.transform",
      ["position", "x"],
      500,
      40,
    );
    out = setKeyEasing(
      out,
      "core.transform",
      ["position", "x"],
      500,
      "ease-in",
    );
    out = upsertKey(out, "core.transform", ["position", "x"], 500, 75);
    out = moveTrackKey(out, "core.transform", ["position", "x"], 500, 900);

    expect(out[0]!.keys).toEqual([{ t: 900, value: 75, easing: "ease-in" }]);
  });

  it("keys a second field into its own track, not the first one", () => {
    let out = upsertKey(undefined, "core.transform", ["position", "x"], 0, 1);
    out = upsertKey(out, "core.transform", ["position", "y"], 0, 2);

    expect(out).toHaveLength(2);
  });

  it("does not mutate the tracks it was given", () => {
    const before: Track[] = [
      {
        type: "core.transform",
        path: ["position", "x"],
        keys: [{ t: 0, value: 0 }],
      },
    ];

    upsertKey(before, "core.transform", ["position", "x"], 500, 40);

    expect(before[0]!.keys).toHaveLength(1);
  });
});

describe("removeKey", () => {
  const tracks = [
    {
      type: "core.transform" as any,
      path: ["position", "x"],
      keys: [
        { t: 0, value: 0 },
        { t: 800, value: 50 },
      ],
    },
    {
      type: "core.typography" as any,
      path: ["size"],
      keys: [{ t: 0, value: 12 }],
    },
  ];

  it("drops just the key at that time", () => {
    const out = removeKey(
      tracks,
      "core.transform" as any,
      ["position", "x"],
      0,
    );

    expect(out[0]!.keys).toEqual([{ t: 800, value: 50 }]);
    expect(out).toHaveLength(2);
  });

  it("drops the whole track once its last key goes, so the field stops sticking", () => {
    const out = removeKey(tracks, "core.typography" as any, ["size"], 0);

    expect(out).toHaveLength(1);
    expect(out[0]!.type).toBe("core.transform");
  });

  it("leaves everything alone when nothing matches", () => {
    expect(
      removeKey(tracks, "core.transform" as any, ["position", "x"], 999),
    ).toHaveLength(2);
    expect(removeKey(undefined, "core.transform" as any, ["x"], 0)).toEqual([]);
  });
});

describe("keyedAt", () => {
  const tracks = [
    {
      type: "core.transform" as any,
      path: ["position", "x"],
      keys: [{ t: 800, value: 50 }],
    },
  ];

  it("is true only where a key actually sits", () => {
    expect(
      keyedAt(tracks, "core.transform" as any, ["position", "x"], 800),
    ).toBe(true);
    expect(keyedAt(tracks, "core.transform" as any, ["position", "x"], 0)).toBe(
      false,
    );
    expect(
      keyedAt(undefined, "core.transform" as any, ["position", "x"], 800),
    ).toBe(false);
  });
});
