<template>
  <Title>Dashboard | Quartz</Title>
  <div class="flex">
    <DashboardSidebar />
    <div class="flex-1 overflow-auto">
      <DashboardHeader :template="template" />
      <div class="flex flex-wrap gap-6 p-6">
        <DashboardDeck
          v-for="deck in decks"
          :title="deck.title"
          :id="deck.id"
          :last_modified="deck.last_modified"
          :key="deck.id"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient();
const route = useRoute();

type RealtimeChannel = ReturnType<typeof client.channel>;

let realtimeChannel: RealtimeChannel;

const [{ data: decks, refresh: refreshDecks }, { data: templates }] =
  await Promise.all([
    useAsyncData("decks", () => useDeckStore().fetchAllDecks()),
    useAsyncData("templates", () => useDeckStore().fetchTemplates()),
  ]);

const template = computed(() => templates.value?.[0]?.id);

const refreshSoon = useDebounceFn(() => refreshDecks(), 500);

watch(decks, (list) => useSnapshotsStore().fetchCovers(list ?? []), {
  immediate: true,
});

onMounted(() => {
  if (decks.value && !decks.value.length && template.value)
    useDeckStore()
      .insertFromTemplate(template.value)
      .then((id) => {
        if (id && route.path === "/atelier") navigateTo(`/live/${id}`);
      })
      .catch((err) => console.error("onboarding copy failed", err));

  const userId = useAuthStore().user?.id;

  realtimeChannel = client
    .channel(`dashboard:${userId}:decks`, { config: { private: true } })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "decks" },
      refreshSoon,
    );

  realtimeChannel.subscribe();
});

onUnmounted(() => {
  client.removeChannel(realtimeChannel);
});
</script>
