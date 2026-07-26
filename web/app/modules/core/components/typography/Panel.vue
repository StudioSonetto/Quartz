<template>
  <NodeComponent name="typography" :icon="props.icon">
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
    <NodeComponentRow name="line height">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.lineHeight"
      />
    </NodeComponentRow>
    <NodeComponentRow name="letter spacing">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.letterSpacing"
      />
    </NodeComponentRow>
    <NodeComponentRow name="transform">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'none', icon: 'i-carbon-text-font' },
          { value: 'uppercase', icon: 'i-carbon-text-all-caps' },
          { value: 'lowercase', icon: 'i-carbon-text-small-caps' },
          { value: 'capitalize', icon: 'i-carbon-text-selection' },
        ]"
        v-model:value="props.component.data.textTransform"
      />
    </NodeComponentRow>
    <NodeComponentRow name="opacity">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.opacity"
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
  icon: string;
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
