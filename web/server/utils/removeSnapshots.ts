import { serverSupabaseClient } from "#supabase/server";
import type { H3Event } from "h3";

async function bucket(event: H3Event) {
  const client = await serverSupabaseClient(event);

  return client.storage.from("snapshots");
}

export async function removeSnapshots(event: H3Event, paths: string[]) {
  if (!paths.length) return;

  try {
    const { error } = await (await bucket(event)).remove(paths);

    if (error) throw error;
  } catch (err) {
    console.error("snapshot cleanup failed", paths, err);
  }
}

export async function listSnapshots(event: H3Event, deck: string) {
  try {
    const { data, error } = await (await bucket(event)).list(deck);

    if (error) throw error;

    return (data ?? []).map((file) => `${deck}/${file.name}`);
  } catch (err) {
    console.error("snapshot listing failed", deck, err);

    return [];
  }
}
