<template>
  <NodeComponent name="base" :icon="props.icon">
    <NodeComponentRow name="reference">
      <NodeComponentRowFieldText
        lazy
        :value="mergedReference"
        :disabled="allRoot"
        @update:value="commitReference"
      />
    </NodeComponentRow>
    <p v-if="rejection" class="rejection">{{ rejection }}</p>
    <NodeComponentRow name="variables">
      <Variables :components="props.components" />
    </NodeComponentRow>
  </NodeComponent>
  <LinkModal
    v-if="pending"
    ref="linkModal"
    :link-key="pending.key"
    :peer-count="pending.peers.length"
    @resolve="resolveLink"
  />
</template>

<style scoped lang="postcss">
.rejection {
  @apply ui-text-3 text-red-400;
}
</style>

<script setup lang="ts">
const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const deck = useDeckStore();
const { updateNode, updateComponent } = deck;

// Blank when the nodes disagree.
const mergedReference = computed(() =>
  allEqual(
    props.nodes.map((n) => n.reference ?? ""),
    "",
  ),
);

// Root stays unlinkable until per-component sync selection exists: linking it
// today would converge slide backgrounds along with the variables.
const allRoot = computed(() => props.nodes.every((n) => n.path === ROOT_PATH));

const targets = computed(() => props.nodes.filter((n) => n.path !== ROOT_PATH));

const linkModal = ref<{ open: () => void }>();
const rejection = ref<string | null>(null);
const pending = ref<{
  key: string;
  ids: string[];
  peers: LinkCandidate[];
} | null>(null);

watch(
  () => props.nodes,
  () => {
    rejection.value = null;
  },
);

function candidate(id: string): LinkCandidate | null {
  const node = deck.getNodeAsTree(id);

  if (!node) return null;

  return {
    id,
    type: node.type,
    name: node.name,
    slides: node.slides,
    data: Object.fromEntries(
      deck.componentsOf(id).map((c) => [c.type, c.data]),
    ),
  };
}

function peersFor(key: string, excluding: Set<string>): LinkCandidate[] {
  const out: LinkCandidate[] = [];

  for (const tree of deck.trees.values()) {
    if (!tree?.id) continue;
    for (const n of flattenTree(tree)) {
      if (excluding.has(n.id) || n.reference !== key) continue;

      const c = candidate(n.id);
      if (c) out.push(c);
    }
  }
  return out;
}

function applyKey(ids: string[], key: string) {
  for (const id of ids) updateNode(id, { reference: key || null });
}

function converge(sourceId: string) {
  const source = deck.getNodeAsTree(sourceId);
  if (!source) return;

  for (const c of deck.componentsOf(sourceId)) {
    updateComponent({ ...c, data: JSON.parse(JSON.stringify(c.data)) });
  }
  updateNode(sourceId, { name: source.name });
}

function commitReference(value: string) {
  if (!targets.value.length) return;

  const key = value.trim();
  const ids = targets.value.map((n) => n.id);
  rejection.value = null;

  if (key && !deck.allSlidesLoaded) {
    rejection.value = "Still loading the deck — try again in a moment.";
    return;
  }

  const selection = targets.value
    .map((n) => candidate(n.id))
    .filter((c): c is LinkCandidate => c !== null);
  const peers = key ? peersFor(key, new Set(ids)) : [];

  const plan = planLink(selection, peers, key);

  if (plan.kind === "reject") {
    // Nothing is written; the field resets itself to `mergedReference`.
    rejection.value = plan.reason;
    return;
  }

  if (plan.kind === "clear" || plan.kind === "link") {
    applyKey(ids, key);
    return;
  }

  pending.value = { key, ids, peers };
  nextTick(() => linkModal.value?.open());
}

function resolveLink(choice: "adopt" | "push" | "cancel") {
  const request = pending.value;
  pending.value = null;
  if (!request) return;

  // Nothing was written when the modal opened, so cancel has nothing to undo.
  if (choice === "cancel") return;

  applyKey(request.ids, request.key);

  if (choice === "push") {
    // Anchor = last-clicked, so a multi-selection pushes from that node.
    const anchor = request.ids.find((id) => id === deck.anchorId);
    converge(anchor ?? request.ids[0]!);
    return;
  }

  // Adopt from the lowest-index peer. All peers are identical by the invariant,
  // so this is arbitrary — pinned only to make a violation reproducible.
  const source = [...request.peers].sort(
    (a, b) => (deck.slideIndexOf(a.id) ?? 0) - (deck.slideIndexOf(b.id) ?? 0),
  )[0];
  if (source) converge(source.id);
}
</script>
