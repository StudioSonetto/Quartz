import type { H3Event } from "h3";
import type { z } from "zod";

/**
 * Reads and validates the request body against a Zod schema.
 * Throws 400 with the flattened issues if validation fails.
 */
export async function validateBody<S extends z.ZodType>(
  event: H3Event,
  schema: S,
): Promise<z.infer<S>> {
  const result = schema.safeParse(await readBody(event));

  if (!result.success)
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request body",
      data: result.error.flatten(),
    });

  return result.data;
}
