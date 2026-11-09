<template>
  <Title>Dashboard | Quartz</Title>
  <div class="flex page-fade">
    <DashboardSidebar />
    <div class="flex-1 overflow-auto">
      <DashboardHeader :template="template" />
      <TransitionGroup
        tag="div"
        name="fade-fast"
        class="flex flex-wrap gap-6 p-6"
      >
        <DashboardDeck
          v-for="deck in decks"
          :title="deck.title"
          :id="deck.id"
          :last_modified="deck.last_modified"
          :key="deck.id"
          :named="named === deck.id"
          @click="named = deck.id"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ viewTransition: true });

const named = ref(useDeckStore().openedDeck);
const client = useSupabaseClient();
const route = useRoute();

type RealtimeChannel = ReturnType<typeof client.channel>;

let realtimeChannel: RealtimeChannel;

const { data: fetched, refresh: refreshDecks } = useLazyAsyncData("decks", () =>
  useDeckStore().fetchAllDecks(),
);

const decks = useState("deck-list", () => fetched.value);

watch(fetched, (list) => list && (decks.value = list));

const { data: templates } = useLazyAsyncData("templates", () =>
  useDeckStore().fetchTemplates(),
);

const template = computed(() => templates.value?.[0]?.id);

const refreshSoon = useDebounceFn(() => refreshDecks(), 500);

watch(fetched, (list) => list && useSnapshotsStore().fetchCovers(list), {
  immediate: true,
});

const stopOnboarding = watch([decks, template], ([list, id]) => {
  if (!list || !id) return;

  stopOnboarding();

  if (list.length) return;

  useDeckStore()
    .insertFromTemplate(id)
    .then((copy) => {
      if (copy && route.path === "/atelier") navigateTo(`/live/${copy}`);
    })
    .catch((err) => console.error("onboarding copy failed", err));
});

onMounted(() => {
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
