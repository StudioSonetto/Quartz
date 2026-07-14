<template>
  <Field v-slot="{ field, meta }" :name="props.name">
    <input
      v-bind="field"
      :class="[
        'w-full transition-border-color duration-300',
        { 'border-light-200': meta.valid && meta.touched },
      ]"
      :type="props.type"
      :placeholder="props.placeholder"
      :maxlength="props.maxlength"
      autocomplete="off"
    />
    <ErrorMessage :name="props.name" />
  </Field>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string;
  type: string;
  placeholder: string;
  maxlength?: number;
}>();
</script>
