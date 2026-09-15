const LIST_LIMIT = 1000;

export function useSignedBucket(bucket: string) {
  const client = useSupabaseClient();

  const cached = useLocalStorage<{
    deck: string;
    at: number;
    urls: Record<string, string>;
  }>(
    `quartz-signed:${bucket}`,
    { deck: "", at: 0, urls: {} },
    { listenToStorageChanges: false },
  );

  const fresh = (deck: string) =>
    deck === cached.value.deck && !signaturesStale(cached.value.at);

  async function list(deck: string) {
    const { data, error } = await client.storage
      .from(bucket)
      .list(deck, { limit: LIST_LIMIT });

    if (error) console.error(error);

    return data?.map((object) => object.name) ?? null;
  }

  async function sign(
    deck: string,
    names: string[],
    reuse: Record<string, string> = {},
  ) {
    const missing = names.filter((name) => !reuse[name]);

    const signed = missing.length
      ? await signStorageObjects(bucket, deck, missing)
      : new Map<string, string>();

    if (!signed) return null;

    return Object.fromEntries(
      names.flatMap((name) => {
        const url = reuse[name] ?? signed.get(name);

        return url ? [[name, url] as const] : [];
      }),
    );
  }

  function store(deck: string, urls: Record<string, string>, at = Date.now()) {
    cached.value = { deck, at, urls };
  }

  let resigning = false;

  async function resign() {
    const deck = cached.value.deck;
    const names = Object.keys(cached.value.urls);

    if (resigning || !deck || !names.length) return;
    if (!signaturesStale(cached.value.at)) return;

    resigning = true;

    try {
      const urls = await sign(deck, names);

      if (urls && cached.value.deck === deck) store(deck, urls);
    } finally {
      resigning = false;
    }
  }

  watch(useDocumentVisibility(), (state) => {
    if (state === "visible") resign();
  });

  useEventListener(["focus", "online"], resign);

  return { cached, fresh, list, sign, store };
}
