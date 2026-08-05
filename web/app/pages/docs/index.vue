<template>
  <div class="docs-index">
    <h1>Documentation</h1>
    <ul>
      <li v-for="page in pages ?? []" :key="page.path">
        <NuxtLink :to="page.path">
          <span class="title">{{ page.title }}</span>
          <span v-if="page.description" class="description">
            {{ page.description }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="postcss">
.docs-index {
  @apply p-12;

  h1 {
    @apply uppercase font-100 text-5xl mt-0 mb-10;
  }

  ul {
    @apply list-none flex flex-col gap-3 p-0 m-0;
  }

  a {
    @apply flex flex-col gap-1 no-underline text-light-200;
    @apply border-solid border-1 border-dark-200 border-rd;
    @apply px-6 py-5 transition-colors;
    @apply hover:border-light-200/60;
  }

  .title {
    @apply ui-text-4 font-500;
  }

  .description {
    @apply ui-text-3 text-light-200/50;
  }
}
</style>

<script setup lang="ts">
const { data: pages } = await useAsyncData("docs-index", () =>
  queryCollection("docs").all(),
);

useSeoMeta({
  title: "Docs | Quartz",
});
</script>
