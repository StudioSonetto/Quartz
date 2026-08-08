import { describe, expect, it } from "vitest";
import { checkSlideOrder } from "~~/server/utils/slideOrder";

const current = ["s1", "s2", "s3"];

// Unreachable from the UI: a well-behaved client always sends a valid order.
describe("checkSlideOrder", () => {
  it("accepts a permutation of exactly the deck's slides", () => {
    expect(checkSlideOrder(current, ["s3", "s1", "s2"])).toEqual({ ok: true });
  });

  it("rejects a wrong-length order — a stale client would drop a slide", () => {
    expect(checkSlideOrder(current, ["s1", "s2"])).toEqual({
      ok: false,
      reason: "length",
    });
  });

  it("rejects duplicates, which would collapse two slides onto one index", () => {
    expect(checkSlideOrder(current, ["s1", "s1", "s2"])).toEqual({
      ok: false,
      reason: "duplicate",
    });
  });

  it("rejects an id belonging to another deck", () => {
    expect(checkSlideOrder(current, ["s1", "s2", "other"])).toEqual({
      ok: false,
      reason: "foreign",
    });
  });
});
