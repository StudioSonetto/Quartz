<template>
  <header
    class="navbar"
    :class="{
      'opacity-0! pointer-events-none': isHidden,
    }"
  >
    <h1>quartz</h1>
    <nav>
      <NuxtLink>Product</NuxtLink>
      <NuxtLink>Community</NuxtLink>
      <NuxtLink>Pricing</NuxtLink>
      <NuxtLink to="/docs">Docs</NuxtLink>
      <NuxtLink>Blog</NuxtLink>
    </nav>
    <div class="actions">
      <UIButton
        variant="ghost"
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
    </div>
  </header>
</template>

<style scoped lang="postcss">
.navbar {
  @apply fixed top-0 left-1/2 z-999;
  @apply h-18 mt-12 px-6;
  @apply transform -translate-x-1/2;
  @apply flex items-center justify-between;
  @apply bg-dark-900/60 backdrop-blur-12;
  @apply border-solid border-1 border-dark-200 border-rd-xl;
  @apply transition-opacity duration-500;
  @apply select-none;

  h1 {
    @apply ui-text-5;
  }

  nav {
    @apply flex items-center gap-8 px-18;

    a {
      @apply ui-text-3 font-400 transition-colors duration-200;
      @apply text-light-200/80 hover:text-light-200;
    }
  }

  .actions {
    @apply flex items-center gap-4 ui-text-3;

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
}
</style>

<script setup lang="ts">
const { isSignedIn } = storeToRefs(useAuthStore());

const { directions } = useScroll(window);

const isHidden = ref(false);

watchEffect(() => {
  if (directions.bottom) isHidden.value = true;
  if (directions.top) isHidden.value = false;
});

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
