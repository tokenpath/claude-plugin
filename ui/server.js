#!/usr/bin/env node
/**
 * Local TokenPath playground server.
 *
 * Serves a single-page UI and proxies attribution to api.tokenpath.ai, holding
 * the API key server-side (loaded the same way the MCP server does). Nothing
 * here is exposed publicly — it binds to 127.0.0.1 only.
 *
 *   node ui/server.js            # → http://127.0.0.1:4319
 *   TOKENPATH_UI_PORT=5000 node ui/server.js
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createClient, TokenPathAPIError } from "../mcp/src/client.js";
import { loadCredentials } from "../mcp/src/config.js";
import { runAttribution } from "../mcp/src/attribute.js";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.TOKENPATH_UI_PORT || 4319);
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 4_000_000) reject(new Error("request too large"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) {
      const html = await readFile(join(here, "index.html"), "utf8");
      return send(res, 200, html, { "Content-Type": "text/html; charset=utf-8" });
    }

    if (req.method === "GET" && req.url === "/api/account") {
      const { apiKey, baseUrl } = loadCredentials();
      if (!apiKey) return send(res, 200, JSON.stringify({ connected: false }), JSON_HEADERS);
      try {
        const client = createClient({ apiKey, baseUrl });
        const [me, credits] = await Promise.all([client.me(), client.credits()]);
        return send(res, 200, JSON.stringify({ connected: true, email: me.email, available_tokens: credits.available_tokens }), JSON_HEADERS);
      } catch (err) {
        return send(res, 200, JSON.stringify({ connected: false, error: err?.detail ?? err?.message ?? String(err) }), JSON_HEADERS);
      }
    }

    if (req.method === "GET" && req.url === "/api/prefill") {
      // Written by /tokenpath:playground with the session's latest exchange.
      try {
        const raw = await readFile(join(tmpdir(), "tokenpath", "playground-prefill.json"), "utf8");
        return send(res, 200, raw, JSON_HEADERS);
      } catch {
        return send(res, 200, "{}", JSON_HEADERS);
      }
    }

    if (req.method === "POST" && req.url === "/api/attribute") {
      const { apiKey, baseUrl } = loadCredentials();
      if (!apiKey) {
        return send(res, 401, JSON.stringify({ error: "No API key. Run /tokenpath:setup, then reload." }), JSON_HEADERS);
      }
      const body = await readJson(req);
      const documents =
        Array.isArray(body.documents) && body.documents.length
          ? body.documents
          : [{ doc_id: "document", content: String(body.document ?? "") }];
      if (!body.question || !body.answer) {
        return send(res, 400, JSON.stringify({ error: "question and answer are required." }), JSON_HEADERS);
      }
      try {
        const result = await runAttribution({
          documents,
          question: String(body.question),
          answer: String(body.answer),
          threshold: typeof body.threshold === "number" ? body.threshold : 0.001,
          client: createClient({ apiKey, baseUrl }),
        });
        return send(res, 200, JSON.stringify(result), JSON_HEADERS);
      } catch (err) {
        const status = err instanceof TokenPathAPIError ? err.statusCode : 502;
        return send(res, status, JSON.stringify({ error: err?.detail ?? err?.message ?? String(err), code: err?.code }), JSON_HEADERS);
      }
    }

    send(res, 404, JSON.stringify({ error: "not found" }), JSON_HEADERS);
  } catch (err) {
    send(res, 500, JSON.stringify({ error: String(err?.message ?? err) }), JSON_HEADERS);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`TokenPath playground → http://127.0.0.1:${PORT}`);
});
