export const moduleOf = (type: string) => type.split(".")[0]!;

export const moduleUnlocked = (module: string, unlocked: string[]) =>
  module === "core" || unlocked.includes(module);

export const paidCounts = (types: string[]) => {
  const counts: Record<string, number> = {};

  for (const module of types.map(moduleOf))
    if (module !== "core") counts[module] = (counts[module] ?? 0) + 1;

  return counts;
};

export const modulesFromBenefits = (
  benefits: { benefitMetadata: Record<string, unknown> }[],
) => [
  ...new Set(
    benefits
      .map((b) => b.benefitMetadata.module)
      .filter((m): m is string => typeof m === "string"),
  ),
];
