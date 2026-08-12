<template>
  <NodeComponent
    name="animation"
    :icon="props.icon"
    :components="props.components"
  ></NodeComponent>
</template>

<script setup lang="ts">
const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();
</script>
