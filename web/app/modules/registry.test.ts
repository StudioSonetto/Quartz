import { describe, it, expect, beforeEach } from "vitest";
import {
  registerModule,
  getNodeType,
  getComponentType,
  creatableNodeTypes,
  __resetRegistry,
} from "./registry";

const node = (type: string, creatable = true) => ({ type, creatable }) as any;
const component = (type: string) => ({ type }) as any;

describe("registry", () => {
  beforeEach(__resetRegistry);

  it("registers and retrieves types", () => {
    registerModule({
      id: "m",
      nodeTypes: [node("group")],
      componentTypes: [component("base")],
    });
    expect(getNodeType("group")?.type).toBe("group");
    expect(getComponentType("base")?.type).toBe("base");
  });

  it("returns undefined for unknown types", () => {
    expect(getNodeType("nope")).toBeUndefined();
    expect(getComponentType("nope")).toBeUndefined();
  });

  it("filters creatable node types", () => {
    registerModule({
      id: "m",
      nodeTypes: [node("group"), node("hidden", false)],
      componentTypes: [],
    });
    expect(creatableNodeTypes().map((n) => n.type)).toEqual(["group"]);
  });

  it("last registration wins", () => {
    registerModule({ id: "a", nodeTypes: [node("group")], componentTypes: [] });
    registerModule({
      id: "b",
      nodeTypes: [{ ...node("group"), label: "second" }],
      componentTypes: [],
    });
    expect(getNodeType("group")?.label).toBe("second");
  });
});
