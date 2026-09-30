import { serverSupabaseServiceRole } from "#supabase/server";
import type { H3Event } from "h3";

export async function signedAssets(event: H3Event, deck: string) {
  const bucket = serverSupabaseServiceRole(event).storage.from("assets");
  const names = (await listFolder(bucket, deck)) ?? [];

  return (await signFolder(bucket, deck, names)) ?? new Map<string, string>();
}
