<template>
  <div class="field">
    <input
      type="color"
      :value="props.value ?? '#000000'"
      @input="$emit('update:value', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value?: string;
}>();

defineEmits<{
  "update:value": [value: string];
}>();
</script>
