export type SyncChannel = "name" | "locked" | ComponentType;

export const ROOT_NODE_PATH = "root";

export interface SyncTarget {
  path: string;
  unsynced?: string[] | null;
}

export function unsyncedOf(node: SyncTarget): string[] {
  return node.unsynced ?? (node.path === ROOT_NODE_PATH ? ["name"] : []);
}

export function syncs(node: SyncTarget, channel: SyncChannel): boolean {
  return !unsyncedOf(node).includes(channel);
}
