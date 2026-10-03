import { describe, it, expect, afterEach } from "vitest";

const mirror = {
  loop: "mirror",
  tracks: [
    {
      type: "core.transform",
      path: ["x"],
      keys: [
        { t: 0, value: 0 },
        { t: 1000, value: 1 },
      ],
    },
  ],
  stateKeys: [],
};

describe("pausing a looping slide", () => {
  afterEach(() => {
    usePlayhead().reset();
  });

  it("holds the frame it was showing in a mirror loop's backward half", () => {
    const { time, playing, setLength, pause, nodeTime, keyTime } =
      usePlayhead();

    setLength(1000, true, true);
    playing.value = true;
    time.value = 5300;
    pause();

    expect(nodeTime(mirror)).toBe(700);
    expect(keyTime(mirror)).toBe(700);
  });

  it("resumes in the direction it was going", () => {
    const { time, playing, setLength, pause, play } = usePlayhead();

    setLength(1000, true, true);
    playing.value = true;
    time.value = 5300;
    pause();
    play();

    expect(time.value).toBe(5300);
  });

  it("keys at the end when paused past it on a slide that never ends", () => {
    const { time, playing, setLength, pause, keyTime } = usePlayhead();

    setLength(1000, true, true);
    playing.value = true;
    time.value = 3400;
    pause();

    expect(keyTime()).toBe(1000);
  });

  it("stops holding once scrubbed", () => {
    const { time, playing, setLength, pause, seek, nodeTime } = usePlayhead();

    setLength(1000, true, true);
    playing.value = true;
    time.value = 5300;
    pause();
    seek(1500);

    expect(nodeTime(mirror)).toBe(1500);
  });
});
