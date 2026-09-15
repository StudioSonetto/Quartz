export type Asset = { name: string; url: string };

export type FontAsset = Asset & { family: string };

export const useAssetsStore = defineStore("assets", () => {
  const client = useSupabaseClient();

  const { cached, fresh, list, sign, store } = useSignedBucket("assets");

  const LIST_LIMIT = 1000;

  const assets = computed<Asset[]>(() =>
    Object.entries(cached.value.urls).map(([name, url]) => ({ name, url })),
  );

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

  const fonts = computed<FontAsset[]>(() =>
    assets.value
      .filter((asset) => isFont(asset.name))
      .map((asset) => ({ ...asset, family: assetStem(asset.name) })),
  );

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

  async function fetchAssets(deck: string) {
    const names = await list(deck);

    if (!names) return;

    const reusable = fresh(deck);

    const urls = await sign(deck, names, reusable ? cached.value.urls : {});

    if (!urls) return;

    store(deck, urls, reusable ? cached.value.at : Date.now());

    await serveFonts(deck);
  }

  async function uploadAssets(deck: string, files: File[]) {
    const { data: stored } = await client.storage
      .from("assets")
      .list(deck, { limit: LIST_LIMIT });

    const taken = new Set(
      [
        ...assets.value.map((a) => a.name),
        ...(stored ?? []).map((a) => a.name),
      ].map(assetKey),
    );

    const planned = files.flatMap((file) => {
      if (!assetKind(file.name)) return [];

      const name = uniqueAssetName(file.name, taken);

      taken.add(assetKey(name));

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
      const added = await sign(deck, [...names]);

      if (added) {
        store(deck, { ...cached.value.urls, ...added }, cached.value.at);

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
          const fontFace = new FontFace(font.family, `url(${font.url})`);

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
