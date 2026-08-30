<template>
  <header
    ref="root"
    class="navbar"
    :class="{
      'opacity-0! pointer-events-none': isHidden,
    }"
  >
    <div class="bar">
      <h1>quartz</h1>
      <nav class="links">
        <NuxtLink v-for="link in LINKS" :key="link.label" :to="link.to">
          {{ link.label }}
        </NuxtLink>
      </nav>
      <div class="actions">
        <UIButton
          variant="ghost"
          class="stars"
          to="https://github.com/StudioSonetto/Quartz"
          target="_blank"
        >
          <div class="i-carbon-logo-github" />
          <span>{{ stargazers }}</span>
        </UIButton>
        <UIButton v-if="!isSignedIn" to="/auth">Sign In</UIButton>
        <div v-else class="user">
          <UIButton to="/atelier">Dashboard</UIButton>
          <div class="avatar">
            <div class="i-carbon-user" />
          </div>
        </div>
        <UIButton
          variant="ghost"
          class="toggle"
          :aria-expanded="isOpen"
          :aria-label="isOpen ? 'Close menu' : 'Open menu'"
          @click="isOpen = !isOpen"
        >
          <div :class="isOpen ? 'i-carbon-close' : 'i-carbon-menu'" />
        </UIButton>
      </div>
    </div>
    <div class="drawer" :class="{ 'drawer--open': isOpen }">
      <nav class="menu">
        <NuxtLink
          v-for="link in LINKS"
          :key="link.label"
          :to="link.to"
          @click="isOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped lang="postcss">
.navbar {
  @apply fixed top-0 left-1/2 z-999;
  @apply mt-4 sm:mt-8 lg:mt-12 px-4 sm:px-6;
  @apply w-[calc(100vw_-_2rem)] lg:w-max;
  @apply transform -translate-x-1/2;
  @apply bg-dark-900/60 backdrop-blur-12;
  @apply border-solid border-1 border-dark-200 border-rd-xl;
  @apply transition-opacity duration-500;
  @apply overflow-hidden select-none;

  h1 {
    @apply ui-text-5;
  }

  .bar {
    @apply h-16 lg:h-18;
    @apply flex items-center justify-between;
  }

  .links {
    @apply hidden lg:flex items-center gap-8 px-18;

    a {
      @apply ui-text-3 font-400 transition-colors duration-200;
      @apply text-light-200/80 hover:text-light-200;
    }
  }

  .actions {
    @apply flex items-center gap-2 sm:gap-4 ui-text-3;

    .stars {
      @apply hidden sm:flex;
    }

    .toggle {
      @apply lg:hidden ui-text-5;
    }

    .user {
      @apply flex items-center gap-4;

      .avatar {
        @apply w-8 h-8 rounded-full bg-light-200/20;
        @apply flex items-center justify-center;
        @apply text-light-200/80 hover:text-light-200;
        @apply transition-colors duration-200 cursor-pointer;
        @apply hover:bg-light-200/30;
        @apply backdrop-blur-12;
        @apply border-solid border-1 border-dark-200;
      }
    }
  }

  .drawer {
    @apply lg:hidden grid grid-rows-[0fr];

    transition: grid-template-rows 300ms ease;

    &.drawer--open {
      @apply grid-rows-[1fr];
    }
  }

  .menu {
    @apply flex flex-col overflow-hidden;

    a {
      @apply py-3 ui-text-3 transition-colors duration-200;
      @apply text-light-200/80 hover:text-light-200;
      @apply border-solid border-0 border-t-1 border-dark-200;
    }
  }
}
</style>

<script setup lang="ts">
const LINKS: { label: string; to?: string }[] = [
  { label: "Product" },
  { label: "Community" },
  { label: "Pricing" },
  { label: "Docs", to: "/docs" },
  { label: "Blog" },
];

const { isSignedIn } = storeToRefs(useAuthStore());

const { directions } = useScroll(window);

const isHidden = ref(false);
const isOpen = ref(false);
const root = useTemplateRef<HTMLElement>("root");

watchEffect(() => {
  if (directions.bottom) {
    isHidden.value = true;
    isOpen.value = false;
  }
  if (directions.top) isHidden.value = false;
});

onClickOutside(root, () => (isOpen.value = false));
onKeyStroke("Escape", () => (isOpen.value = false));

const stargazers = ref(0);

const fetchStargazers = async () => {
  try {
    const response = await $fetch<{ stargazers_count: number }>(
      "https://api.github.com/repos/StudioSonetto/Quartz",
    );

    stargazers.value = response.stargazers_count;
  } catch (error) {
    console.error("Failed to fetch stargazers:", error);
  }
};

onMounted(async () => {
  await fetchStargazers();
});
</script>
