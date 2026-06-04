#!/usr/bin/env node
// Stdio-to-HTTP bridge for Glama's mcp-proxy wrapper.
// Reads JSON-RPC from stdin, forwards to local HTTP MCP endpoint, writes response to stdout.
// Glama injects mcp-proxy (which expects stdio) before CMD args on HTTP-based MCP servers.

const http = require('http');

const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/api/mcp';

// Start the actual server as a child process
const { spawn } = require('child_process');
const server = spawn('npm', ['start'], {
  stdio: 'inherit',
  env: { ...process.env },
});

// Give server time to start, then begin proxy
setTimeout(() => {
  let buffer = '';

  process.stdin.on('data', (chunk) => {
    buffer += chunk.toString();

    // Try to parse complete JSON-RPC messages
    let newline;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);

      if (!line) continue;

      try {
        const request = JSON.parse(line);
        forwardToHTTP(request);
      } catch {
        // Not valid JSON yet or not a complete message — ignore
      }
    }
  });

  function forwardToHTTP(request) {
    const body = JSON.stringify(request);
    const url = new URL(MCP_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        process.stdout.write(data + '\n');
      });
    });

    req.on('error', (err) => {
      const errorResponse = {
        jsonrpc: '2.0',
        id: request.id || null,
        error: { code: -32603, message: err.message },
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    });

    req.write(body);
    req.end();
  }

  process.stdin.on('end', () => {
    server.kill();
    process.exit(0);
  });
}, 3000); // Wait 3s for Next.js to start
