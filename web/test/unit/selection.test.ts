import { describe, expect, it } from "vitest";
import { outermostNodes } from "~/utils/selection";
import type { Tree } from "#shared/types";

const t = (id: string, path: string): Tree =>
  ({ id, path, children: [] }) as unknown as Tree;

// Without this, an operation runs twice over the same subtree — deleting a
// parent and its already-deleted child fails far from the cause.
describe("outermostNodes", () => {
  it("drops descendants of selected ancestors", () => {
    const parent = t("p", "root.np");
    const child = t("c", "root.np.nc");
    const sibling = t("s", "root.ns");
    const got = outermostNodes([parent, child, sibling]).map((n) => n.id);
    expect(got.sort()).toEqual(["p", "s"]);
  });
});
