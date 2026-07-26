<template>
  <NodeComponent name="animation" :icon="props.icon"></NodeComponent>
</template>

<script setup lang="ts">
const props = defineProps<{
  component: ComponentModel;
  icon: string;
}>();
</script>
