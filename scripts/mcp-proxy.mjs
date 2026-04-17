#!/usr/bin/env node
/**
 * Minimal stdio-to-SSE proxy for MCP.
 * Bridges Claude Code (stdio) with a remote MCP SSE server using a Bearer token.
 * No OAuth discovery, no external dependencies — just plain HTTP.
 *
 * Usage: node mcp-proxy.mjs <sse-url> <api-key>
 */
import { createInterface } from 'node:readline';

const SSE_URL = process.argv[2];
const API_KEY = process.argv[3];

if (!SSE_URL || !API_KEY) {
  process.stderr.write('Usage: mcp-proxy.mjs <sse-url> <api-key>\n');
  process.exit(1);
}

const authHeader = `Bearer ${API_KEY}`;
let messageEndpoint = null;
const pendingMessages = [];

// ── Send a JSON-RPC message to the SSE message endpoint ──
async function sendMessage(line) {
  try {
    const res = await fetch(messageEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: line,
    });
    if (!res.ok) {
      process.stderr.write(`POST ${res.status}: ${await res.text()}\n`);
    }
  } catch (err) {
    process.stderr.write(`POST error: ${err.message}\n`);
  }
}

// ── Connect to SSE endpoint ──
const sseRes = await fetch(SSE_URL, {
  headers: {
    'Accept': 'text/event-stream',
    'Authorization': authHeader,
  },
});

if (!sseRes.ok) {
  const body = await sseRes.text();
  process.stderr.write(`SSE connection failed (${sseRes.status}): ${body}\n`);
  process.exit(1);
}

// ── Parse SSE stream ──
const reader = sseRes.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

async function readSSE() {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines
    const parts = buffer.split('\n\n');
    buffer = parts.pop(); // keep incomplete tail

    for (const part of parts) {
      if (!part.trim()) continue;

      let eventType = '';
      let data = '';

      for (const line of part.split('\n')) {
        if (line.startsWith('event:')) eventType = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }

      if (eventType === 'endpoint' && data) {
        // Resolve relative URL against the SSE URL
        messageEndpoint = new URL(data, SSE_URL).href;
        process.stderr.write(`MCP proxy connected: ${messageEndpoint}\n`);

        // Flush any messages that arrived before the endpoint was ready
        for (const msg of pendingMessages) {
          await sendMessage(msg);
        }
        pendingMessages.length = 0;
      } else if (eventType === 'message' && data) {
        // Forward server message to Claude Code via stdout
        process.stdout.write(data + '\n');
      }
    }
  }
}

readSSE().catch((err) => {
  process.stderr.write(`SSE stream error: ${err.message}\n`);
  process.exit(1);
});

// ── Read JSON-RPC from stdin (Claude Code) and forward to server ──
const rl = createInterface({ input: process.stdin, terminal: false });

rl.on('line', async (line) => {
  if (!line.trim()) return;

  if (!messageEndpoint) {
    // Buffer until SSE endpoint is established
    pendingMessages.push(line);
    return;
  }

  await sendMessage(line);
});

rl.on('close', () => {
  process.exit(0);
});
