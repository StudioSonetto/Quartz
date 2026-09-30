import { eq, sql } from "drizzle-orm";
import { db } from "~~/server/db";
import { discordSessions } from "~~/server/db/schema";

// Live while the presenter, and the reader if given, are still in the activity.
export async function liveSession(instanceId: string, reader?: string) {
  const [[session], users] = await Promise.all([
    db.select().from(discordSessions).where(eq(discordSessions.id, instanceId)),
    instanceUsers(instanceId),
  ]);

  if (!session) return null;
  if (!users) throw createError({ statusCode: 503 });

  const here = (id: string) => users.includes(id);

  if (!here(session.presenter)) {
    await db.delete(discordSessions).where(eq(discordSessions.id, instanceId));

    return null;
  }

  return !reader || here(reader) ? session : null;
}

export async function quartzUserFor(discordId: string) {
  const [row] = await db.execute<{ user_id: string }>(
    sql`select user_id from auth.identities
        where provider = 'discord' and provider_id = ${discordId}
        limit 1`,
  );

  return row?.user_id ?? null;
}

type Session = { id: string; deck: string; presenter: string };

// Everyone gets the public key; only the presenter gets the signing half.
export function sessionView({ id, deck, presenter }: Session, viewer: string) {
  const { publicKey, privateKey } = sessionKeys(id, presenter);

  return {
    deck,
    presenter,
    publicKey,
    ...(viewer === presenter && { privateKey }),
  };
}
