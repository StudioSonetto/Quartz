import { createHmac, timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";

interface DiscordClaims {
  discordId: string;
  userId: string | null;
  instanceId: string;
  exp: number;
}

const TTL = 12 * 60 * 60 * 1000;

const mac = (body: string, secret: string) =>
  createHmac("sha256", secret).update(body).digest("base64url");

export function signDiscordToken(
  claims: Omit<DiscordClaims, "exp">,
  secret: string,
) {
  if (!secret) throw new Error("Discord is not configured");

  const body = Buffer.from(
    JSON.stringify({ ...claims, exp: Date.now() + TTL }),
  ).toString("base64url");

  return `${body}.${mac(body, secret)}`;
}

function verifyDiscordToken(
  token: string,
  secret: string,
): DiscordClaims | null {
  const [body, given] = token.split(".");

  if (!secret || !body || !given) return null;

  const a = Buffer.from(mac(body, secret));
  const b = Buffer.from(given);

  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString());

    return claims.exp > Date.now() ? claims : null;
  } catch {
    return null;
  }
}

export function readDiscordToken(event: H3Event) {
  const header = getHeader(event, "authorization");

  if (!header?.startsWith("Bearer ")) return null;

  return verifyDiscordToken(
    header.slice(7),
    useRuntimeConfig(event).discordClientSecret,
  );
}

export function requireDiscordToken(event: H3Event) {
  const claims = readDiscordToken(event);

  if (!claims) throw createError({ statusCode: 401 });

  return claims;
}
