const SIGNED_URL_TTL = 60 * 60 * 24;

export function signaturesStale(since: number) {
  return Date.now() - since > (SIGNED_URL_TTL / 2) * 1000;
}

export async function signStoragePaths(bucket: string, paths: string[]) {
  const signed = new Map<string, string>();

  if (!paths.length) return signed;

  const client = useSupabaseClient();

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrls(paths, SIGNED_URL_TTL);

  if (error || !data) {
    console.error(error);

    return null;
  }

  data.forEach((entry, index) => {
    const path = entry.path ?? paths[index];

    if (entry.signedUrl && path) signed.set(path, entry.signedUrl);
  });

  return signed;
}

export async function signStorageObjects(
  bucket: string,
  deck: string,
  names: string[],
) {
  const signed = await signStoragePaths(
    bucket,
    names.map((name) => `${deck}/${name}`),
  );

  if (!signed) return null;

  return new Map(
    [...signed].flatMap(([path, url]) => {
      const name = path.split("/").pop();

      return name ? [[name, url] as const] : [];
    }),
  );
}

export async function signStorageObject(
  bucket: string,
  deck: string,
  name: string,
) {
  return (await signStorageObjects(bucket, deck, [name]))?.get(name);
}
