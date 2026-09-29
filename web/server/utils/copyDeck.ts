import { serverSupabaseServiceRole } from "#supabase/server";
import { and, eq, getColumns, sql } from "drizzle-orm";
import type { H3Event } from "h3";
import { db } from "~~/server/db";
import { components, decks, nodes, slides } from "~~/server/db/schema";

export async function copyDeck(
  event: H3Event,
  source: typeof decks.$inferSelect,
  owner: string,
) {
  const storage = serverSupabaseServiceRole(event).storage;
  const assetNames = listFolder(storage.from("assets"), source.id);

  const [sourceSlides, allNodes, allComponents, unlocked] = await Promise.all([
    db.select().from(slides).where(eq(slides.deck, source.id)),
    db
      .select(getColumns(nodes))
      .from(nodes)
      .innerJoin(slides, eq(nodes.slides, slides.id))
      .where(eq(slides.deck, source.id)),
    db
      .select(getColumns(components))
      .from(components)
      .innerJoin(nodes, eq(components.node, nodes.id))
      .innerJoin(slides, eq(nodes.slides, slides.id))
      .where(eq(slides.deck, source.id)),
    useRuntimeConfig().polarAccessToken ? unlockedModulesOf(owner) : undefined,
  ]);

  // Rows the owner can't save would make every later save that touches them 403.
  const allowed = (type: string) =>
    !unlocked || moduleUnlocked(moduleOf(type), unlocked);
  const dropped = allNodes.filter((n) => !allowed(n.type)).map((n) => n.path);
  const sourceNodes = allNodes.filter(
    (n) => !dropped.some((p) => isSelfOrDescendantPath(n.path, p)),
  );

  const slideIds = new Map(
    sourceSlides.map((s) => [s.id, crypto.randomUUID()]),
  );
  const nodeIds = new Map(sourceNodes.map((n) => [n.id, crypto.randomUUID()]));
  const labels = new Map(
    sourceNodes.map((n) => [nodeLabel(n.id), nodeLabel(nodeIds.get(n.id)!)]),
  );
  const sourceComponents = allComponents.filter(
    (c) => nodeIds.has(c.node) && allowed(c.type),
  );

  const deck = await db.transaction(async (tx) => {
    const deck = await tx
      .insert(decks)
      .values({ lapidarist: owner, title: source.title })
      .returning()
      .then(([d]) => d!);

    // The deck trigger adds a blank slide 0; the template brings its own.
    await tx.delete(slides).where(eq(slides.deck, deck.id));

    if (sourceSlides.length)
      await tx.insert(slides).values(
        sourceSlides.map((s) => ({
          id: slideIds.get(s.id)!,
          deck: deck.id,
          index: s.index,
        })),
      );

    for (const root of sourceNodes.filter((n) => n.path === ROOT_PATH))
      await tx
        .update(nodes)
        .set({
          id: nodeIds.get(root.id)!,
          name: root.name,
          reference: root.reference,
          unsynced: root.unsynced,
          locked: root.locked,
        })
        .where(
          and(
            eq(nodes.slides, slideIds.get(root.slides)!),
            eq(nodes.path, ROOT_PATH),
          ),
        );

    const rest = sourceNodes.filter((n) => n.path !== ROOT_PATH);

    if (rest.length)
      await tx.insert(nodes).values(
        rest.map((n) => ({
          ...n,
          id: nodeIds.get(n.id)!,
          slides: slideIds.get(n.slides)!,
          path: remapPath(n.path, labels),
        })),
      );

    if (sourceComponents.length)
      await tx
        .insert(components)
        .values(
          sourceComponents.map((c) => ({ ...c, node: nodeIds.get(c.node)! })),
        )
        .onConflictDoUpdate({
          target: [components.node, components.type],
          set: { data: sql`excluded.data` },
        });

    return deck;
  });

  const copy = (bucket: "assets" | "snapshots", from: string, to: string) =>
    storage
      .from(bucket)
      .copy(from, to)
      .then(({ error }) => {
        if (error) console.error("template file copy failed", from, error);
      });

  await Promise.all([
    ...((await assetNames) ?? []).map((name) =>
      copy("assets", `${source.id}/${name}`, `${deck.id}/${name}`),
    ),
    ...sourceSlides.map((s) =>
      copy(
        "snapshots",
        `${source.id}/${s.id}.png`,
        `${deck.id}/${slideIds.get(s.id)}.png`,
      ),
    ),
  ]);

  return deck;
}
