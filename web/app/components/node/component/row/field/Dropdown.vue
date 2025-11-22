<template>
  <div class="field">
    <div>
      <input
        ref="input"
        type="text"
        :value="props.value ?? ''"
        @input="
          $emit('update:value', ($event.target as HTMLInputElement).value)
        "
        spellcheck="false"
      />
      <div
        v-if="focused && filteredOptions.length > 0"
        class="dropdown"
        @mousedown.prevent
      >
        <button
          v-for="option in filteredOptions"
          :key="option"
          @click="selectOption(option)"
        >
          {{ option }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.field {
  div {
    @apply relative;

    input {
      @apply w-full p-0 ui-text-3;
    }

    .dropdown {
      @apply absolute z-99 w-full;
      @apply flex flex-col;
      @apply bg-dark-900 px-2 py-2;
      @apply border-rd border-solid border-1 border-dark-200;
      @apply overflow-y-scroll max-h-[12vh];

      button {
        @apply text-left py-2 ui-text-3;
      }
    }
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  value: string;
  options: string[];
}>();

const emit = defineEmits<{
  "update:value": [value: string];
}>();

const input = ref<HTMLInputElement>();

const { focused } = useFocus(input);

const filteredOptions = computed(() => {
  return props.options.filter((option) =>
    option.toLowerCase().includes(input.value?.value.toLowerCase() ?? ""),
  );
});

function selectOption(option: string) {
  input.value!.value = option;

  emit("update:value", option);

  focused.value = false;
}

watch(focused, (value) => {
  if (!value && input.value?.value) {
    selectOption(filteredOptions.value[0] ?? "");
  }
});
</script>
