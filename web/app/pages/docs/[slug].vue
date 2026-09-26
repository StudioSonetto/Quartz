<template>
  <div class="docs">
    <aside>Sidebar</aside>
    <div class="content">
      <UIProse v-if="page" :value="page" />
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
</style>

<script setup lang="ts">
const route = useRoute();

const { data: page } = await useAsyncData(`docs-${route.params.slug}`, () => {
  return queryCollection("docs").path(`/docs/${route.params.slug}`).first();
});

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}

useSeoMeta({
  title: `${page.value.title} | Quartz Docs`,
  ogTitle: page.value.title,
  description: page.value.description,
  ogDescription: page.value.description,
});
</script>
