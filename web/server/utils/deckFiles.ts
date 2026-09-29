import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
} from "#supabase/server";
import type { H3Event } from "h3";

async function removeFiles(
  files: { remove(paths: string[]): Promise<{ error: unknown }> },
  paths: string[],
) {
  if (!paths.length) return;

  const { error } = await files.remove(paths);

  if (error) throw error;
}

export async function removeSnapshots(event: H3Event, paths: string[]) {
  try {
    const client = await serverSupabaseClient(event);

    await removeFiles(client.storage.from("snapshots"), paths);
  } catch (err) {
    console.error("snapshot cleanup failed", paths, err);
  }
}

export async function removeDeckFiles(event: H3Event, deck: string) {
  await Promise.all(
    (["assets", "snapshots"] as const).map(async (name) => {
      try {
        const files = serverSupabaseServiceRole(event).storage.from(name);
        const names = (await listFolder(files, deck)) ?? [];

        await removeFiles(
          files,
          names.map((n) => `${deck}/${n}`),
        );
      } catch (err) {
        console.error("deck file cleanup failed", name, deck, err);
      }
    }),
  );
}
