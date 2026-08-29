const entry = (over: any = {}) => ({
  label: "Edit",
  at: 1000,
  undo: () => {},
  redo: () => {},
  ...over,
});

describe("mergeInto", () => {
  it("merges a same-key change inside the window", () => {
    const top = entry({ mergeKey: "n1:core.transform", undo: () => "old" });
    const next = entry({ mergeKey: "n1:core.transform", redo: () => "new" });

    const merged = mergeInto(top, next, 1200);

    expect(merged).not.toBeNull();
    expect(merged!.undo()).toBe("old");
    expect(merged!.redo()).toBe("new");
    expect(merged!.at).toBe(1200);
  });

  it("refuses a different key", () => {
    const top = entry({ mergeKey: "n1:core.transform" });
    const next = entry({ mergeKey: "n2:core.transform" });

    expect(mergeInto(top, next, 1200)).toBeNull();
  });

  it("refuses once the window has passed", () => {
    const top = entry({ mergeKey: "n1:core.transform" });
    const next = entry({ mergeKey: "n1:core.transform" });

    expect(mergeInto(top, next, 1000 + MERGE_WINDOW_MS + 1)).toBeNull();
  });

  it("refuses when either side has no key", () => {
    const top = entry({ mergeKey: undefined });
    const next = entry({ mergeKey: "n1:core.transform" });

    expect(mergeInto(top, next, 1200)).toBeNull();
    expect(
      mergeInto(entry({ mergeKey: "n1:core.transform" }), entry(), 1200),
    ).toBeNull();
  });
});
