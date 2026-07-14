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
      <option v-for="option in props.options" :value="option">
        {{ option }}
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
  value: string;
  options: string[];
  disabled?: boolean;
}>();

defineEmits<{
  "update:value": [value: string];
}>();
</script>
