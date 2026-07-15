import { describe, it, expect } from "vitest";
import { eventToCombo } from "./keyCombo";

const ev = (o: Partial<KeyboardEvent>) =>
  ({ key: "", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...o }) as KeyboardEvent;

describe("eventToCombo", () => {
  it("maps meta and ctrl both to mod", () => {
    expect(eventToCombo(ev({ key: "k", metaKey: true }))).toBe("mod+k");
    expect(eventToCombo(ev({ key: "k", ctrlKey: true }))).toBe("mod+k");
  });

  it("orders modifiers mod+alt+shift+key and lowercases", () => {
    expect(eventToCombo(ev({ key: "K", metaKey: true, altKey: true, shiftKey: true })))
      .toBe("mod+alt+shift+k");
  });

  it("normalizes named keys", () => {
    expect(eventToCombo(ev({ key: "ArrowRight" }))).toBe("arrowright");
    expect(eventToCombo(ev({ key: "Backspace" }))).toBe("backspace");
    expect(eventToCombo(ev({ key: "Escape" }))).toBe("escape");
  });

  it("returns only modifiers when a modifier key itself is pressed", () => {
    expect(eventToCombo(ev({ key: "Meta", metaKey: true }))).toBe("mod");
    expect(eventToCombo(ev({ key: "Shift", shiftKey: true }))).toBe("shift");
  });
});
