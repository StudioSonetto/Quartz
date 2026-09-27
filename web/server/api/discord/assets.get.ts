import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const session = await requireLiveSession(event);

  const storage = serverSupabaseServiceRole(event).storage.from("assets");

  const { data: objects } = await storage.list(session.deck, { limit: 1000 });

  const paths = (objects ?? []).map((o) => `${session.deck}/${o.name}`);

  if (!paths.length) return {};

  const { data: signed } = await storage.createSignedUrls(paths, SIGNED_URL_TTL);

  const origin = useRuntimeConfig(event).public.supabase.url;

  return Object.fromEntries(
    (signed ?? []).flatMap((s) =>
      s.path && s.signedUrl
        ? [[s.path.split("/").pop()!, proxiedSupabase(s.signedUrl, origin)]]
        : [],
    ),
  );
});
