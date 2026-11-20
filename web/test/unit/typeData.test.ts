import { beforeEach, describe, expect, it } from "vitest";

const node = (type: string, extra: object = {}) =>
  ({ type, label: type, accepts: [], defaultComponents: [], ...extra }) as any;

describe("typeData", () => {
  beforeEach(resetTypeData);

  it("canContain honours a child-declared parents entry", () => {
    registerTypeData({
      nodeTypes: [
        node("core.group"),
        node("x.child", { parents: ["core.group"] }),
      ],
      componentTypes: [],
    });
    expect(canContain("core.group", "x.child")).toBe(true);
    expect(canContain("x.child", "core.group")).toBe(false);
  });

  it("effectiveDefaults merges the node's entry over the component", () => {
    registerTypeData({
      nodeTypes: [
        node("core.text", {
          defaultComponents: [
            { type: "core.layout", data: { gap: { value: 9 } } },
          ],
        }),
      ],
      componentTypes: [
        {
          type: "core.layout",
          defaultData: () => ({ gap: { value: 1, unit: "px" }, wrap: false }),
        } as any,
      ],
    });
    expect(effectiveDefaults("core.text", "core.layout")).toEqual({
      gap: { value: 9, unit: "px" },
      wrap: false,
    });
  });
});
