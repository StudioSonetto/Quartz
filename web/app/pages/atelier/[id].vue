<template>
  <Title>{{ missing ? "404" : deckTitle }} | Quartz</Title>
  <div v-if="missing">
    <p>Either the deck does not exist or you do not have access.</p>
    <NuxtLink to="/atelier">Return</NuxtLink>
  </div>
  <div @contextmenu.prevent v-else class="flex flex-col h-screen select-none">
    <AtelierHeader :title="deckTitle" class="page-fade" />
    <div class="flex flex-1 overflow-hidden">
      <AtelierRail class="page-fade" />
      <AtelierInspector class="page-fade" />
      <div class="flex flex-1 flex-col min-w-0">
        <div class="render-container" @focusin="atelier.setFocus('canvas')">
          <AtelierCommandBar class="page-fade" />
          <AtelierRender canEdit :deck="id" />
        </div>
        <AtelierTimeline class="page-fade" />
      </div>
    </div>
    <AtelierPalette />
  </div>
</template>

<style scoped lang="postcss">
.render-container {
  @apply px-[6.28%] flex flex-1 flex-col justify-center gap-2;
}
</style>

<script setup lang="ts">
const client = useSupabaseClient();

type RealtimeChannel = ReturnType<typeof client.channel>;

const { fetchDeck, fetchAllSlides, clearDeck } = useDeckStore();
const { slides, deckTitle, openedDeck } = storeToRefs(useDeckStore());

definePageMeta({ viewTransition: true });
const { fetchAssets } = useAssetsStore();
const { fetchSnapshots } = useSnapshotsStore();
const sync = useDeckSync();
const atelier = useAtelierStore();
useKeybindings();

let deckRC: RealtimeChannel, slidesRC: RealtimeChannel;

const snapshotScheduler = useSnapshotScheduler();

const flushOnHide = () => {
  if (document.visibilityState === "hidden") sync.flushBeacon();
};
const flushOnPageHide = () => sync.flushBeacon();

const id = useRoute().params.id as string;

if (
  openedDeck.value !== id ||
  useRouter().options.history.state.back !== `/live/${id}`
)
  clearDeck(id);

onBeforeRouteLeave(async () => {
  sync.leave();
  await snapshotScheduler.settle();
});

const { error, refresh: refreshDeck } = useLazyAsyncData(
  `atelier-deck-${id}`,
  () => fetchDeck(id),
);
const { refresh: refreshSlides } = useLazyAsyncData(
  `atelier-slides-${id}`,
  () => fetchAllSlides(id),
);

const missing = computed(() =>
  [401, 403, 404].includes(error.value?.statusCode ?? 0),
);

onMounted(async () => {
  snapshotScheduler.start();

  document.addEventListener("visibilitychange", flushOnHide);
  window.addEventListener("pagehide", flushOnPageHide);

  deckRC = client
    .channel(`atelier:${id}:decks`, { config: { private: true } })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "decks", filter: `id=eq.${id}` },
      () => refreshDeck(),
    )
    .subscribe();

  slidesRC = client
    .channel(`atelier:${id}:slides`, { config: { private: true } })
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "slides",
        filter: `deck=eq.${id}`,
      },
      (payload) => {
        if (slides.value.some((s) => s.id === payload.new.id)) return;

        refreshSlides();
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "slides",
      },
      (payload) => {
        const gone = (payload.old as { id?: string })?.id;

        if (gone && !slides.value.some((s) => s.id === gone)) return;

        refreshSlides();
      },
    )
    .subscribe();

  await Promise.all([fetchAssets(id), fetchSnapshots(id)]);
});

onUnmounted(() => {
  snapshotScheduler.stop();

  useAnimationState().reset();
  useHistoryStore().clear();

  document.removeEventListener("visibilitychange", flushOnHide);
  window.removeEventListener("pagehide", flushOnPageHide);

  for (const rc of [deckRC, slidesRC]) if (rc) client.removeChannel(rc);
});
</script>
