<template>
  <div class="field">
    <input
      type="number"
      class="disabled:opacity-40 disabled:cursor-not-allowed"
      :value="props.value"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :disabled="props.disabled"
      :placeholder="props.value === undefined ? 'Mixed' : undefined"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value?: string | number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:value": [value: number];
}>();

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber;

  if (!Number.isNaN(value)) emit("update:value", value);
}
</script>
