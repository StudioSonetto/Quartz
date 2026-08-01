<template>
  <div class="field">
    <textarea
      :class="{
        'cursor-not-allowed opacity-60': props.disabled,
      }"
      :disabled="props.disabled"
      @keydown.enter.exact.prevent="handleEnter"
      :rows="props.isParagraph ? 5 : 1"
      :maxlength="props.isParagraph ? 300 : 30"
      :value="props.value ?? ''"
      :placeholder="props.value === undefined ? 'Mixed' : undefined"
      @input="
        emit('update:value', ($event.target as HTMLTextAreaElement).value)
      "
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isParagraph?: boolean;
  value?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:value": [value: string];
}>();

function handleEnter(event: KeyboardEvent) {
  if (props.isParagraph) {
    const field = event.target as HTMLTextAreaElement;

    const currentValue = field.value;
    const cursorPosition = field.selectionStart;

    const newValue =
      currentValue.slice(0, cursorPosition) +
      "\n" +
      currentValue.slice(cursorPosition);

    field.value = newValue;

    field.selectionStart = field.selectionEnd = cursorPosition + 1;

    emit("update:value", newValue);
  } else {
    (event.target as HTMLTextAreaElement).blur();
  }
}
</script>
