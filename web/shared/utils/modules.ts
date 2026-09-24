export const moduleOf = (type: string) => type.split(".")[0]!;

export const lockedModules = (types: string[], unlocked: string[]) => [
  ...new Set(
    types
      .map(moduleOf)
      .filter((m) => m !== "core" && !unlocked.includes(m)),
  ),
];
