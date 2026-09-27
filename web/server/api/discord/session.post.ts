import { z } from "zod";
import { db } from "~~/server/db";
import { discordSessions } from "~~/server/db/schema";

const schema = z.object({ deck: z.string().uuid() });

export default defineEventHandler(async (event) => {
  const { userId, discordId, instanceId } = requireDiscordOwner(event);

  const { deck } = await validateBody(event, schema);

  const [, live] = await Promise.all([
    requireDeckOwner(deck, userId),
    liveSession(instanceId),
  ]);

  if (live && live.presenter !== discordId)
    throw createError({ statusCode: 409 });

  await db
    .insert(discordSessions)
    .values({ id: instanceId, deck, presenter: discordId })
    .onConflictDoUpdate({
      target: discordSessions.id,
      set: { deck, presenter: discordId },
    });

  return sessionView({ id: instanceId, deck, presenter: discordId }, discordId);
});
