const SIGNED_URL_TTL = 60 * 60 * 24;

export function signaturesStale(since: number) {
  return Date.now() - since > (SIGNED_URL_TTL / 2) * 1000;
}

export async function signStorageObjects(
  bucket: string,
  deck: string,
  names: string[],
) {
  const signed = new Map<string, string>();

  if (!names.length) return signed;

  const client = useSupabaseClient();

  const { data, error } = await client.storage.from(bucket).createSignedUrls(
    names.map((name) => `${deck}/${name}`),
    SIGNED_URL_TTL,
  );

  if (error || !data) {
    console.error(error);

    return null;
  }

  data.forEach((entry, index) => {
    const name = entry.path?.split("/").pop() ?? names[index];

    if (entry.signedUrl && name) signed.set(name, entry.signedUrl);
  });

  return signed;
}

export async function signStorageObject(
  bucket: string,
  deck: string,
  name: string,
) {
  return (await signStorageObjects(bucket, deck, [name]))?.get(name);
}
