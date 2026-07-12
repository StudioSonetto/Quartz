<template>
  <AtelierInspectorView
    name="Hierarchy"
    :actions="[
      {
        icon: 'i-carbon-new-tab',
        tooltip: 'New node',
        onClick: () => modal?.open(),
      },
    ]"
    @keydown.esc="selectedNode = null"
  >
    <ul class="tree">
      <Node
        v-if="currentTree && !isEmptyTree(currentTree)"
        :id="currentTree.id"
        data-path="root"
        data-type="group"
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
              v-for="node in creatableTypes"
              :key="node.type"
              :value="node.type"
            >
              {{ node.label }}
            </option>
          </select>
        </Field>
        <UIButton
          type="submit"
          size="sm"
          :disabled="!meta.valid"
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

  .loader {
    @apply flex justify-center items-center h-full;
  }
}
</style>

<script setup lang="ts">
import { RealtimeChannel } from "@supabase/supabase-js";
import zod from "zod";

import type Modal from "@/components/Modal.vue";

import { creatableNodeTypes } from "~/modules/registry";

const client = useSupabaseClient();

let nodesRC: RealtimeChannel;

const { currentTree, currentSlides, selectedNode } =
  storeToRefs(useDeckStore());

const modal = ref<typeof Modal>();

const creatableTypes = creatableNodeTypes();
const typeValues = creatableTypes.map((t) => t.type) as [
  NodeType,
  ...NodeType[],
];

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

const error = ref("");

const onSubmit = handleSubmit(async (values) => {
  try {
    error.value = "";

    if (!currentSlides.value) return;

    await useDeckStore().insertNewNode(
      `${currentSlides.value.id}`,
      `${values.name}`,
      values.type,
    );

    modal.value?.close();

    resetForm();
  } catch (err) {
    error.value = (err as Error).message;
  }
});

onMounted(() => {
  nodesRC = client
    .channel("public:nodes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "nodes" },
      () => useDeckStore().fetchAllNodes(),
    )
    .subscribe();
});

onUnmounted(() => {
  client.removeChannel(nodesRC);
});
</script>
