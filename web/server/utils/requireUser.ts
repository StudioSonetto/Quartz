import { serverSupabaseUser } from "#supabase/server";
import type { H3Event } from "h3";

export async function requireUser(event: H3Event) {
  const user = await serverSupabaseUser(event);

  if (!user) throw createError({ statusCode: 401 });

  return user;
}
