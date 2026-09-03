<template>
  <div class="field">
    <select
      :class="{
        'cursor-not-allowed': props.disabled,
      }"
      :disabled="props.disabled"
      :value="props.value ?? ''"
      @change="
        $emit('update:value', ($event.target as HTMLSelectElement).value)
      "
    >
      <option
        v-for="option in items"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped lang="postcss">
.field {
  select {
    @apply border-neutral-500 w-full;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  value?: string;
  options: readonly (string | { value: string; label: string })[];
  disabled?: boolean;
}>();

const items = computed(() =>
  props.options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)),
);

defineEmits<{
  "update:value": [value: string];
}>();
</script>
