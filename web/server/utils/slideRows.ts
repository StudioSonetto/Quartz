import type { db } from "~~/server/db";
import { nodes, slides } from "~~/server/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function insertBlankSlide(
  tx: Tx,
  deck: string,
  index: number,
  {
    id = crypto.randomUUID(),
    root = crypto.randomUUID(),
  }: { id?: string; root?: string } = {},
) {
  const [slide] = await tx
    .insert(slides)
    .values({ id, deck, index })
    .onConflictDoNothing({ target: slides.id })
    .returning();

  if (!slide) return;

  await tx.insert(nodes).values({
    id: root,
    slides: id,
    name: `Slides ${index + 1}`,
    path: ROOT_PATH,
    type: "core.group",
    reference: "root",
  });

  return { ...slide, root };
}
