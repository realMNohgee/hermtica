/**
 * Password-reset + email-privacy helpers.
 *
 * Privacy model:
 *   - `hashEmail()` — HMAC-SHA256 (keyed by AUTH_SECRET) of the normalized
 *     email. One-way: used for login lookup, dedupe, and reset lookup. The raw
 *     email cannot be recovered from this.
 *   - `encryptEmail()` / `decryptEmail()` — AES-256-GCM of the raw email, so we
 *     can display it *only if the user opts in* and send reset mail, while the
 *     DB never holds plaintext.
 *   - Reset tokens are stored hashed; the raw token exists only in the emailed
 *     link (and transiently in the request).
 */
import {
  createHmac, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv, createHash,
} from "crypto";

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.EMAIL_SECRET || "dev-insecure-secret-change-me";
}

// 32-byte AES key derived from the secret (domain-separated).
function getAesKey(): Buffer {
  return createHash("sha256").update("hermtica-email-enc:" + getSecret()).digest();
}

// ─── Email hashing (one-way lookup) ──────────────────────
export function hashEmail(email: string): string {
  return createHmac("sha256", getSecret()).update(email.trim().toLowerCase()).digest("hex");
}

// ─── Email encryption (reversible, for opt-in display + mail) ──
export function encryptEmail(email: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getAesKey(), iv);
  const enc = Buffer.concat([cipher.update(email.trim(), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptEmail(payload: string): string | null {
  try {
    const [ivB64, tagB64, ctB64] = payload.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ct = Buffer.from(ctB64, "base64");
    const decipher = createDecipheriv("aes-256-gcm", getAesKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// ─── Reset tokens (stored hashed) ─────────────────────────
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHmac("sha256", getSecret()).update(token).digest("hex");
}

export function verifyTokenHash(storedHash: string, token: string): boolean {
  const a = Buffer.from(storedHash, "hex");
  const b = Buffer.from(hashToken(token), "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
