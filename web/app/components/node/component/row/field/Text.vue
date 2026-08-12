<template>
  <div class="field">
    <textarea
      :class="{
        'cursor-not-allowed opacity-60': props.disabled,
      }"
      :disabled="props.disabled"
      @keydown.enter.exact.prevent="handleEnter"
      @keydown.escape="handleEscape"
      :rows="props.isParagraph ? 5 : 1"
      :maxlength="props.maxlength ?? (props.isParagraph ? 300 : 30)"
      :value="draft"
      :placeholder="props.value === undefined ? 'Mixed' : undefined"
      @input="onInput"
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isParagraph?: boolean;
  value?: string;
  disabled?: boolean;
  maxlength?: number;
  lazy?: boolean;
}>();

const emit = defineEmits<{
  "update:value": [value: string];
}>();

const draft = ref(props.value ?? "");

watch(
  () => props.value,
  (value) => {
    draft.value = value ?? "";
  },
);

let dirty = false;

function flush(): boolean {
  if (!dirty) return false;

  dirty = false;
  emit("update:value", draft.value);

  return true;
}

function onInput(event: Event) {
  draft.value = (event.target as HTMLTextAreaElement).value;

  if (props.lazy) {
    dirty = true;
    return;
  }

  emit("update:value", draft.value);
}

async function onChange() {
  if (!props.lazy || !flush()) return;

  await nextTick();

  draft.value = props.value ?? "";
}

function handleEscape(event: KeyboardEvent) {
  if (!props.lazy || !dirty) return;

  event.preventDefault();
  dirty = false;
  draft.value = props.value ?? "";
}

onBeforeUnmount(() => {
  if (props.lazy) flush();
});

function handleEnter(event: KeyboardEvent) {
  const field = event.target as HTMLTextAreaElement;

  if (!props.isParagraph) {
    field.blur();
    return;
  }

  const at = field.selectionStart;

  draft.value = draft.value.slice(0, at) + "\n" + draft.value.slice(at);

  // A lazy field commits on blur, where `change` carries the same value.
  if (props.lazy) dirty = true;
  else emit("update:value", draft.value);

  // Patching `:value` drops the caret at the end.
  nextTick(() => {
    field.selectionStart = field.selectionEnd = at + 1;
  });
}
</script>
