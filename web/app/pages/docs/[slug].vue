<template>
  <div class="docs">
    <aside>Sidebar</aside>
    <div class="content">
      <ContentRenderer v-if="page" :value="page" class="docs-prose" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.docs {
  @apply flex;

  aside {
    @apply bg-dark-500 w-sm h-screen sticky top-0;
    @apply flex flex-col border-r;
  }

  .content {
    @apply flex-1 min-w-0 px-12 py-16;
  }
}

.docs-prose {
  @apply max-w-3xl mx-auto ui-text-4 leading-relaxed;

  :deep(h1) {
    @apply text-5xl font-100 uppercase mb-6;
  }

  :deep(h2) {
    @apply ui-text-6 font-500 mt-20 mb-4;
  }

  :deep(h3) {
    @apply ui-text-5 font-500 mt-10 mb-3;
  }

  :deep(:is(h1, h2, h3) a) {
    @apply select-text;
  }

  :deep(:is(p, ul, ol)) {
    @apply my-4 text-light-200/80;
  }

  :deep(:is(ul, ol)) {
    @apply pl-6 flex flex-col gap-2;
  }

  :deep(strong) {
    @apply font-600 text-light-200;
  }

  :deep(p a) {
    @apply text-accent underline underline-offset-4;
  }

  :deep(code) {
    @apply px-1.5 py-0.5 border-rd bg-dark-500 text-[0.9em];
  }

  :deep(hr) {
    @apply border-0 border-t-1 border-solid border-dark-200;
  }

  :deep(table) {
    @apply w-full my-6 border-collapse ui-text-3;
  }

  :deep(:is(th, td)) {
    @apply px-4 py-2.5;
    @apply border-solid border-0 border-b-1 border-dark-200;
  }

  :deep(th) {
    @apply text-left font-500 text-light-200/50 uppercase tracking-wider;
  }

  :deep(td:first-child) {
    @apply whitespace-nowrap text-light-200;
  }
}
</style>

<script setup lang="ts">
const route = useRoute();

const { data: page } = await useAsyncData(`docs-${route.params.slug}`, () => {
  return queryCollection("docs").path(`/docs/${route.params.slug}`).first();
});

if (page.value) {
  useSeoMeta({
    title: `${page.value.title} | Quartz Docs`,
    description: page.value.description,
  });
}
</script>
