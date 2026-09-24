import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";
import { z } from "zod";
import { db } from "~~/server/db";
import { lapidaries } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const polar = usePolar();
  const secret = useRuntimeConfig().polarWebhookSecret;

  if (!secret) throw createError({ statusCode: 404 });

  let payload;

  try {
    payload = validateEvent(
      (await readRawBody(event)) ?? "",
      getHeaders(event) as Record<string, string>,
      secret,
    );
  } catch (err) {
    if (err instanceof WebhookVerificationError)
      throw createError({ statusCode: 403 });

    throw err;
  }

  if (payload.type !== "customer.state_changed") return { ok: true };

  const id = payload.data.externalId;
  if (!z.string().uuid().safeParse(id).success) return { ok: true };

  const state = await polar.customers
    .getStateExternal({ externalId: id! })
    .catch((err) => {
      if (err instanceof ResourceNotFound) return null;
      throw err;
    });

  const unlocked = modulesFromBenefits(state?.grantedBenefits ?? []);

  await db
    .insert(lapidaries)
    .values({ id: id!, unlocked_modules: unlocked })
    .onConflictDoUpdate({
      target: lapidaries.id,
      set: { unlocked_modules: unlocked },
    });

  return { ok: true };
});
