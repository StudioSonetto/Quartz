import { createHmac, timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";

const TTL = 60 * 60 * 1000;

const mac = (body: string, secret: string) =>
  createHmac("sha256", secret).update(body).digest("base64url");

export function signViewPass(deck: string, secret: string, now = Date.now()) {
  if (!secret) throw new Error("View pass is not configured");

  const body = Buffer.from(
    JSON.stringify({ kind: "view", deck, exp: now + TTL }),
  ).toString("base64url");

  return `${body}.${mac(body, secret)}`;
}

export function verifyViewPass(
  token: string,
  secret: string,
  now = Date.now(),
): { deck: string } | null {
  const [body, given] = token.split(".");

  if (!secret || !body || !given) return null;

  const a = Buffer.from(mac(body, secret));
  const b = Buffer.from(given);

  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString());

    if (claims.kind !== "view" || !(claims.exp > now)) return null;

    return { deck: claims.deck };
  } catch {
    return null;
  }
}

export function readViewPass(event: H3Event) {
  const header = getHeader(event, "authorization");

  if (!header?.startsWith("Bearer ")) return null;

  return verifyViewPass(
    header.slice(7),
    useRuntimeConfig(event).viewPassSecret,
  );
}
