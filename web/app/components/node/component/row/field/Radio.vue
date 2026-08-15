<template>
  <div class="field">
    <fieldset>
      <button
        v-for="option in props.options"
        @click="selectOption(option.value)"
        :disabled="props.disabled"
        :class="[option.icon, { selected: isSelected(option.value) }]"
        :title="option.label ?? option.value"
        :aria-label="option.label ?? option.value"
        class="option"
        :key="option.value"
      />
    </fieldset>
  </div>
</template>

<style scoped lang="postcss">
.field {
  fieldset {
    @apply flex items-center gap-6;

    .option {
      @apply opacity-40 hover:opacity-100 transition-opacity;
      @apply ui-text-3 text-light-200;

      &.selected {
        @apply opacity-100;
      }

      &:disabled {
        @apply opacity-20! cursor-not-allowed;
      }
    }
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  value?: string | string[];
  options: {
    value: string;
    icon: string;
    label?: string;
  }[];
  toggleMode?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:value": [value: string | string[]];
}>();

function isSelected(value: string) {
  if (props.toggleMode) {
    return Array.isArray(props.value) ? props.value.includes(value) : false;
  }

  return props.value === value;
}

function selectOption(value: string) {
  if (props.toggleMode) {
    const currentValues = Array.isArray(props.value) ? props.value : [];

    if (currentValues.includes(value)) {
      emit(
        "update:value",
        currentValues.filter((option) => option !== value),
      );
    } else {
      emit("update:value", [...currentValues, value]);
    }
  } else {
    emit("update:value", value);
  }
}
</script>
