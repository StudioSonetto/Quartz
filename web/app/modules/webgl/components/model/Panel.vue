<template>
  <NodeComponent name="model" :icon="props.icon">
    <NodeComponentRow name="type">
      <NodeComponentRowFieldSelect
        v-model:value="props.component.data.type"
        :options="[
          ...primitiveTypes,
          ...useAssetsStore().models.map((model) => model.name),
        ]"
      />
    </NodeComponentRow>
    <NodeComponentRow name="fallback">
      <NodeComponentRowFieldSelect
        :disabled="primitiveTypes.includes(props.component.data.type)"
        v-model:value="props.component.data.fallback"
        :options="['none', ...primitiveTypes]"
      />
    </NodeComponentRow>
    <NodeComponentRow name="colour">
      <NodeComponentRowFieldColour
        v-model:value="props.component.data.colour"
      />
    </NodeComponentRow>
    <NodeComponentRow name="texture">
      <NodeComponentRowFieldSelect
        v-model:value="props.component.data.texture"
        :options="[
          'default',
          ...useAssetsStore().images.map((image) => image.name),
        ]"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
import { primitiveTypes } from "../../lib/primitives";

const { updateComponent } = useDeckStore();

const props = defineProps<{
  component: ComponentModel;
  icon: string;
}>();

watch(props.component.data, () => {
  updateComponent(props.component);
});
</script>
