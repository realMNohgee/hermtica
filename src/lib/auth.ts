import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHash, randomBytes, createHmac, timingSafeEqual } from "crypto";

// ─── Password Hashing ─────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const computed = createHash("sha256").update(salt + password).digest("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

// ─── API Key Generation ───────────────────────────────────

export function generateApiKey(): string {
  return `hk_${randomBytes(24).toString("hex")}`;
}

// ─── TOTP (Time-based One-Time Password) ──────────────────

function base32ToBytes(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of base32.toUpperCase().replace(/=+$/, "")) {
    const val = alphabet.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = Buffer.alloc(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

export function generateTotpSecret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 16; i++) {
    secret += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return secret;
}

export function verifyTotp(secret: string, token: string): boolean {
  if (!secret || !token || token.length !== 6) return false;
  const now = Math.floor(Date.now() / 1000);
  // Check current and adjacent windows (±30s)
  for (let offset = -1; offset <= 1; offset++) {
    if (generateTotpToken(secret, now + offset * 30) === token) return true;
  }
  return false;
}

function generateTotpToken(secret: string, counter: number): string {
  const key = base32ToBytes(secret);
  const timeBytes = Buffer.alloc(8);
  timeBytes.writeBigInt64BE(BigInt(Math.floor(counter / 30)));
  const hmac = createHmac("sha1", key).update(timeBytes).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, "0");
}

export function getTotpUri(secret: string, handle: string): string {
  return `otpauth://totp/Hermtica:${handle}?secret=${secret}&issuer=Hermtica`;
}

// ─── Auth Queries ─────────────────────────────────────────

export async function getAgentByApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith("hk_")) return null;
  return await db.select().from(agents).where(eq(agents.apiKey, apiKey)).get() || null;
}

export async function authenticateAgent(handle: string, password: string) {
  const agent = await db.select().from(agents).where(eq(agents.handle, handle)).get();
  if (!agent || !agent.passwordHash) return null;
  if (!verifyPassword(password, agent.passwordHash)) return null;
  return agent;
}

export async function setAgentPassword(agentId: string, password: string) {
  const hash = hashPassword(password);
  const key = generateApiKey();
  await db.update(agents).set({ passwordHash: hash, apiKey: key }).where(eq(agents.id, agentId)).run();
  return { apiKey: key };
}

// ─── Password Validation ──────────────────────────────────

interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("one number");
  }
  if (!/[!#$%&*+\-=?^_.,:;]/.test(password)) {
    errors.push("one special character (!#$%&*+-=?^_.,:;)");
  }
  // Reject unsafe characters
  if (/[\/\\@'\"`<>]/.test(password)) {
    errors.push("cannot contain: / \\ @ ' \" ` < >");
  }

  return { valid: errors.length === 0, errors };
}

export async function enableTwoFactor(agentId: string, secret: string) {
  await db.update(agents).set({ twoFactorSecret: secret, twoFactorEnabled: true }).where(eq(agents.id, agentId)).run();
}

export async function verifyTwoFactor(agentId: string, token: string): Promise<boolean> {
  const agent = await db.select({ twoFactorSecret: agents.twoFactorSecret }).from(agents).where(eq(agents.id, agentId)).get();
  if (!agent?.twoFactorSecret || !token) return false;
  return verifyTotp(agent.twoFactorSecret, token);
}
