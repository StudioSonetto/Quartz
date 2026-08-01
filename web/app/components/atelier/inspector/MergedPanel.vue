<template>
  <NodeComponent :name="name" :icon="icon">
    <template v-if="props.type === 'core.typography'">
      <NodeComponentRow name="font">
        <NodeComponentRowFieldDropdown
          :options="[...fonts, ...fontAssets].sort()"
          :value="merged(['font']).value"
          @update:value="(v) => write(['font'], v)"
        />
      </NodeComponentRow>
      <NodeComponentRow name="size">
        <NodeComponentRowFieldNumber
          :value="merged(['size']).value"
          @update:value="(v) => write(['size'], v)"
        />
      </NodeComponentRow>
      <NodeComponentRow name="weight">
        <NodeComponentRowFieldNumber
          :value="merged(['weight']).value"
          @update:value="(v) => write(['weight'], v)"
        />
      </NodeComponentRow>
      <NodeComponentRow name="line height">
        <NodeComponentRowFieldNumber
          :value="merged(['lineHeight']).value"
          @update:value="(v) => write(['lineHeight'], v)"
        />
      </NodeComponentRow>
      <NodeComponentRow name="letter spacing">
        <NodeComponentRowFieldNumber
          :value="merged(['letterSpacing']).value"
          @update:value="(v) => write(['letterSpacing'], v)"
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
          :value="merged(['textTransform']).value"
          @update:value="(v) => write(['textTransform'], v)"
        />
      </NodeComponentRow>
      <NodeComponentRow name="opacity">
        <NodeComponentRowFieldNumber
          :value="merged(['opacity']).value"
          @update:value="(v) => write(['opacity'], v)"
        />
      </NodeComponentRow>
      <NodeComponentRow name="colour">
        <NodeComponentRowFieldColour
          :value="merged(['colour']).value"
          @update:value="(v) => write(['colour'], v)"
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
          :value="merged(['style']).value"
          @update:value="(v) => write(['style'], v)"
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
          :value="merged(['alignment']).value"
          @update:value="(v) => write(['alignment'], v)"
        />
      </NodeComponentRow>
    </template>
    <template v-else>
      <NodeComponentRow name="—">
        <span class="soon">Multi-edit coming soon</span>
      </NodeComponentRow>
    </template>
  </NodeComponent>
</template>

<style scoped lang="postcss">
.soon {
  @apply ui-text-3 opacity-40 italic;
}
</style>

<script setup lang="ts">
import { getComponentType } from "~/modules/registry";
import { mergedValue } from "~/utils/mergedComponent";

const props = defineProps<{
  type: ComponentType;
  nodes: Tree[];
}>();

const { getNodeComponent } = useNodeComponents();
const { updateComponent } = useDeckStore();

const name = computed(() => props.type.replace("core.", ""));
const icon = computed(() => getComponentType(props.type)?.icon);

const comps = computed(() =>
  props.nodes
    .map((n) => getNodeComponent(n.id, props.type))
    .filter((c): c is ComponentModel => !!c),
);

// Shared value across the selection for a key path, or undefined when the
// nodes disagree — the fields then render blank.
function merged(path: string[]) {
  return mergedValue(comps.value, path);
}

function setNested(data: any, path: string[], value: any) {
  const next = structuredClone(data);
  let obj = next;
  for (const k of path.slice(0, -1)) obj = obj[k];
  obj[path[path.length - 1]!] = value;
  return next;
}

// Write an edit to every selected node's component of this type.
function write(path: string[], value: any) {
  for (const c of comps.value) {
    updateComponent({ ...c, data: setNested(c.data, path, value) });
  }
}

const fontAssets = computed(() => {
  return [
    ...useAssetsStore().fonts.map((font) => font.name.split(".")[0]),
  ].filter((font) => font !== undefined);
});
</script>
