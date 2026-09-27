import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const { deck } = await requireLiveSession(event);

  const bucket = serverSupabaseServiceRole(event).storage.from("assets");
  const signed = await signFolder(
    bucket,
    deck,
    (await listFolder(bucket, deck)) ?? [],
  );

  const origin = useRuntimeConfig(event).public.supabase.url;

  return Object.fromEntries(
    [...(signed ?? [])].map(([name, url]) => [
      name,
      proxiedSupabase(url, origin),
    ]),
  );
});
