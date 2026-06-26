---
name: tokenpath
description: Use when running token-level attribution or integrating the TokenPath API — mapping each span of an LLM's output back to the exact source spans that produced it (grounding, hallucination, provenance work). Covers the API contract (resolved spans via POST /v1/attributions, raw token heatmap via POST /v1/attributions/heatmap) and the sparse heatmap → spans rollup. Higher-level usage patterns are published as the TokenPath cookbook.
---

# TokenPath integration

TokenPath answers one question: **for each span of an LLM's output, which exact spans of the source produced it?** It runs *after* generation, on any model's text, measured from attention — not "this paragraph cites this doc" but "these 6 words came from those 9 words."

For normal product integrations, you give it source text, the prompt, the generated answer, and short answer spans to resolve:

- `document` — the source/context (≤ 400,000 chars)
- `question` — the prompt (≤ 10,000 chars)
- `answer` — the LLM output to attribute (≤ 10,000 chars)
- `spans` — answer character ranges to map back to source text

```bash
curl https://api.tokenpath.ai/v1/attributions \
  -H "Authorization: Bearer $TOKENPATH_API_KEY" \
  -d '{"document":"…","question":"…","answer":"…","spans":[[0,12]]}'
```

## When to use this skill

- The user wants **attribution / grounding / provenance** in a product they're building (RAG, Q&A, summarization, agents).
- The user wants to **detect hallucinations** or **prompt injection** in LLM output.
- The user is calling, or wants to call, **`api.tokenpath.ai`** directly.

If TokenPath's MCP server is installed (tools `attribute`, `account`, `usage`), prefer calling `attribute` to run attribution live — it calls the raw heatmap endpoint internally and returns the rolled-up `spans` shape described in [rollup.md](rollup.md), so you don't have to densify the raw heatmap yourself.

## How to navigate this skill

- **[api-reference.md](api-reference.md)** — every endpoint, the request/response shapes, the sparse COO heatmap contract, limits, errors, pricing. Read this before writing any code that hits the API.
- **[rollup.md](rollup.md)** — how to turn the raw sparse heatmap into `answer-span → ranked source-spans` (the densify + best-span algorithm). Read this only if you call `/v1/attributions/heatmap` directly or maintain the MCP rollup code.
- **The TokenPath cookbook** (published at tokenpath.ai) — higher-level usage patterns built on this primitive: grounding/verify, prompt-injection detection, output→context tracing, verified transformation, and wiring attribution into an app. Each is a different way to slice the same `spans` result.

## Adding new use cases

TokenPath is *one* primitive (output span → source span), so most new use cases are just a different way to slice the same `spans` result. New patterns belong in the TokenPath cookbook, not this skill — this skill stays focused on the API contract and the rollup so any code built on the primitive is correct the first time.

## The one thing to get right

The raw heatmap response is a **sparse matrix of token indices**, not text. Almost every mistake comes from mishandling the offsets. Prefer `POST /v1/attributions` or the MCP `attribute` tool when you want text spans directly. If you call `/v1/attributions/heatmap`, follow [rollup.md](rollup.md) exactly — densify in `[answer, document]` orientation, map answer characters → answer tokens → document-token scores, then take the best contiguous document span.
