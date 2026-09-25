import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";
import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { z } from "zod";
import { db } from "~~/server/db";
import { lapidaries } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const polar = usePolar();
  const secret = useRuntimeConfig().polarWebhookSecret;

  if (!secret) throw createError({ statusCode: 404 });

  let payload: { type: string; data: { external_id?: string | null } };

  // Not the SDK's validateEvent: it re-encodes the secret, so whsec_ secrets never match.
  try {
    payload = new Webhook(secret).verify(
      (await readRawBody(event)) ?? "",
      getHeaders(event) as Record<string, string>,
    ) as typeof payload;
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn("Polar webhook rejected:", err.message);
      throw createError({ statusCode: 403 });
    }

    throw err;
  }

  if (payload.type !== "customer.state_changed") return { ok: true };

  const id = payload.data.external_id;
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
