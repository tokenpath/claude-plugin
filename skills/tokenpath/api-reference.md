# TokenPath API reference

Base URL: `https://api.tokenpath.ai`. All authenticated calls use a bearer key:
`Authorization: Bearer $TOKENPATH_API_KEY`. Send `X-Request-ID: tp_<uuid>` so
failures are traceable; the same id comes back on errors.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | no | Liveness. Returns `{"status":"ok"}`. |
| GET | `/v1/me` | yes | Current account: `{customer_id, email}`. |
| GET | `/v1/me/credits` | yes | `{customer_id, available_tokens, reserved_tokens}`. |
| GET | `/v1/me/usage?limit=N` | yes | `{events: [...]}`, newest first (limit 1–1000). |
| POST | `/v1/attributions` | yes | Resolve answer spans to source spans. The default call. |
| POST | `/v1/attributions/heatmap` | yes | Return the raw sparse token heatmap for custom rollups/debugging. |

## POST /v1/attributions — resolved spans

Use this endpoint for product integrations. Send short answer character spans and
TokenPath returns the strongest source span for each one.

Request body:

```json
{
  "document": "In Q3, Northwind's revenue grew 18%…",
  "question": "How fast did revenue grow?",
  "answer": "Revenue grew 18% year over year.",
  "spans": [[13, 16]],
  "threshold": 0.001,
  "layer": 17,
  "layer_heads": { "17": [0, 4, 8] }
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `document` | string | yes | The source. 1–400,000 chars. |
| `question` | string | yes | The prompt. 1–10,000 chars. |
| `answer` | string | yes | The output to attribute. 1–10,000 chars. |
| `spans` | array | yes | Answer character ranges to resolve, e.g. `[[13,16]]`. Keep spans short. |
| `threshold` | float | no | Drop heatmap entries below this weight. Default `0.001`, range 0–1. Higher = sparser. |
| `layer` | int | no | Restrict attribution to one decoder layer. |
| `layer_heads` | object/array | no | Select specific layers/heads, e.g. `{"17":[0,4,8]}`. Advanced; omit unless tuning. |

Response:

```json
{
  "spans": [
    {
      "answer": { "start": 13, "end": 16, "text": "18%" },
      "source": {
        "start": 36,
        "end": 39,
        "text": "18%",
        "confidence": 0.78
      }
    }
  ]
}
```

- `confidence` is normalized to `[0, 1]` for thresholding and comparisons across claims.
- `source` can be `null` when TokenPath cannot resolve the answer span.

## POST /v1/attributions/heatmap — raw sparse heatmap

Use this endpoint only when you need the token×token heatmap or you are doing
custom span rollup. The Claude plugin's MCP server uses this endpoint internally,
then converts the sparse matrix to claim spans with [rollup.md](rollup.md).

Request body:

```json
{
  "document": "In Q3, Northwind's revenue grew 18%…",
  "question": "How fast did revenue grow?",
  "answer": "Revenue grew 18% year over year.",
  "threshold": 0.001,
  "layer": 17,
  "layer_heads": { "17": [0, 4, 8] }
}
```

### Response — sparse COO heatmap

Orientation is `[answer, document]`:

```json
{
  "row": [0, 0, 1],
  "col": [6, 7, 7],
  "data": [0.81, 0.92, 0.74],
  "shape": [21, 78],
  "answer_offsets": [[0, 7], [8, 12]],
  "document_offsets": [[0, 2], [3, 5]]
}
```

- `shape` = `[num_answer_tokens, num_document_tokens]`.
- For entry `i`: `row[i]` is the answer-token index, `col[i]` the document-token index, `data[i]` the attribution weight.
- `answer_offsets[k]` / `document_offsets[k]` are `[charStart, charEnd]` for token `k` — your bridge from token indices back to text.

To use it, see [rollup.md](rollup.md). It is a **sum** of cleaned attention across the selected layers/heads, so weights are not normalized to 1 — compare them relatively, not as probabilities.

## Errors

Failures return an HTTP 4xx/5xx with:

```json
{ "error": { "code": "…", "message": "…", "request_id": "tp_…", "details": {…} } }
```

| Status | Meaning | Handle by |
| --- | --- | --- |
| 401 / 403 | Missing/invalid/insufficient key | Re-run `/tp:setup`; check the key + scopes. |
| 402 | Out of token credits | Top up; `available_tokens` is exhausted. |
| 429 | Rate limited | Back off; honor the `Retry-After` header. |
| 400 / 422 | Validation (too long, empty field) | Check the size caps above. |

## Limits, model, pricing

- Model: `meta-llama/Meta-Llama-3.1-8B-Instruct`, 128k-token context. Attribution reads *this* model's attention regardless of which model produced the `answer`.
- Caps: document 400k chars, question/answer 10k chars each. For larger sources, attribute per-document/chunk and merge (the MCP server does this automatically).
- Pricing: $1 per 1,000,000 attributed tokens, pay as you go, 10,000,000 free tokens on signup, no monthly minimum. Billing reconciles against the real tokenizer count at settlement.
