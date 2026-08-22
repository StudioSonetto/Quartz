<template>
  <Title>{{ deck?.title ?? "404" }} | Quartz</Title>
  <div v-if="!deck">
    <p>Either the deck does not exist or you do not have access.</p>
    <NuxtLink to="/atelier">Return</NuxtLink>
  </div>
  <div
    v-else
    @click="prevSlides()"
    @contextmenu.prevent="nextSlides()"
    @mousemove="onCursorMoved"
    tabindex="0"
    autofocus
    class="live"
  >
    <AtelierRender class="select-none" />
    <div
      :class="{
        'opacity-0': !cursorMoved,
      }"
      class="overlay"
    >
      <p>Page {{ currentSlidesIndex + 1 }} / {{ slides.length }}</p>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.live {
  @apply h-screen select-none;
  @apply flex justify-center items-center;

  .overlay {
    @apply fixed bottom-18 bg-dark-900 p-3 rounded-6 text-3;
    @apply transition-opacity duration-300;
  }
}
</style>

<script setup lang="ts">
const client = useSupabaseClient();

type RealtimeChannel = ReturnType<typeof client.channel>;

const { fetchDeck, fetchAllSlides, nextSlides, prevSlides } = useDeckStore();
const { slides, currentSlidesIndex, currentTree } = storeToRefs(useDeckStore());
const { fetchAssets } = useAssetsStore();
const { fireTree } = useEventDispatch();
const { reset } = useAnimationState();

useEventListener(window, "keydown", onKey);

function onKey(event: KeyboardEvent) {
  const combo = eventToCombo(event);

  if (fireTree(currentTree.value, "key", combo)) {
    event.preventDefault();

    return;
  }

  if (combo === "escape") return leavePresentation();
  if (combo === "arrowleft") return prevSlides();
  if (["enter", " ", "arrowright"].includes(combo)) return nextSlides();
}

watch(currentTree, (next) => fireTree(next, "enter"));

const cursorMoved = ref(false);

function onCursorMoved() {
  if (cursorMoved.value) return;

  cursorMoved.value = true;

  setTimeout(() => {
    cursorMoved.value = false;
  }, 5000);
}

function leavePresentation() {
  navigateTo(`/atelier/${deck.value?.id}`);
}

let deckRC: RealtimeChannel, slidesRC: RealtimeChannel;

const { data: deck, refresh: refreshDeck } = await useAsyncData(
  "deck",
  async () => await fetchDeck(useRoute().params.id as string),
);

const { refresh: refreshSlides } = await useAsyncData(
  "slides",
  async () => await fetchAllSlides(useRoute().params.id as string),
);

onMounted(async () => {
  reset();
  fireTree(currentTree.value, "enter");

  const id = useRoute().params.id as string;

  deckRC = client
    .channel(`live:${id}:decks`, { config: { private: true } })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "decks" },
      () => refreshDeck(),
    )
    .subscribe();

  slidesRC = client
    .channel(`live:${id}:slides`, { config: { private: true } })
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "slides",
        filter: `deck=eq.${deck.value?.id}`,
      },
      () => refreshSlides(),
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "slides",
      },
      () => refreshSlides(),
    )
    .subscribe();

  if (deck.value?.id) await fetchAssets(deck.value.id);
});

onUnmounted(() => {
  reset();

  client.removeAllChannels();
});
</script>
