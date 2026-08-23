/**
 * Client-side end-to-end encryption for Hermtica DMs.
 *
 * Scheme (Signal-style, X25519 + AES-256-GCM):
 *   - Every user has a long-term X25519 identity keypair. The public key is
 *     registered on the server; the private key NEVER leaves this device.
 *   - To send: generate a fresh ephemeral X25519 keypair, derive a shared
 *     secret via ECDH(ephemeral_priv, recipient_public), stretch it with HKDF,
 *     and AES-GCM encrypt. Send { ephemeralPublicKey, nonce, ciphertext, tag }.
 *   - To receive: reconstruct the shared secret via ECDH(identity_priv,
 *     sender_ephemeral_public), same HKDF, then AES-GCM decrypt.
 *   - The server only ever sees ciphertext — it holds no key and cannot decrypt.
 *
 * Key recovery uses a 12-word BIP39 mnemonic (128-bit entropy) stretched to a
 * 512-bit seed via PBKDF2; the X25519 scalar is the first 32 bytes.
 */
import { WORDS } from "./words";

// ─── Base64 helpers ──────────────────────────────────────
function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function concat(...arrays: Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

// Standard DER prefix for a 32-byte X25519 private key (RFC 8410). We use this
// to wrap a raw 32-byte scalar into a valid PKCS#8 blob for WebCrypto import.
const X25519_PKCS8_PREFIX = Uint8Array.from([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x04, 0x22, 0x04, 0x20,
]);

// The X25519 basepoint (u = 9) encoded as a little-endian 32-byte public key.
// ECDH(scalar, basepoint) == public key, which lets us derive the public key
// from a private scalar without WebCrypto exposing raw scalar multiplication.
const X25519_BASEPOINT = new Uint8Array(32);
X25519_BASEPOINT[0] = 9;

// HKDF info string — binds derived keys to this exact protocol/version.
const HKDF_INFO = new TextEncoder().encode("hermtica-e2e-dm-v1");

const enc = new TextEncoder();
const dec = new TextDecoder();

// ─── BIP39 mnemonic (12 words, 128-bit entropy) ──────────
function sha256(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return crypto.subtle.digest("SHA-256", data).then((h) => new Uint8Array(h));
}

/** Generate a fresh 12-word recovery mnemonic. */
export function generateMnemonic(): Promise<string> {
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  return entropyToMnemonic(entropy);
}

async function entropyToMnemonic(entropy: Uint8Array<ArrayBuffer>): Promise<string> {
  const hash = await sha256(entropy);
  // 128 bits of entropy + 4 bits of checksum = 132 bits = 12 words × 11 bits.
  let bits = "";
  for (let i = 0; i < entropy.length; i++) bits += entropy[i].toString(2).padStart(8, "0");
  bits += hash[0].toString(2).padStart(8, "0").slice(0, 4);

  const words: string[] = [];
  for (let i = 0; i < 132; i += 11) {
    words.push(WORDS[parseInt(bits.slice(i, i + 11), 2)]);
  }
  return words.join(" ");
}

/** Convert a 12-word mnemonic back to its 16-byte entropy (or null if invalid). */
function mnemonicToEntropy(mnemonic: string): Uint8Array<ArrayBuffer> | null {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  if (words.length !== 12) return null;
  let bits = "";
  for (const w of words) {
    const idx = WORDS.indexOf(w);
    if (idx === -1) return null; // word not in the BIP39 list
    bits += idx.toString(2).padStart(11, "0");
  }
  const entropy = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    entropy[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return entropy;
}

/** BIP39 seed: PBKDF2-HMAC-SHA512(mnemonic, salt="mnemonic", 2048 iterations). */
async function mnemonicToSeed(mnemonic: string): Promise<Uint8Array<ArrayBuffer>> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(mnemonic.normalize("NFKD")),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode("mnemonic"), iterations: 2048, hash: "SHA-512" },
    keyMaterial,
    512
  );
  return new Uint8Array(bits); // 64 bytes
}

// ─── X25519 key handling ─────────────────────────────────
function importPrivateKey(pkcs8b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("pkcs8", fromB64(pkcs8b64), { name: "X25519" }, true, ["deriveBits"]);
}

function importPublicKey(rawB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", fromB64(rawB64), { name: "X25519" }, true, []);
}

/** Derive the X25519 public key from a private key via ECDH against the basepoint. */
async function publicKeyFromPrivate(privateKey: CryptoKey): Promise<string> {
  const basepoint = await crypto.subtle.importKey("raw", X25519_BASEPOINT, { name: "X25519" }, false, []);
  const pub = await crypto.subtle.deriveBits({ name: "X25519", public: basepoint }, privateKey, 256);
  return toB64(pub);
}

// ─── Public API ──────────────────────────────────────────

export interface Identity {
  publicKey: string; // raw 32-byte X25519 public key (base64)
  privateKey: string; // PKCS#8 X25519 private key (base64) — never leaves the device
  mnemonic: string; // 12-word recovery phrase (base64 of nothing; plain words)
}

/** Generate a brand-new identity + recovery mnemonic. */
export async function generateIdentity(): Promise<Identity> {
  const mnemonic = await generateMnemonic();
  return deriveIdentity(mnemonic);
}

/** Rebuild an identity from a 12-word recovery mnemonic. */
export async function recoverIdentity(mnemonic: string): Promise<Omit<Identity, "mnemonic"> | null> {
  const entropy = mnemonicToEntropy(mnemonic);
  if (!entropy) return null;
  const seed = await mnemonicToSeed(mnemonic);
  return seedToIdentity(seed);
}

async function deriveIdentity(mnemonic: string): Promise<Identity> {
  const seed = await mnemonicToSeed(mnemonic);
  const { publicKey, privateKey } = await seedToIdentity(seed);
  return { publicKey, privateKey, mnemonic };
}

async function seedToIdentity(seed: Uint8Array): Promise<{ publicKey: string; privateKey: string }> {
  // First 32 bytes of the BIP39 seed become the X25519 scalar, wrapped in PKCS#8.
  const scalar = seed.slice(0, 32);
  const privateKey = toB64(concat(X25519_PKCS8_PREFIX, scalar));
  const privKey = await importPrivateKey(privateKey);
  const publicKey = await publicKeyFromPrivate(privKey);
  return { publicKey, privateKey };
}

export interface EncryptedMessage {
  ephemeralPublicKey: string;
  nonce: string;
  ciphertext: string;
  tag: string;
}

/**
 * Encrypt a plaintext message for a recipient using a fresh ephemeral key.
 * Only the recipient's PUBLIC key is needed — forward secrecy is provided by
 * the ephemeral keypair, which is discarded after this call.
 */
export async function encryptMessage(plaintext: string, recipientPublicKeyB64: string): Promise<EncryptedMessage> {
  // Fresh ephemeral keypair per message (forward secrecy).
  const eph = (await crypto.subtle.generateKey({ name: "X25519" }, true, ["deriveBits"])) as CryptoKeyPair;
  const ephPub = await crypto.subtle.exportKey("raw", eph.publicKey);
  const ephemeralPublicKey = toB64(ephPub);

  // ECDH: shared = X25519(ephemeral_priv, recipient_pub).
  const recipientPub = await importPublicKey(recipientPublicKeyB64);
  const shared = await crypto.subtle.deriveBits({ name: "X25519", public: recipientPub }, eph.privateKey, 256);

  // Stretch to an AES-256 key via HKDF-SHA256.
  const hkdfKey = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: HKDF_INFO },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, enc.encode(plaintext));
  const combined = new Uint8Array(encrypted); // ciphertext || 16-byte tag
  const ciphertext = combined.slice(0, combined.length - 16);
  const tag = combined.slice(combined.length - 16);

  return {
    ephemeralPublicKey,
    nonce: toB64(nonce),
    ciphertext: toB64(ciphertext),
    tag: toB64(tag),
  };
}

/**
 * Decrypt a received message using my identity private key + the sender's
 * ephemeral public key.
 */
export async function decryptMessage(msg: EncryptedMessage, myPrivateKeyB64: string): Promise<string> {
  const privKey = await importPrivateKey(myPrivateKeyB64);
  const senderEphPub = await importPublicKey(msg.ephemeralPublicKey);

  // Reconstruct the same shared secret the sender derived.
  const shared = await crypto.subtle.deriveBits({ name: "X25519", public: senderEphPub }, privKey, 256);

  const hkdfKey = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: HKDF_INFO },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const combined = concat(fromB64(msg.ciphertext), fromB64(msg.tag));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(msg.nonce) }, aesKey, combined);
  return dec.decode(plain);
}

/** True if this browser supports the WebCrypto primitives DMs need (X25519). */
export function isE2ESupported(): boolean {
  return !!(crypto?.subtle) && "X25519" in (crypto as any);
}
