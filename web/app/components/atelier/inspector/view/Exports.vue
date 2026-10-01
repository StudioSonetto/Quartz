<template>
  <AtelierInspectorView name="Export">
    <div class="export-list">
      <UIButton variant="solid" :disabled="!!progress" @click="png">
        <div class="i-carbon-image"></div>
        PNG — current slide
      </UIButton>
      <UIButton variant="solid" :disabled="!!progress" @click="pdf">
        <div class="i-carbon-document-pdf"></div>
        PDF — all slides
      </UIButton>
      <p v-if="progress" class="ui-text-4">Exporting {{ progress }}</p>
    </div>
  </AtelierInspectorView>
</template>

<style scoped lang="postcss">
.export-list {
  @apply flex flex-col gap-2;
}
</style>

<script setup lang="ts">
const { png, pdf, progress } = useExport();
</script>
