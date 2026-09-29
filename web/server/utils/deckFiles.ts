import { serverSupabaseClient } from "#supabase/server";
import type { H3Event } from "h3";

async function bucket(event: H3Event, name: "assets" | "snapshots") {
  const client = await serverSupabaseClient(event);

  return client.storage.from(name);
}

export async function removeSnapshots(event: H3Event, paths: string[]) {
  if (!paths.length) return;

  try {
    const { error } = await (await bucket(event, "snapshots")).remove(paths);

    if (error) throw error;
  } catch (err) {
    console.error("snapshot cleanup failed", paths, err);
  }
}

export async function removeDeckFiles(event: H3Event, deck: string) {
  await Promise.all(
    (["assets", "snapshots"] as const).map(async (name) => {
      try {
        const files = await bucket(event, name);
        const names = await listFolder(files, deck);

        if (!names?.length) return;

        const { error } = await files.remove(names.map((n) => `${deck}/${n}`));

        if (error) throw error;
      } catch (err) {
        console.error("deck file cleanup failed", name, deck, err);
      }
    }),
  );
}
