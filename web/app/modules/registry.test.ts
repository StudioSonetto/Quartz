import { describe, it, expect, beforeEach } from "vitest";
import {
  registerModule,
  getNodeType,
  getComponentType,
  creatableNodeTypes,
  __resetRegistry,
} from "./registry";

const nodeDef = (type: string, creatable = true) =>
  ({ type, label: type, icon: "i", creatable, defaultComponents: [], renderer: { element: "div", render: () => ({}) } }) as any;
const compDef = (type: string) =>
  ({ type, icon: "i", inspector: {}, defaultData: () => ({}) }) as any;

describe("registry", () => {
  beforeEach(() => __resetRegistry());

  it("registers and retrieves node and component types", () => {
    registerModule({ id: "m", nodeTypes: [nodeDef("group")], componentTypes: [compDef("base")] });
    expect(getNodeType("group")?.type).toBe("group");
    expect(getComponentType("base")?.type).toBe("base");
  });

  it("returns undefined for unknown types", () => {
    expect(getNodeType("nope")).toBeUndefined();
    expect(getComponentType("nope")).toBeUndefined();
  });

  it("creatableNodeTypes filters on the creatable flag", () => {
    registerModule({ id: "m", nodeTypes: [nodeDef("group", true), nodeDef("hidden", false)], componentTypes: [] });
    expect(creatableNodeTypes().map((n) => n.type)).toEqual(["group"]);
  });

  it("last registration wins for a duplicate type", () => {
    registerModule({ id: "a", nodeTypes: [nodeDef("group")], componentTypes: [] });
    registerModule({ id: "b", nodeTypes: [{ ...nodeDef("group"), label: "second" }], componentTypes: [] });
    expect(getNodeType("group")?.label).toBe("second");
  });
});
