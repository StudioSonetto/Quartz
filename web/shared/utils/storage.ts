type Bucket = {
  list(
    path: string,
    options: { limit: number },
  ): Promise<{ data: { name: string }[] | null; error: unknown }>;
  createSignedUrls(
    paths: string[],
    expiresIn: number,
  ): Promise<{
    data: { path: string | null; signedUrl: string | null }[] | null;
    error: unknown;
  }>;
};

export const SIGNED_URL_TTL = 60 * 60 * 24;

const LIST_LIMIT = 1000;

export function signaturesStale(since: number) {
  return Date.now() - since > (SIGNED_URL_TTL / 2) * 1000;
}

export async function listFolder(bucket: Bucket, folder: string) {
  const { data, error } = await bucket.list(folder, { limit: LIST_LIMIT });

  if (error) console.error(error);

  return data?.map((object) => object.name) ?? null;
}

export async function signPaths(bucket: Bucket, paths: string[]) {
  const signed = new Map<string, string>();

  if (!paths.length) return signed;

  const { data, error } = await bucket.createSignedUrls(paths, SIGNED_URL_TTL);

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

export async function signFolder(
  bucket: Bucket,
  folder: string,
  names: string[],
) {
  const signed = await signPaths(
    bucket,
    names.map((name) => `${folder}/${name}`),
  );

  if (!signed) return null;

  return new Map(
    [...signed].flatMap(([path, url]) => {
      const name = path.split("/").pop();

      return name ? [[name, url] as const] : [];
    }),
  );
}
