export const useSnapshotsStore = defineStore("snapshots", () => {
  const client = useSupabaseClient();

  const { cached, fresh, list, sign, store } = useSignedBucket("snapshots");

  const covers = ref<Record<string, string>>({});

  const objectName = (slides: string) => `${slides}.png`;

  function snapshotUrl(slides: string) {
    return cached.value.urls[objectName(slides)];
  }

  function coverUrl(deck: string) {
    return covers.value[deck];
  }

  async function fetchSnapshots(deck: string) {
    if (!deck || fresh(deck)) return;

    const names = await list(deck);

    if (!names) return;

    const urls = await sign(
      deck,
      names.filter((name) => name.endsWith(".png")),
    );

    if (urls) store(deck, urls);
  }

  async function fetchCovers(decks: { id: string; cover: string | null }[]) {
    const wanted = decks.flatMap((deck) =>
      deck.cover
        ? [[deck.id, `${deck.id}/${objectName(deck.cover)}`] as const]
        : [],
    );

    const signed = await signStoragePaths(
      "snapshots",
      wanted.map(([, path]) => path),
    );

    if (!signed) return;

    covers.value = Object.fromEntries(
      wanted.flatMap(([deck, path]) => {
        const url = signed.get(path);

        return url ? [[deck, url] as const] : [];
      }),
    );
  }

  async function refreshSnapshot(deck: string, slides: string) {
    if (deck !== cached.value.deck) return;

    const held =
      snapshotUrl(slides) ??
      (await signStorageObject("snapshots", deck, objectName(slides)));

    if (!held) return;

    const url = new URL(held);

    url.searchParams.set("t", String(Date.now()));

    cached.value.urls[objectName(slides)] = url.toString();
  }

  async function dropSnapshot(deck: string, slides: string) {
    const { error } = await client.storage
      .from("snapshots")
      .remove([`${deck}/${objectName(slides)}`]);

    if (error) return console.error(error);

    delete cached.value.urls[objectName(slides)];
  }

  return {
    snapshotUrl,
    coverUrl,
    fetchSnapshots,
    fetchCovers,
    refreshSnapshot,
    dropSnapshot,
  };
});
