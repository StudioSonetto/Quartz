export type SyncChannel = "name" | ComponentType;

const ROOT = "root";

export interface SyncTarget {
  path: string;
  unsynced?: string[] | null;
}

export function unsyncedOf(node: SyncTarget): string[] {
  return node.unsynced ?? (node.path === ROOT ? ["name"] : []);
}

export function syncs(node: SyncTarget, channel: SyncChannel): boolean {
  return !unsyncedOf(node).includes(channel);
}
