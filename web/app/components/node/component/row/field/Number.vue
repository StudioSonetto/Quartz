<template>
  <div class="field">
    <input
      type="number"
      :value="props.value"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      @input="
        emit('update:value', ($event.target as HTMLInputElement).valueAsNumber)
      "
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: string;
  min?: number;
  max?: number;
  step?: number;
}>();

const emit = defineEmits<{
  "update:value": [value: number];
}>();
</script>
