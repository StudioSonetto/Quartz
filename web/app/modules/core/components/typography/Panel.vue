<template>
  <NodeComponent name="typography">
    <NodeComponentRow name="content">
      <NodeComponentRowFieldText
        isParagraph
        v-model:value="props.component.data.content"
      />
    </NodeComponentRow>
    <NodeComponentRow name="font">
      <NodeComponentRowFieldDropdown
        :options="[...fonts, ...fontAssets].sort()"
        v-model:value="props.component.data.font"
      />
    </NodeComponentRow>
    <NodeComponentRow name="size">
      <NodeComponentRowFieldNumber v-model:value="props.component.data.size" />
    </NodeComponentRow>
    <NodeComponentRow name="weight">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.weight"
      />
    </NodeComponentRow>
    <NodeComponentRow name="colour">
      <NodeComponentRowFieldColour
        v-model:value="props.component.data.colour"
      />
    </NodeComponentRow>
    <NodeComponentRow name="style">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'italic', icon: 'i-carbon-text-italic' },
          { value: 'underline', icon: 'i-carbon-text-underline' },
          { value: 'strikethrough', icon: 'i-carbon-text-strikethrough' },
        ]"
        toggleMode
        v-model:value="props.component.data.style"
      />
    </NodeComponentRow>
    <NodeComponentRow name="alignment">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'left', icon: 'i-carbon-text-align-left' },
          { value: 'center', icon: 'i-carbon-text-align-center' },
          { value: 'right', icon: 'i-carbon-text-align-right' },
          { value: 'justify', icon: 'i-carbon-text-align-justify' },
        ]"
        v-model:value="props.component.data.alignment"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const { updateComponent } = useDeckStore();

const props = defineProps<{
  component: ComponentModel;
}>();

watch(props.component.data, () => {
  updateComponent(props.component);
});

const fontAssets = computed(() => {
  return [
    ...useAssetsStore().fonts.map((font) => font.name.split(".")[0]),
  ].filter((font) => font !== undefined);
});
</script>
