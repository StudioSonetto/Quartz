export default async (
  bucket: string,
  deck: string,
  name: string,
  version?: string | null,
) => {
  const config = useRuntimeConfig();
  const client = useSupabaseClient();

  const url = new URL(
    `${config.public.supabaseUrl}/storage/v1/object/authenticated/${bucket}/${deck}/${name}`,
  );

  if (version) url.searchParams.append("v", version);

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
