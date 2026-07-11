export default async (bucket: string, deck: string, name: string) => {
  const config = useRuntimeConfig();
  const client = useSupabaseClient();

  const url = new URL(
    `${config.public.supabaseUrl}/storage/v1/object/authenticated/${bucket}/${deck}/${name}`
  );

  url.searchParams.append("timestamp", Date.now().toString());

  const {
    data: { session },
  } = await client.auth.getSession();

  const response = await globalThis.fetch(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${session?.access_token}`,
      accept: "*/*",
    },
  });

  return { url, response };
};
