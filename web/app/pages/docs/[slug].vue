<template>
  <div class="docs">
    <aside>Sidebar</aside>
    <div class="content">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.docs {
  @apply flex;

  aside {
    @apply bg-dark-500 w-sm h-screen;
    @apply flex flex-col relative border-r;
  }

  .content {
    @apply flex-1 p-12;
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
