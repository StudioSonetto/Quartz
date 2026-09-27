import { createECDH, createHmac } from "node:crypto";

const b64 = (bytes: Buffer) => bytes.toString("base64url");

export function sessionKeys(instanceId: string, presenter: string) {
  const d = createHmac("sha256", useRuntimeConfig().discordClientSecret)
    .update(`${instanceId}:${presenter}`)
    .digest();

  const ecdh = createECDH("prime256v1");

  ecdh.setPrivateKey(d);

  const point = ecdh.getPublicKey();

  const publicKey = {
    kty: "EC",
    crv: "P-256",
    x: b64(point.subarray(1, 33)),
    y: b64(point.subarray(33)),
  };

  return { publicKey, privateKey: { ...publicKey, d: b64(d) } };
}
