<template>
  <Title>Quartz</Title>
  <div class="discord">
    <p v-if="status === 'loading'">Connecting to Discord…</p>
    <p v-else-if="status === 'error'">{{ error }}</p>
    <p v-else-if="status === 'waiting'">
      Waiting for the presenter to pick a deck.
    </p>
    <p v-else-if="status === 'left'">The presenter left.</p>
    <div v-else-if="status === 'picking'" class="picker">
      <h2>Pick a deck to present</h2>
      <UIButton
        v-for="d in decks"
        :key="d.id"
        variant="menu"
        @click="present(d.id)"
      >
        {{ d.title }}
      </UIButton>
    </div>
    <div
      v-else
      class="stage"
      @click="presenting && prevSlides()"
      @contextmenu.prevent="presenting && nextSlides()"
    >
      <AtelierRender class="select-none" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.discord {
  @apply h-screen flex justify-center items-center select-none;

  .picker {
    @apply w-full max-w-md flex flex-col gap-4;
  }

  .stage {
    @apply w-full h-full flex justify-center items-center;
  }
}
</style>

<script setup lang="ts">
import { DiscordSDK } from "@discord/embedded-app-sdk";

// The SDK throws without the query Discord opens the activity with.
definePageMeta({
  middleware: (to) => {
    if (!to.query.frame_id) return navigateTo("/");
  },
});

type Status = "loading" | "error" | "picking" | "waiting" | "showing" | "left";

const config = useRuntimeConfig();
const token = useDiscordToken();
const api = useApiFetch();
const { fetchDeck, fetchAllSlides, nextSlides, prevSlides } = useDeckStore();
const { setSignedUrls } = useAssetsStore();
const { reset } = useAnimationState();

const status = ref<Status>("loading");
const error = ref("");
const decks = ref<{ id: string; title: string }[]>([]);
const session = ref<{ deck: string; presenter: string } | null>(null);
const auth = ref<{ discordId: string; canPresent: boolean } | null>(null);
const presenting = computed(
  () => !!session.value && session.value.presenter === auth.value?.discordId,
);

const clientId = config.public.discordClientId;

setFontCssBase("/api/discord/fonts");

const sdk = new DiscordSDK(clientId);

// Created in setup: Nuxt composables inside it lose their context after an await.
const sync = usePresenterSync(sdk.instanceId, presenting, load);

usePresentationKeys(() => presenting.value);

function fail(err: unknown) {
  error.value = (err as Error).message;
  status.value = "error";
}

function load() {
  return openSession().catch(fail);
}

async function openSession() {
  // Only "no session" means pick or wait; an expired pass must not reach the picker.
  session.value = await api("/api/discord/session").catch((err) => {
    if (err?.statusCode === 404) return null;

    throw err;
  });

  const deck = session.value?.deck;

  if (!deck) {
    if (!auth.value?.canPresent) return (status.value = "waiting");

    decks.value = await api("/api/discord/decks");
    status.value = "picking";

    return;
  }

  await Promise.all([
    fetchDeck(deck),
    fetchAllSlides(deck),
    api<Record<string, string>>("/api/discord/assets").then((urls) =>
      setSignedUrls(deck, urls),
    ),
  ]);

  reset();
  status.value = "showing";

  if (!presenting.value) sync.requestState();
}

// A 409 means someone else started presenting first: show theirs instead.
function present(deck: string) {
  return api("/api/discord/session", { method: "POST", body: { deck } })
    .then(openSession)
    .then(sync.announceDeck, (err) =>
      err?.statusCode === 409 ? load() : fail(err),
    );
}

onMounted(async () => {
  try {
    await sdk.ready();

    const { code } = await sdk.commands.authorize({
      client_id: clientId,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify"],
    });

    const { access_token, token: pass, ...who } = await $fetch<{
      access_token: string;
      token: string;
      discordId: string;
      canPresent: boolean;
    }>("/api/discord/token", {
      method: "POST",
      body: { code, instanceId: sdk.instanceId },
    });

    await sdk.commands.authenticate({ access_token });

    token.value = pass;
    auth.value = who;

    await sdk.subscribe(
      "ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE",
      ({ participants }) => {
        const presenter = session.value?.presenter;

        if (!presenter || presenting.value) return;

        const here = participants.some((p) => p.id === presenter);

        if (!here) status.value = "left";
        else if (status.value === "left") load();
      },
    );

    await openSession();
  } catch (err) {
    fail(err);
  }
});

onUnmounted(() => {
  sync.stop();
  reset();
});
</script>
