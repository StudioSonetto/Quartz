import { and, eq, like, sql } from "drizzle-orm";
import { db } from "~~/server/db";
import { components, nodes } from "~~/server/db/schema";

type NodeRecord = typeof nodes.$inferInsert;
type ComponentRecord = typeof components.$inferInsert;

export default defineEventHandler(async (event) => {
  await requireUser(event);

  const { nodesToUpsert, nodesToDelete, componentsToUpsert } =
    await readBody<{
      nodesToUpsert: NodeRecord[];
      nodesToDelete: { path: string; slides: string }[];
      componentsToUpsert: ComponentRecord[];
    }>(event);

  await db.transaction(async (tx) => {
    if (nodesToUpsert?.length) {
      await tx
        .insert(nodes)
        .values(nodesToUpsert)
        .onConflictDoUpdate({
          target: nodes.id,
          set: {
            name: sql`excluded.name`,
            path: sql`excluded.path`,
            reference: sql`excluded.reference`,
            type: sql`excluded.type`,
          },
        });
    }

    for (const node of nodesToDelete ?? []) {
      await tx
        .delete(nodes)
        .where(
          and(eq(nodes.slides, node.slides), like(nodes.path, `${node.path}%`)),
        );
    }

    if (componentsToUpsert?.length) {
      await tx
        .insert(components)
        .values(componentsToUpsert)
        .onConflictDoUpdate({
          target: [components.node, components.type],
          set: { data: sql`excluded.data` },
        });
    }
  });
});
