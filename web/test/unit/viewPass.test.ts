import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signViewPass, verifyViewPass } from "../../server/utils/viewPass";

const HOUR = 60 * 60 * 1000;

describe("view pass", () => {
  it("verifies a fresh pass to its deck", () => {
    expect(verifyViewPass(signViewPass("deck-a", "s"), "s")).toEqual({
      deck: "deck-a",
    });
  });

  it("rejects another secret", () => {
    expect(verifyViewPass(signViewPass("deck-a", "s"), "t")).toBeNull();
  });

  it("rejects an empty secret", () => {
    expect(verifyViewPass(signViewPass("deck-a", "s"), "")).toBeNull();
  });

  it("rejects a changed character", () => {
    const pass = signViewPass("deck-a", "s");
    const last = pass.slice(-1) === "A" ? "B" : "A";

    expect(verifyViewPass(pass.slice(0, -1) + last, "s")).toBeNull();
  });

  it("rejects an expired pass", () => {
    const pass = signViewPass("deck-a", "s", 0);

    expect(verifyViewPass(pass, "s", HOUR)).toBeNull();
    expect(verifyViewPass(pass, "s", HOUR + 1)).toBeNull();
    expect(verifyViewPass(pass, "s", HOUR - 1)).toEqual({ deck: "deck-a" });
  });

  it("rejects a validly signed body of another kind", () => {
    const body = Buffer.from(
      JSON.stringify({
        kind: "discord",
        deck: "deck-a",
        exp: Date.now() + HOUR,
      }),
    ).toString("base64url");
    const mac = createHmac("sha256", "s").update(body).digest("base64url");

    expect(verifyViewPass(`${body}.${mac}`, "s")).toBeNull();
  });

  it("refuses to sign without a secret", () => {
    expect(() => signViewPass("deck-a", "")).toThrow(
      "View pass is not configured",
    );
  });
});
