export function useRemoteChanges(deckId: string) {
  const client = useSupabaseClient();
  const store = useDeckStore();
  const sync = useDeckSync();

  let batch: RemoteRow[] = [];
  let frame = 0;

  function drain() {
    frame = 0;

    const rows = batch;
    batch = [];

    const inserted = new Map<string, string>();

    for (const { table, event, row } of rows) {
      if (table === "nodes" && event === "INSERT" && row.slides)
        inserted.set(row.id, row.slides);
    }

    const known = (node: string) =>
      store.slideOfNode.get(node) ?? inserted.get(node);
    const picked = pickRemote(rows, known, sync.isBusy);

    for (const [slideId, list] of picked) store.applyRemote(slideId, list);
  }

  function push(table: RemoteRow["table"], payload: any) {
    const event = payload.eventType as RemoteRow["event"];
    const row = event === "DELETE" ? payload.old : payload.new;

    if (!row) return;

    batch.push({ table, event, row });

    if (!frame) frame = requestAnimationFrame(drain);
  }

  const channel = client
    .channel(`atelier:${deckId}:rows`, { config: { private: true } })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "nodes" },
      (payload) => push("nodes", payload),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "components" },
      (payload) => push("components", payload),
    )
    .subscribe();

  function stop() {
    if (frame) cancelAnimationFrame(frame);

    frame = 0;
    batch = [];

    client.removeChannel(channel);
  }

  return { stop };
}
