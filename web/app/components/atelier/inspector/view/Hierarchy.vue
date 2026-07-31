<template>
  <AtelierInspectorView
    name="Hierarchy"
    :actions="[
      {
        icon: 'i-carbon-new-tab',
        tooltip: availableTypes.length
          ? 'New node'
          : `This node can't contain children.`,
        onClick: () => openCreateModal(),
        disabled: !availableTypes.length,
      },
    ]"
  >
    <ul
      class="tree"
      role="tree"
      tabindex="0"
      :aria-activedescendant="
        highlightedNodeId ? `node-${highlightedNodeId}` : undefined
      "
      @keydown="onKeydown"
      @focusin="onFocusin"
      @focusout="onFocusout"
      @pointerdown="onPointerdown"
    >
      <Node
        v-if="currentTree && !isEmptyTree(currentTree)"
        :id="currentTree.id"
        data-path="root"
        data-type="core.group"
        :node="currentTree"
      />
      <div v-else class="loader">
        <p>Loading...</p>
      </div>
    </ul>
    <Modal ref="modal" title="Node creation">
      <form @submit="onSubmit">
        <FormInput name="name" type="text" placeholder="Name" :maxlength="20" />
        <Field name="type" v-slot="{ field }">
          <select v-bind="field">
            <option
              v-for="node in availableTypes"
              :key="node.type"
              :value="node.type"
            >
              {{ node.label }}
            </option>
          </select>
        </Field>
        <p v-if="!availableTypes.length" class="text-center mt-6 opacity-70">
          This node type can't contain children.
        </p>
        <UIButton
          type="submit"
          size="sm"
          :disabled="!meta.valid || !availableTypes.length"
          class="w-full mt-10"
        >
          Confirm
        </UIButton>
        <p v-if="error" class="text-center text-red-500 mt-6">
          ERROR: {{ error }}
        </p>
      </form>
    </Modal>
  </AtelierInspectorView>
</template>

<style scoped lang="postcss">
.tree {
  /*
    By setting the max height to the half of the screen's,
    it prevents the tree to overflow,
    and also makes it responsive to different screen heights.

    (100vh / Amount of views inside the inspector)
  */
  @apply list-none h-full max-h-[50vh] overflow-y-auto;

  &:focus-visible {
    @apply outline-none;
  }

  .loader {
    @apply flex justify-center items-center h-full;
  }
}
</style>

<script setup lang="ts">
import zod from "zod";

import type Modal from "@/components/Modal.vue";

import { allNodeTypes, creatableTypesFor } from "~/modules/registry";

const { currentTree, currentSlides, soleSelected } =
  storeToRefs(useDeckStore());
const { highlightedNodeId } = storeToRefs(useAtelierStore());
const { onKeydown, onFocusin, onFocusout, onPointerdown } = useTreeKeyboard();

const modal = ref<typeof Modal>();

const nodeTypes = allNodeTypes();
const typeValues = nodeTypes.map((t) => t.type) as [NodeType, ...NodeType[]];

const availableTypes = computed(() =>
  creatableTypesFor(soleSelected.value?.type ?? "core.group"),
);

const nodeSchema = toTypedSchema(
  zod.object({
    name: zod.string().min(1, "Required"),
    type: zod.enum(typeValues),
  }),
);

const { handleSubmit, meta, resetForm } = useForm({
  validationSchema: nodeSchema,
  initialValues: {
    type: typeValues[0],
  },
});

function openCreateModal() {
  resetForm({ values: { type: availableTypes.value[0]?.type } });

  modal.value?.open();
}

const error = ref("");

const onSubmit = handleSubmit(async (values) => {
  try {
    error.value = "";

    if (!currentSlides.value) return;

    useDeckStore().createNode(`${values.name}`, values.type);

    modal.value?.close();

    resetForm();
  } catch (err) {
    error.value = (err as Error).message;
  }
});
</script>
