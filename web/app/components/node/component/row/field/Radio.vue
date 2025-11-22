<template>
  <div class="field">
    <fieldset>
      <button
        v-for="option in props.options"
        @click="selectOption(option.value)"
        :class="[option.icon, { selected: isSelected(option.value) }]"
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
      @apply opacity-60 hover:opacity-100 transition-opacity;
      @apply ui-text-3;

      &.selected {
        @apply opacity-100;
      }
    }
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  value: string | string[];
  options: {
    value: string;
    icon: string;
  }[];
  toggleMode?: boolean;
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
