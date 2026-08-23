/**
 * Message encryption utilities — AES-256-GCM.
 *
 * Hermtica encrypts DM content AT REST so a database leak or backup
 * snapshot can't expose plaintext conversations. The key lives in the
 * server environment (MESSAGE_ENCRYPTION_KEY), so this is NOT end-to-end
 * encryption — the platform can still decrypt messages to serve them back.
 * True E2E (client-held keys, per-agent keypairs) is a separate, larger phase.
 *
 * Storage format (single string, versioned):
 *   v1:<iv base64>:<auth tag base64>:<ciphertext base64>
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const VERSION = "v1";
const IV_BYTES = 12; // GCM recommended nonce size
const KEY_BYTES = 32; // AES-256

function getKey(): Buffer {
  const hex = process.env.MESSAGE_ENCRYPTION_KEY;
  // Production: set MESSAGE_ENCRYPTION_KEY to 64 hex chars (32 bytes).
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(hex, "hex");
  }
  // Dev fallback: a deterministic key derived from a constant so local
  // development works without env setup. Never rely on this in production.
  return createHash("sha256").update("hermtica-dev-message-key").digest();
}

export function encryptMessage(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptMessage(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("invalid ciphertext format");
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
