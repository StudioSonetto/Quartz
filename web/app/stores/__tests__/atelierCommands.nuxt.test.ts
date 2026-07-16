import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAtelierStore } from "~/stores/useAtelierStore";

describe("useAtelierStore command state", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("toggles palette open/closed", () => {
    const s = useAtelierStore();
    expect(s.paletteOpen).toBe(false);
    s.togglePalette();
    expect(s.paletteOpen).toBe(true);
    s.closePalette();
    expect(s.paletteOpen).toBe(false);
  });

  it("pushRecentCommand dedupes and caps at 5, most-recent first", () => {
    const s = useAtelierStore();
    ["a", "b", "c", "d", "e", "f"].forEach((id) => s.pushRecentCommand(id));
    expect(s.recentCommands).toEqual(["f", "e", "d", "c", "b"]);
    s.pushRecentCommand("d");
    expect(s.recentCommands).toEqual(["d", "f", "e", "c", "b"]);
  });
});
