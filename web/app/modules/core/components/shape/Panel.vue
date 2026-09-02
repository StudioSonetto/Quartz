<template>
  <NodeComponent name="shape" :icon="props.icon" :components="props.components">
    <NodeComponentRow name="kind" path="kind" v-slot="{ value, update }">
      <NodeComponentRowFieldSelect
        :options="['rect', 'ellipse', 'line', 'polygon']"
        :value="value"
        @update:value="(v) => setKind(v, update)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="fill">
      <NodeComponentRowFieldRadio
        :options="paintOptions"
        :value="mixedFill ? undefined : fill.type"
        @update:value="(v) => setPaint('fill', v)"
      />
    </NodeComponentRow>
    <NodeComponentRow
      v-if="!mixedFill && fill.type === 'colour'"
      name="fill colour"
      path="fill.value"
      kind="colour"
    >
      <NodeComponentRowFieldColour
        :value="fill.value"
        @update:value="(v) => set(['fill'], { type: 'colour', value: v })"
      />
    </NodeComponentRow>
    <NodeComponentRow name="stroke">
      <NodeComponentRowFieldRadio
        :options="paintOptions"
        :value="mixedStroke ? undefined : stroke.type"
        @update:value="(v) => setPaint('stroke', v)"
      />
    </NodeComponentRow>
    <NodeComponentRow
      v-if="!mixedStroke && stroke.type === 'colour'"
      name="stroke colour"
      path="stroke.value"
      kind="colour"
    >
      <NodeComponentRowFieldColour
        :value="stroke.value"
        @update:value="(v) => set(['stroke'], { type: 'colour', value: v })"
      />
    </NodeComponentRow>
    <NodeComponentRow
      v-if="!mixedStroke && stroke.type === 'colour'"
      name="stroke width"
      path="strokeWidth"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      v-if="kind === 'rect'"
      name="radius"
      path="radius"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      v-if="kind === 'polygon'"
      name="sides"
      path="sides"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber
        :value="value"
        :min="3"
        :max="64"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow v-if="kind !== 'path'" name="convert">
      <UIButton variant="ghost" @click="convertToPath"
        >Convert to path</UIButton
      >
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
import { coerceBackground } from "~/utils/layoutStyle";

const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { field, set } = useMergedFields(() => props.components);

const paintOptions = [
  { value: "none", icon: "i-carbon-error-outline" },
  { value: "colour", icon: "i-carbon-color-palette" },
];

function setPaint(key: "fill" | "stroke", next: string | string[]) {
  const type = Array.isArray(next) ? next[0] : next;
  const previous = field([key]) as { value?: string } | undefined;

  set(
    [key],
    type === "colour"
      ? { type: "colour", value: previous?.value ?? "#3B82F6" }
      : { type: "none", value: previous?.value },
  );

  // Stroke width defaults to 0, which paints nothing however it is coloured.
  if (key === "stroke" && type === "colour" && field(["strokeWidth"]) === 0)
    set(["strokeWidth"], 1);
}

// A line encloses no area, so a fill can never show it — only a stroke can.
function setKind(next: string | string[], update: (value: unknown) => void) {
  const value = Array.isArray(next) ? next[0] : next;

  update(value);

  if (value === "line" && stroke.value.type !== "colour")
    setPaint("stroke", "colour");
}

const kind = computed(() => field(["kind"]));

const rawFill = computed(() => field(["fill"]));
const rawStroke = computed(() => field(["stroke"]));

const mixedFill = computed(
  () => props.components.length > 1 && rawFill.value === undefined,
);
const mixedStroke = computed(
  () => props.components.length > 1 && rawStroke.value === undefined,
);

const fill = computed(() => coerceBackground(rawFill.value));
const stroke = computed(() => coerceBackground(rawStroke.value));

const deck = useDeckStore();
const history = useHistoryStore();
const { getNodeComponent } = useNodeComponents();

function pathFor(component: ComponentModel) {
  const size = getNodeComponent(component.node, "core.transform")?.data.size;

  if (typeof size?.width !== "number" || typeof size?.height !== "number")
    return null;

  return shapeToPoints(
    component.data.kind,
    size.width,
    size.height,
    component.data.sides,
  );
}

function convertToPath() {
  const end = history.begin("Convert to path");

  for (const component of props.components) {
    if (component.data.kind === "path") continue;

    const shape = pathFor(component);

    if (!shape) continue;

    deck.updateComponent({
      ...component,
      data: { ...component.data, kind: "path" },
    });
    deck.addComponent(component.node, "core.path");

    const path = getNodeComponent(component.node, "core.path");

    if (path) deck.updateComponent({ ...path, data: shape });
  }

  end();
}
</script>
