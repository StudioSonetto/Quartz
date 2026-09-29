import { describe, it, expect, vi, afterEach } from "vitest";

describe("loadMediaMeta", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("gives up on a video whose details never load", async () => {
    vi.useFakeTimers();

    const meta = loadMediaMeta("https://example.invalid/clip.mp4", "clip.mp4");

    vi.advanceTimersByTime(15_000);

    expect(await meta).toBeNull();
  });
});
