import { describe, it, expect } from "vitest";

describe("mediaTime", () => {
  const clip = { start: 1000, duration: 4000, loop: false };

  it("holds frame 0 before start", () => {
    expect(mediaTime(500, clip)).toEqual({ at: 0, running: false });
  });

  it("follows the clock inside the clip", () => {
    expect(mediaTime(3000, clip)).toEqual({ at: 2000, running: true });
  });

  it("holds the last frame after the end", () => {
    expect(mediaTime(9000, clip)).toEqual({ at: 4000, running: false });
  });

  it("wraps when looping instead of clamping", () => {
    expect(mediaTime(7500, { ...clip, loop: true })).toEqual({
      at: 2500,
      running: true,
    });
  });

  it("holds frame 0 while the length is unknown", () => {
    expect(mediaTime(3000, { ...clip, duration: 0 })).toEqual({
      at: 0,
      running: false,
    });
  });
});

describe("mediaSpan", () => {
  it("ends the slide on the 10 ms grid", () => {
    expect(
      mediaSpan({
        start: 0,
        duration: 4003,
        loop: false,
        volume: 1,
        muted: false,
      })?.end,
    ).toBe(4000);
  });
});
