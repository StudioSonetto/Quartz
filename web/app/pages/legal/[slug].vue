<template>
  <LandingNavbar />
  <UIProse v-if="page" :value="page" class="px-6 pt-32 lg:pt-60 pb-24" />
  <LandingFooter />
</template>

<script setup lang="ts">
const route = useRoute();

const { data: page } = await useAsyncData(`legal-${route.params.slug}`, () =>
  queryCollection("legal").path(`/legal/${route.params.slug}`).first(),
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}

useSeoMeta({ title: `${page.value.title} | Quartz` });
</script>
