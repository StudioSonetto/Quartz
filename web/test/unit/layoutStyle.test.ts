import { describe, expect, it } from "vitest";
import { backgroundStyle, coerceBackground } from "~/utils/layoutStyle";

const resolve = (name: string) => `http://x/${name}`;

// Legacy stored shapes the current editor can no longer produce.
describe("coerceBackground", () => {
  it("maps the legacy 'transparent' string to none", () => {
    expect(coerceBackground("transparent")).toEqual({ type: "none" });
  });

  it("maps an empty string to none", () => {
    expect(coerceBackground("")).toEqual({ type: "none" });
  });

  it("maps any other legacy string to a colour", () => {
    expect(coerceBackground("#ff0000")).toEqual({
      type: "colour",
      value: "#ff0000",
    });
  });

  it("maps undefined and null to none", () => {
    expect(coerceBackground(undefined)).toEqual({ type: "none" });
    expect(coerceBackground(null)).toEqual({ type: "none" });
  });

  it("passes a colour object through", () => {
    expect(coerceBackground({ type: "colour", value: "#123456" })).toEqual({
      type: "colour",
      value: "#123456",
    });
  });

  it("passes an image object through and defaults a missing fit to cover", () => {
    expect(coerceBackground({ type: "image", value: "bg.png" })).toEqual({
      type: "image",
      value: "bg.png",
      fit: "cover",
    });
  });

  it("treats an unrecognised object as none", () => {
    expect(coerceBackground({ type: "gradient" })).toEqual({ type: "none" });
  });
});

// Only the layering contracts and unresolved-asset states; the plain emitters
// are browser-verified.
describe("backgroundStyle", () => {
  it("emits nothing for none, leaving the CSS base to show", () => {
    expect(backgroundStyle({ type: "none" })).toEqual({});
  });

  it("emits nothing for an image whose URL has not resolved yet", () => {
    expect(
      backgroundStyle({ type: "image", value: "bg.png", fit: "cover" }),
    ).toEqual({});
    expect(
      backgroundStyle(
        { type: "image", value: "bg.png", fit: "cover" },
        () => undefined,
      ),
    ).toEqual({});
  });

  it("never resolves an image background with no asset chosen", () => {
    expect(backgroundStyle({ type: "image", value: "" }, resolve)).toEqual({});
  });

  it("never emits a background colour for an image (the CSS base provides it)", () => {
    const style = backgroundStyle(
      { type: "image", value: "bg.png", fit: "cover" },
      resolve,
    );
    expect(style.backgroundColor).toBeUndefined();
  });
});
