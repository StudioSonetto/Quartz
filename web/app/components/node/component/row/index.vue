<template>
  <div class="row">
    <label>{{ name }}</label>
    <div class="fields">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>
