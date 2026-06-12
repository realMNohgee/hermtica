#!/usr/bin/env node
// Stdio-to-HTTP bridge for Glama's mcp-proxy wrapper.
// Reads JSON-RPC from stdin, forwards to local HTTP MCP endpoint, writes response to stdout.
// Handles MCP initialize + notifications/initialized locally (pinned commit workaround).

const http = require('http');

const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/api/mcp';

// Start the actual server as a child process
const { spawn } = require('child_process');
const server = spawn('npm', ['start'], {
  stdio: 'inherit',
  env: { ...process.env },
});

// Give server time to start, then begin proxy
const STARTUP_DELAY = parseInt(process.env.BRIDGE_STARTUP_DELAY || '3000', 10);

setTimeout(() => {
  process.stderr.write(`[bridge] MCP stdio→HTTP proxy ready (${MCP_URL})\n`);
  let buffer = '';

  process.stdin.on('data', (chunk) => {
    buffer += chunk.toString();

    let newline;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);

      if (!line) continue;

      try {
        const request = JSON.parse(line);

        // Handle initialize locally (pinned commit may not have this handler)
        if (request.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: request.id != null ? request.id : 0,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: { name: 'Hermtica', version: '1.0.0' },
              capabilities: { tools: {} },
            },
          };
          process.stdout.write(JSON.stringify(response) + '\n');
          continue;
        }

        // Handle notifications/initialized locally (no response needed)
        if (request.method === 'notifications/initialized') {
          // Notification — no response
          continue;
        }

        forwardToHTTP(request);
      } catch {
        // Not valid JSON yet — ignore
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
}, STARTUP_DELAY);
