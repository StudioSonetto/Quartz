<template>
  <NodeComponent name="model">
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
    <NodeComponentRow name="position">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.x"
        name="x"
      />
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.y"
        name="y"
      />
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.z"
        name="z"
      />
    </NodeComponentRow>
    <NodeComponentRow name="scale">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.scale"
        name="scale"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
import { primitiveTypes } from "~/composables/node-renderer/useThreeObjects";

const { updateNodeComponent } = useDeckStore();

const props = defineProps<{
  component: ComponentModel;
}>();

watch(props.component.data, () => {
  updateNodeComponent(props.component);
});
</script>
