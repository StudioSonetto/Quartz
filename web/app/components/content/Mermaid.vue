<!-- https://github.com/nuxt/content/issues/1866#issuecomment-1434274988 -->

<template>
  <div v-if="show" class="mermaid">
    <slot />
  </div>
</template>

<script setup lang="ts">
const show = ref(false);

onMounted(async () => {
  show.value = true;

  await nextTick();

  useNuxtApp().$mermaid().run();
});
</script>
