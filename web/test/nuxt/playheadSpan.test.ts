import { describe, it, expect, afterEach } from "vitest";

describe("playhead span arms on presence, not on a nonzero furthest key", () => {
  afterEach(() => {
    usePlayhead().reset();
  });

  it("stays scrubbable past t=0 when the only key sits at t=0", () => {
    const { duration, canPlay, setLength } = usePlayhead();

    setLength(0, true);

    expect(duration.value).toBe(5000);
    expect(canPlay.value).toBe(true);
  });

  it("stays inert when nothing is keyed", () => {
    const { duration, canPlay, setLength } = usePlayhead();

    setLength(0, false);

    expect(duration.value).toBe(0);
    expect(canPlay.value).toBe(false);
  });

  it("tracks the furthest key once it clears the headroom", () => {
    const { duration, setLength } = usePlayhead();

    setLength(8000, true);

    expect(duration.value).toBe(8000);
  });

  it("is scrubbable but not playable when the only key sits at t=0", () => {
    const { duration, canPlay, playable, setLength, reset } = usePlayhead();

    reset();
    setLength(0, true);

    expect(duration.value).toBe(5000);
    expect(canPlay.value).toBe(true);
    expect(playable.value).toBe(false);
  });

  it("is playable once a key sits past zero", () => {
    const { playable, setLength, reset } = usePlayhead();

    reset();
    setLength(8000, true);

    expect(playable.value).toBe(true);
  });

  it("lets a slide that never ends be joined past its last key", () => {
    const { time, setLength, seek, play, reset } = usePlayhead();

    reset();
    setLength(8000, true, true);
    seek(60000);

    expect(time.value).toBe(60000);

    play();

    expect(time.value).toBe(60000);
  });

  it("pauses past the end where it is, but keys at the end", () => {
    const { time, playing, setLength, keyTime, reset } = usePlayhead();
    const { pauseHere, shownTime } = usePlayheadDisplay(() => []);

    reset();
    setLength(2000, true, true);
    playing.value = true;
    time.value = 60000;
    pauseHere();

    expect(time.value).toBe(60000);
    expect(shownTime.value).toBe(2000);
    expect(keyTime()).toBe(2000);
  });
});
