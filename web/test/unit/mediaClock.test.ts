import { describe, it, expect, afterEach } from "vitest";
import { nextTick } from "vue";

globalThis.cancelAnimationFrame ??= () => {};

const fakeVideo = (extra: Record<string, any> = {}) => {
  const video: any = {
    currentTime: 0,
    duration: 4,
    paused: true,
    seeking: false,
    readyState: 4,
    loop: false,
    muted: true,
    volume: 1,
    seeks: 0,
    plays: 0,
    listeners: {} as Record<string, () => void>,
    play: () => (video.plays++, (video.paused = false), Promise.resolve()),
    pause: () => (video.paused = true),
    addEventListener: (name: string, fn: () => void) =>
      (video.listeners[name] = fn),
    removeEventListener: () => {},
    ...extra,
  };

  return new Proxy(video, {
    set(target, key, value) {
      if (key === "currentTime") target.seeks++;
      target[key] = value;

      return true;
    },
  });
};

const timing = { start: 0, duration: 4000, loop: false, volume: 1, muted: false };

describe("useMediaClock", () => {
  const { time, playing, reset } = usePlayhead();
  let stop = () => {};

  afterEach(() => {
    stop();
    reset();
  });

  it("does not seek a hidden video while the slide plays", async () => {
    const video = fakeVideo();

    stop = useMediaClock(video, {
      timing: () => timing,
      audible: () => false,
      shown: () => false,
    });
    playing.value = true;
    time.value = 1000;
    await nextTick();
    time.value = 1016;
    await nextTick();

    expect(video.seeks).toBe(0);
    expect(video.paused).toBe(true);
  });

  it("lets a looping video wrap itself instead of seeking back", async () => {
    const video = fakeVideo({ currentTime: 0.01 });

    playing.value = true;
    time.value = 3990;
    stop = useMediaClock(video, {
      timing: () => ({ ...timing, loop: true }),
      audible: () => false,
    });
    await nextTick();

    expect(video.loop).toBe(true);
    expect(video.seeks).toBe(0);
  });

  it("does not re-seek a video that is still buffering", async () => {
    const video = fakeVideo({ readyState: 2, currentTime: 0 });

    stop = useMediaClock(video, {
      timing: () => timing,
      audible: () => false,
    });
    playing.value = true;
    time.value = 2000;
    await nextTick();

    expect(video.seeks).toBe(0);
  });

  it("retries a refused play only after the slide pauses", async () => {
    const video = fakeVideo({
      play: () => {
        video.plays++;

        return Promise.reject(new DOMException("", "NotAllowedError"));
      },
    });

    playing.value = true;
    time.value = 1000;
    stop = useMediaClock(video, {
      timing: () => timing,
      audible: () => false,
    });
    await nextTick();
    await Promise.resolve();
    time.value = 1016;
    await nextTick();

    expect(video.plays).toBe(1);
  });

  it("forgets the old length when the source changes", async () => {
    const video = fakeVideo({ duration: 10 });

    time.value = 5000;
    stop = useMediaClock(video, {
      timing: () => ({ ...timing, loop: true }),
      audible: () => false,
    });
    video.listeners.loadedmetadata();
    await nextTick();

    expect(video.currentTime).toBe(5);

    video.listeners.emptied();
    await nextTick();

    expect(video.currentTime).toBe(1);
  });
});
