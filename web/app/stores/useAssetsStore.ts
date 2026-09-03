export type Asset = { name: string; url: string };

export const useAssetsStore = defineStore("assets", () => {
  const client = useSupabaseClient();

  const assets = ref<Asset[]>([]);

  const LIST_LIMIT = 1000;

  const images = computed(() => {
    return assets.value.filter((asset) => isImage(asset.name));
  });

  const imageNames = computed(() => images.value.map((a) => a.name));

  const imageUrls = computed(
    () => new Map(images.value.map((a) => [a.name, a.url])),
  );

  function imageUrl(name: string) {
    return imageUrls.value.get(name);
  }

  const fonts = computed(() => {
    return assets.value.filter((asset) => isFont(asset.name));
  });

  const models = computed(() => {
    return assets.value.filter((asset) => isModel(asset.name));
  });

  const modelUrls = computed(
    () => new Map(models.value.map((a) => [a.name, a.url])),
  );

  function modelUrl(name: string) {
    return modelUrls.value.get(name);
  }

  const isImage = (name: string) => assetKind(name) === "image";
  const isFont = (name: string) => assetKind(name) === "font";
  const isModel = (name: string) => assetKind(name) === "model";

  const loadedDeck = ref("");
  const signedAt = ref(0);

  const cached = useLocalStorage<{
    deck: string;
    at: number;
    urls: Record<string, string>;
  }>("quartz-asset-urls", { deck: "", at: 0, urls: {} });

  function reusable(deck: string) {
    if (deck === loadedDeck.value && !signaturesStale(signedAt.value)) {
      const held = assets.value.map((a) => [a.name, a.url] as const);

      return { at: signedAt.value, urls: new Map(held) };
    }

    if (cached.value.deck === deck && !signaturesStale(cached.value.at)) {
      return {
        at: cached.value.at,
        urls: new Map(Object.entries(cached.value.urls)),
      };
    }

    return { at: 0, urls: new Map<string, string>() };
  }

  async function resolveAssets(
    deck: string,
    names: string[],
    reuse = new Map<string, string>(),
  ) {
    const missing = names.filter((name) => !reuse.has(name));

    const signed = missing.length
      ? await signStorageObjects("assets", deck, missing)
      : new Map<string, string>();

    if (!signed) return null;

    return names.flatMap((name) => {
      const url = reuse.get(name) ?? signed.get(name);

      return url ? [{ name, url }] : [];
    });
  }

  async function fetchAssets(deck: string) {
    const { data, error } = await client.storage
      .from("assets")
      .list(deck, { limit: LIST_LIMIT });

    if (error) {
      console.error(error);
    }

    if (!data) return;

    const { at, urls } = reusable(deck);

    const resolved = await resolveAssets(
      deck,
      data.map((asset) => asset.name),
      urls,
    );

    if (!resolved) return;

    loadedDeck.value = deck;
    assets.value = resolved;
    signedAt.value = urls.size ? at : Date.now();

    cached.value = {
      deck,
      at: signedAt.value,
      urls: Object.fromEntries(resolved.map((a) => [a.name, a.url])),
    };

    await serveFonts(deck);
  }

  let resigning = false;

  async function resign() {
    const deck = loadedDeck.value;

    if (resigning || !deck || !assets.value.length) return;
    if (!signaturesStale(signedAt.value)) return;

    resigning = true;

    const resolved = await resolveAssets(
      deck,
      assets.value.map((asset) => asset.name),
    );

    if (resolved && loadedDeck.value === deck) {
      assets.value = resolved;
      signedAt.value = Date.now();
    }

    resigning = false;
  }

  watch(useDocumentVisibility(), (state) => {
    if (state === "visible") resign();
  });

  useEventListener(["focus", "online"], resign);

  async function uploadAssets(deck: string, files: File[]) {
    const { data: stored } = await client.storage
      .from("assets")
      .list(deck, { limit: LIST_LIMIT });

    const taken = new Set([
      ...assets.value.map((a) => a.name),
      ...(stored ?? []).map((a) => a.name),
    ]);

    const planned = files.flatMap((file) => {
      if (!assetKind(file.name)) return [];

      const name = uniqueAssetName(file.name, taken);

      taken.add(name);

      return [{ file, name }];
    });

    const entries = await Promise.all(
      planned.map(async ({ file, name }) => {
        const { error } = await client.storage
          .from("assets")
          .upload(`${deck}/${name}`, file, { cacheControl: "31536000" });

        if (error) console.error(error);

        return [file, error ? null : name] as const;
      }),
    );

    const names = new Set(entries.flatMap(([, name]) => (name ? [name] : [])));

    if (names.size) {
      const added = await resolveAssets(deck, [...names]);

      if (added) {
        assets.value = [...assets.value, ...added];

        await serveFonts(deck);
      }
    }

    return new Map(entries);
  }

  async function deleteSelectedAsset(deck: string, asset: Asset) {
    const { error } = await client.storage
      .from("assets")
      .remove([`${deck}/${asset.name}`]);

    if (error) {
      return console.error(error);
    }

    await fetchAssets(deck);
  }

  const served = new Set<string>();

  async function serveFonts(deck: string) {
    const key = (name: string) => `${deck}/${name}`;

    const pending = fonts.value.filter((f) => !served.has(key(f.name)));

    await Promise.all(
      pending.map(async (font) => {
        try {
          const fontName = font.name.split(".")[0] ?? font.name;
          const fontFace = new FontFace(fontName, `url(${font.url})`);

          await fontFace.load();

          document.fonts.add(fontFace);
          served.add(key(font.name));
        } catch (error) {
          console.error(error);
        }
      }),
    );
  }

  return {
    assets,
    images,
    imageNames,
    imageUrl,
    fonts,
    models,
    modelUrl,
    isImage,
    isFont,
    isModel,
    fetchAssets,
    uploadAssets,
    deleteSelectedAsset,
  };
});
