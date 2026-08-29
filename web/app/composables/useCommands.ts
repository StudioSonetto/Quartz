import { allCommands, getCommand } from "~/modules/registry";
import { buildCommandContext } from "~/composables/commandContext";

export function useCommands() {
  const atelier = useAtelierStore();

  const enabledCommands = computed(() => {
    const ctx = buildCommandContext();
    return allCommands().map((command) => ({
      command,
      enabled: command.when ? command.when(ctx) : true,
    }));
  });

  async function run(id: string) {
    const command = getCommand(id);

    if (!command) return;

    const ctx = buildCommandContext();

    if (command.when && !command.when(ctx)) return;

    atelier.pushRecentCommand(id);

    try {
      if (command.undoable === false) await command.run(ctx);
      else await useHistoryStore().transact(command.title, () => command.run(ctx));
    } catch (e) {
      console.error(`Command "${id}" failed:`, e);
    }
  }

  return { enabledCommands, run };
}
