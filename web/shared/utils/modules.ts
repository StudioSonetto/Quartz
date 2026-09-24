export const moduleOf = (type: string) => type.split(".")[0]!;

export const lockedModules = (types: string[], unlocked: string[]) => [
  ...new Set(
    types
      .map(moduleOf)
      .filter((m) => m !== "core" && !unlocked.includes(m)),
  ),
];

export const modulesFromBenefits = (
  benefits: { benefitMetadata: Record<string, unknown> }[],
) => [
  ...new Set(
    benefits
      .map((b) => b.benefitMetadata.module)
      .filter((m): m is string => typeof m === "string"),
  ),
];
