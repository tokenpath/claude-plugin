# From sparse heatmap to source spans

The API returns token indices and weights. To get *"this claim → that source
text"* you densify and roll up. If you call the `tokenpath_attribute` MCP tool
this is already done for you (it returns the `spans` shape at the bottom). Do
this yourself only when integrating the raw HTTP API.

## Algorithm

1. **Densify in `[answer, document]` orientation.** Build per-answer-token rows
   from the sparse triples; for entry `i`, weight `data[i]` belongs at
   `(row[i] = answer token, col[i] = document token)`.

2. **Segment the answer into claims.** Split on sentence enders (`. ! ?` at a
   whitespace/EOL boundary) and newlines. Keep each claim's `[charStart,
   charEnd)`.

3. **Map a claim's characters to answer tokens.** A token at
   `answer_offsets[k] = [s, e]` belongs to the claim when `e > charStart && s <
   charEnd`.

4. **Score document tokens for the claim.** For document token `d`, sum the
   weights from every answer token in the claim. The claim's total **support
   mass** is the sum of those scores.

5. **Pick the best contiguous source span.** Run Kadane's max-subarray over the
   per-document-token scores with a small length penalty (≈ `0.001` per token)
   so the span tightens onto the strong region. Map the winning token range back
   to characters via `document_offsets`, then expand to word boundaries so it
   reads cleanly. Repeat (zeroing the chosen run) for a second/third span.

6. **Score it.** `support` is the claim's mass normalized by the strongest
   claim's mass in the same answer — a *relative* signal in `[0, 1]`, not a
   probability. A claim whose mass is ≈ 0 traced back to nothing: likely
   fabricated.

## Reference implementation

If the TokenPath MCP server is installed, the `attribute` tool already performs
this entire rollup (steps 2–6) and returns the `spans` shape below — call it
instead of re-implementing. Write your own only when you're calling the raw HTTP
heatmap endpoint directly from your application code.

## Rolled-up shape

```json
{
  "spans": [
    {
      "answer_text": "Revenue grew 18% year over year.",
      "answer_range": [0, 32],
      "support": 0.91,
      "grounded": true,
      "mass": 4.12,
      "sources": [
        { "doc_id": "q3-note", "text": "revenue grew 18%", "start": 9, "end": 25, "weight": 3.8 }
      ]
    }
  ],
  "unsupported": [],
  "meta": { "num_claims": 1, "api_calls": 1, "note": "support is relative; confirm with a verifier." }
}
```
