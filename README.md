# TokenPath plugin for Claude Code

Token-level **attribution** for any LLM output, inside Claude Code. Trace every
claim an answer makes back to the exact source span behind it — to check
grounding, catch hallucinations, spot prompt injection, or wire attribution into
an app you're building. Powered by the TokenPath API (`api.tokenpath.ai`).

> Attribution runs *after* generation on plain text (document + question +
> answer), so it works on output from any model — including Claude's own.

## What's inside

| Component | What it does |
| --- | --- |
| MCP server `tokenpath` | Tools `attribute`, `account`, `usage`. `attribute` returns answer-span → ranked source-spans (not raw matrices). |
| Skill `tokenpath` | Makes Claude fluent in the API — the contract and the heatmap→spans rollup. |
| `/tokenpath:attribute` | Run a raw attribution and show the mapping: each answer span → the source span(s) that produced it. |
| `/tokenpath:playground` | Launch a local web UI to explore document → question → output with attribution wired up. |
| `/tokenpath:setup` | Connect your API key (10M free tokens, no card) and validate it. |
| `/tokenpath:account` | Show account details — connected email, customer id, and token balance. |
| `/tokenpath:credits` | Show your token balance and warn if you're running low. |
| `/tokenpath:usage` | Show recent usage — latest attribution events and tokens spent. |
| `/tokenpath:load-credits` | Add tokens — shows your balance and where to top up. |

> The higher-level workflows — grounding **verify**, prompt-**injection** checks,
> output→context **trace**, verified **transform**, and **integrate**-into-your-app —
> plus the recipe library are published as the **TokenPath cookbook** at
> [tokenpath.ai](https://tokenpath.ai). This plugin is just the primitive.

## Requirements

- Node.js 18+ (the MCP server uses the built-in `fetch`).
- Install the server's dependencies once: `cd mcp && npm install`.

## Install

```
/plugin marketplace add tokenpath/claude-plugin
/plugin install tokenpath@tokenpath
```

Then reload so the MCP server starts, and run:

```
/tokenpath:setup
```

Get a free key at https://platform.tokenpath.ai (10,000,000 tokens, no card). The
key is stored at `~/.config/tokenpath/config.json` (mode 600) — the same place
the `tp` CLI reads, so the two share credentials. You can also just export
`TOKENPATH_API_KEY` in your environment.

## Try it

Ask Claude a question over some files, then:

```
/tokenpath:attribute path/to/source1 path/to/source2
```

You'll get each claim in the answer mapped back to the source span(s) that
produced it. For a graded grounding report (supported / distorted / unsupported),
see the `verify` recipe in the [TokenPath cookbook](https://tokenpath.ai).

## Development

```
cd mcp
npm install                # only the MCP server needs deps; the UI doesn't
npm run check              # syntax-check every module
node test/smoke.mjs        # boot the server, list tools (no network)
node test/rollup.test.mjs  # exercise the heatmap→spans rollup (no network)
node test/live.mjs         # one real attribution against the API (needs a key)
```

Source layout:

```
.claude-plugin/
  plugin.json        manifest + bundled MCP server declaration
  marketplace.json   local marketplace entry (source ".")
mcp/src/
  index.js           MCP server: registers attribute / account / usage
  client.js          HTTP client for api.tokenpath.ai
  config.js          credential resolution (env + shared CLI config)
  setkey.js          /tokenpath:setup helper — save + validate a key
  attribute.js       orchestration: pack docs under the size cap, call, merge
  rollup.js          sparse COO heatmap → per-claim source spans
  segment.js         split an answer into claim-sized spans
  docs.js            combine documents; map a span back to its source doc
ui/
  server.js          local web server (proxies to the API, holds the key)
  index.html         the playground UI (vanilla JS, no build step)
skills/tokenpath/    SKILL.md + api-reference.md + rollup.md (the API contract)
commands/            attribute, playground, setup, account, credits, usage, load-credits
docs/                ARCHITECTURE.md — the full, file-by-file reference
```

The higher-level workflows and recipes are maintained separately as the TokenPath cookbook.

**For the complete, detailed reference of everything in this plugin — every file,
the data flow, the rollup algorithm, the hooks, the UI, how to extend it — see
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).**

## Notes

- `support` on each claim is **relative to the strongest claim in the same
  answer** — a signal, not a probability. Grading a claim supported / distorted /
  unsupported is a second stage (the cookbook's `verify` workflow and
  `grounding-checker` agent do that read).
- Large sources (over the 400k-char API cap) are automatically split across
  several attribution calls and merged.
- The **UI** has no external dependencies (Node 18+ only). Only the MCP server
  needs `npm install`. Distribution beyond local testing needs those deps bundled
  or published so users don't `npm install` themselves.
