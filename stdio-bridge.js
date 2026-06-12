#!/usr/bin/env node
/**
 * stdio-bridge.js — MCP stdio ↔ HTTP bridge for Glama compatibility
 *
 * Glama wraps CMD in `mcp-proxy` which expects MCP JSON-RPC over stdin/stdout.
 * This bridge starts the Next.js HTTP server, then proxies stdin JSON-RPC
 * messages to the HTTP /api/mcp endpoint and writes responses back to stdout.
 *
 * All non-JSON output (Next.js startup logs, etc.) goes to stderr so
 * mcp-proxy sees only clean JSON-RPC on stdout.
 */

const { spawn } = require("child_process");
const readline = require("readline");

const PORT = process.env.PORT || 3000;
const MCP_URL = `http://localhost:${PORT}/api/mcp`;
const STARTUP_TIMEOUT = 60_000; // 60s max for Next.js to compile/start
const POLL_INTERVAL = 500;

// ─── Start Next.js server ──────────────────────────────────

process.stderr.write("[bridge] starting Next.js server...\n");

const server = spawn("npx", ["next", "start"], {
  stdio: ["ignore", "inherit", "inherit"], // stdout/stderr go to our stderr (visible in logs, not on our stdout)
  env: { ...process.env, PORT: String(PORT) },
  shell: true,
});

// ─── Wait for server to be ready ───────────────────────────

async function waitForServer() {
  const deadline = Date.now() + STARTUP_TIMEOUT;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(MCP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "tools/list" }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        process.stderr.write("[bridge] server ready — listening for MCP requests\n");
        return;
      }
    } catch {
      // Server not ready yet — keep polling
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error(`Server failed to start within ${STARTUP_TIMEOUT / 1000}s`);
}

// ─── Proxy stdin → HTTP → stdout ───────────────────────────

const rl = readline.createInterface({ input: process.stdin });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const request = JSON.parse(trimmed);
    const res = await fetch(MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    const json = await res.json();
    process.stdout.write(JSON.stringify(json) + "\n");
  } catch (err) {
    process.stderr.write(`[bridge] error: ${err.message}\n`);
    // Send a JSON-RPC error back so mcp-proxy doesn't hang
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: err.message },
      }) + "\n"
    );
  }
});

// ─── Cleanup ───────────────────────────────────────────────

function cleanup() {
  if (!server.killed) {
    server.kill("SIGTERM");
    // Force kill after 5s
    setTimeout(() => {
      if (!server.killed) server.kill("SIGKILL");
    }, 5000);
  }
}

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

server.on("exit", (code) => {
  process.stderr.write(`[bridge] Next.js server exited (code ${code})\n`);
  if (!process.exitCode) process.exitCode = code || 0;
});

// ─── Go ────────────────────────────────────────────────────

waitForServer()
  .catch((err) => {
    process.stderr.write(`[bridge] fatal: ${err.message}\n`);
    process.exit(1);
  });
