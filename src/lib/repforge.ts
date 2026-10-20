import { createPublicKey, verify } from "crypto";
import type { RepClaim } from "@/lib/types";

// Ed25519 SubjectPublicKeyInfo prefix: wraps a raw 32-byte public key so
// Node's built-in crypto can load it (no new dependency). RepForge stores
// the raw 32-byte key as lowercase hex.
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

// Replicates Python's json.dumps(obj, sort_keys=True, separators=(",", ":"),
// ensure_ascii=True) so we reconstruct the EXACT bytes RepForge signed.
// The claim carries only strings and ints (RepForge pins score/vouch_weight
// as fixed-decimal strings), so no float formatting ambiguity exists.
function pyEscapeString(s: string): string {
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const cp = s.charCodeAt(i);
    switch (ch) {
      case '"': out += '\\"'; break;
      case '\\': out += '\\\\'; break;
      case '\b': out += '\\b'; break;
      case '\f': out += '\\f'; break;
      case '\n': out += '\\n'; break;
      case '\r': out += '\\r'; break;
      case '\t': out += '\\t'; break;
      default:
        if (cp < 0x20 || cp >= 0x80) out += '\\u' + cp.toString(16).padStart(4, '0');
        else out += ch;
    }
  }
  return out + '"';
}

function canonicalJson(obj: unknown): string {
  if (obj === null) return "null";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "string") return pyEscapeString(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalJson).join(",") + "]";
  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return "{" + keys.map((k) => pyEscapeString(k) + ":" + canonicalJson(record[k])).join(",") + "}";
  }
  return "null";
}

function verifyEd25519(message: Buffer, sigB64: string, pubkeyHex: string): boolean {
  const pub = Buffer.from(pubkeyHex, "hex");
  if (pub.length !== 32) return false;
  try {
    const spki = Buffer.concat([SPKI_PREFIX, pub]);
    const key = createPublicKey({ key: spki, format: "der", type: "spki" });
    return verify(null, message, key, Buffer.from(sigB64, "base64"));
  } catch {
    return false;
  }
}

// Parse a stored rep claim (JSON string) and verify its Ed25519 signature.
// Returns a structured claim with `valid: true` when the signature checks out,
// or `valid: false` when the claim is malformed or was tampered with.
export function verifyRepClaim(repJson: string | null | undefined): RepClaim | null {
  if (!repJson) return null;
  let claim: Record<string, unknown>;
  try {
    claim = JSON.parse(repJson);
  } catch {
    return null;
  }

  const pubkey = String(claim.pubkey ?? "");
  const sig = String(claim.sig ?? "");
  if (!pubkey || !sig) return null;

  const { sig: _sig, ...rest } = claim;
  const canonical = canonicalJson(rest);
  const valid = verifyEd25519(Buffer.from(canonical, "utf8"), sig, pubkey);

  const rep = (claim.rep ?? {}) as Record<string, unknown>;
  return {
    agentId: String(claim.agent_id ?? ""),
    name: String(claim.name ?? ""),
    pubkey,
    score: parseFloat(String(rep.score ?? "0")),
    tier: String(rep.tier ?? "Unproven"),
    totalTasks: Number(rep.total_tasks ?? 0),
    successes: Number(rep.successes ?? 0),
    failures: Number(rep.failures ?? 0),
    vouchedBy: Number(rep.vouched_by ?? 0),
    vouchedFor: Number(rep.vouched_for ?? 0),
    issued: String(claim.issued ?? ""),
    valid,
  };
}
