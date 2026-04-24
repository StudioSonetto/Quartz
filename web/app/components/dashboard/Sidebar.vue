<template>
  <aside class="sidebar">
    <div class="brand">
      <h1>quartz</h1>
      <span>v0.0.0</span>
    </div>
    <nav>
      <p class="label">{{ authStore.user?.email }}</p>
      <NuxtLink to="/atelier" class="item" exact-active-class="active">
        <div class="i-carbon-table"></div>
        Decks
      </NuxtLink>
      <NuxtLink to="/templates" class="item" active-class="active">
        <div class="i-carbon-folder"></div>
        Templates
      </NuxtLink>
      <NuxtLink to="/settings" class="item" active-class="active">
        <div class="i-carbon-settings"></div>
        Settings
      </NuxtLink>
    </nav>
    <UIButton variant="ghost" class="signOut" @click="authStore.signOut()">
      <div class="i-carbon-arrow-left"></div>
      Sign Out
    </UIButton>
  </aside>
</template>

<style scoped lang="postcss">
.sidebar {
  @apply bg-dark-800 w-64 h-screen flex-shrink-0;
  @apply border-solid border-0 border-r-1 border-dark-200;
  @apply flex flex-col select-none;

  .brand {
    @apply h-16 px-6 flex items-center gap-3 select-none;
    @apply border-solid border-0 border-b-1 border-dark-200;

    h1 {
      @apply text-lg font-500;
    }

    span {
      @apply px-2 py-0.5 ui-text-3 font-400;
      @apply border-solid border-1 border-dark-200 text-light-200/40 border-rd;
    }
  }

  nav {
    @apply flex-1 px-3 py-4 flex flex-col gap-1;

    .label {
      @apply uppercase ui-text-3 opacity-40 tracking-wider px-3 mb-2;
    }

    .item {
      @apply flex items-center gap-3 px-3 py-2 border-rd;
      @apply ui-text-3 text-light-200/60 transition-colors;
      @apply hover:bg-light-200/5 hover:text-light-200;

      [class*="i-"] {
        @apply ui-text-4 flex-shrink-0;
      }

      &.active {
        @apply bg-light-200/8 text-light-200;
        @apply border-solid border-l-2 border-r-0 border-t-0 border-b-0 border-accent;
        @apply pl-[calc(0.75rem-2px)];
      }
    }
  }

  .signOut {
    @apply w-full justify-start px-6 h-14;
    @apply border-solid border-0 border-t-1 border-dark-200 border-rd-0;
  }
}
</style>

<script setup lang="ts">
const authStore = useAuthStore();
</script>
