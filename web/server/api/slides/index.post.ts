import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/db";
import { nodes, slides } from "~~/server/db/schema";

const bodySchema = z.object({
  deck: z.string().uuid(),
  index: z.number().int().nonnegative(),
  id: z.string().uuid().optional(),
  root: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { deck, index, id, root } = await validateBody(event, bodySchema);

  await requireDeckOwner(deck, user.id);

  let slide = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(slides)
      .values(id ? { id, deck, index } : { deck, index })
      .onConflictDoNothing({ target: slides.id })
      .returning();

    if (created && root)
      await tx
        .update(nodes)
        .set({ id: root })
        .where(
          and(eq(nodes.slides, created.id), eq(nodes.path, ROOT_PATH)),
        );

    if (created) await adoptFromPeers(tx, (t) => eq(t.slides, created.id));

    return created;
  });

  if (!slide && id) {
    [slide] = await db
      .select()
      .from(slides)
      .where(and(eq(slides.id, id), eq(slides.deck, deck)));

    if (!slide) throw createError({ statusCode: 409 });
  }

  return slide && { ...slide, root: await rootNode(slide.id) };
});

async function rootNode(slide: string) {
  const [root] = await db
    .select({ id: nodes.id })
    .from(nodes)
    .where(and(eq(nodes.slides, slide), eq(nodes.path, ROOT_PATH)));

  return root?.id;
}
