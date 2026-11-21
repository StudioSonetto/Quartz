import { describe, it, expect } from "vitest";

const known = (node: string) => (node === "a" ? "s1" : undefined);
const free = () => false;

const comp = (node: string, type = "core.transform"): RemoteRow => ({
  table: "components",
  event: "UPDATE",
  row: { node, type, data: {} },
});

describe("pickRemote", () => {
  it("keeps a component row under its slide", () => {
    const out = pickRemote([comp("a")], known, free);

    expect(out.get("s1")).toHaveLength(1);
  });

  it("drops a row whose node is unknown", () => {
    expect(pickRemote([comp("zzz")], known, free).size).toBe(0);
  });

  it("drops a row whose node:type is busy", () => {
    const busy = (key: string) => key === "a:core.transform";

    expect(pickRemote([comp("a")], known, busy).size).toBe(0);
    expect(pickRemote([comp("a", "core.base")], known, busy).size).toBe(1);
  });

  it("matches a node DELETE carrying only its id", () => {
    const row: RemoteRow = {
      table: "nodes",
      event: "DELETE",
      row: { id: "a" },
    };

    expect(pickRemote([row], known, free).get("s1")).toEqual([row]);
  });
});
