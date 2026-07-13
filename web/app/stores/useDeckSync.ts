import {
  buildSavePayload,
  componentKey,
  type DeleteNode,
  type OutboxSnapshot,
} from "~/utils/outbox";
import type { SaveStatus } from "#shared/types";

export const useDeckSync = defineStore("deck-sync", () => {
  const apiFetch = useRequestFetch();

  const dirtyNodes = ref<Set<string>>(new Set());
  const deletedNodes = ref<DeleteNode[]>([]);
  const dirtyComponents = ref<Set<string>>(new Set());

  const status = ref<SaveStatus>("idle");
  const flushing = ref(false);
  let backoff = 0;

  const hasPending = computed(
    () =>
      dirtyNodes.value.size > 0 ||
      deletedNodes.value.length > 0 ||
      dirtyComponents.value.size > 0,
  );

  function enqueueNode(id: string) {
    dirtyNodes.value.add(id);
    scheduleFlush();
  }

  function enqueueComponent(node: string, type: string) {
    dirtyComponents.value.add(componentKey(node, type));
    scheduleFlush();
  }

  function dropNode(id: string) {
    dirtyNodes.value.delete(id);
    for (const key of [...dirtyComponents.value]) {
      if (key.startsWith(`${id}:`)) dirtyComponents.value.delete(key);
    }
  }

  function enqueueDelete(del: DeleteNode, nodeId: string) {
    dropNode(nodeId);
    deletedNodes.value.push(del);
    scheduleFlush();
  }

  const debouncedFlush = useDebounceFn(() => flush(), 1500);
  function scheduleFlush() {
    debouncedFlush();
  }

  async function flush(): Promise<void> {
    if (flushing.value || !hasPending.value) return;

    const store = useDeckStore();

    // Snapshot exactly what we're about to send; edits arriving mid-flight
    // re-populate these sets and flush next round.
    const snapshot: OutboxSnapshot = {
      dirtyNodes: [...dirtyNodes.value],
      deletedNodes: [...deletedNodes.value],
      dirtyComponents: [...dirtyComponents.value],
    };

    const payload = buildSavePayload(
      snapshot,
      (id) => store.getNodeById(id),
      (key) => {
        const [node, type] = key.split(":");
        return store.getComponent(node!, type!);
      },
    );

    if (
      !payload.nodesToUpsert.length &&
      !payload.nodesToDelete.length &&
      !payload.componentsToUpsert.length
    ) {
      // Everything resolved away (e.g. created-then-deleted); clear and stop.
      clearFlushed(snapshot);
      return;
    }

    // Remove-on-send: clear the snapshot's keys BEFORE awaiting so a same-key
    // re-edit arriving mid-flight re-adds the key and survives to the next
    // flush (rather than being clobbered by a post-await clear).
    clearFlushed(snapshot);

    flushing.value = true;
    status.value = "saving";
    try {
      await apiFetch("/api/nodes/save", { method: "POST", body: payload });
      backoff = 0;
      status.value = hasPending.value ? "saving" : "saved";
      if (hasPending.value) scheduleFlush();
    } catch (err) {
      // Restore-on-failure: merge the snapshot back into the live sets so the
      // failed work is retried (mid-flight re-edits are already merged in).
      restoreSnapshot(snapshot);
      status.value =
        typeof navigator !== "undefined" && navigator.onLine === false
          ? "offline"
          : "error";
      backoff = Math.min(backoff ? backoff * 2 : 2000, 30000);
      setTimeout(() => flush(), backoff);
    } finally {
      flushing.value = false;
    }
  }

  function clearFlushed(snapshot: OutboxSnapshot) {
    for (const id of snapshot.dirtyNodes) dirtyNodes.value.delete(id);
    for (const key of snapshot.dirtyComponents)
      dirtyComponents.value.delete(key);
    // Remove exactly the delete entries we sent (by reference identity).
    deletedNodes.value = deletedNodes.value.filter(
      (d) => !snapshot.deletedNodes.includes(d),
    );
  }

  function restoreSnapshot(snapshot: OutboxSnapshot) {
    for (const id of snapshot.dirtyNodes) dirtyNodes.value.add(id);
    for (const key of snapshot.dirtyComponents) dirtyComponents.value.add(key);
    for (const d of snapshot.deletedNodes) {
      if (!deletedNodes.value.includes(d)) deletedNodes.value.push(d);
    }
  }

  return {
    status,
    hasPending,
    enqueueNode,
    enqueueComponent,
    enqueueDelete,
    dropNode,
    flush,
    scheduleFlush,
  };
});
