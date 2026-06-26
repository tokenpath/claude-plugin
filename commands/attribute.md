---
description: Run a raw TokenPath attribution — map each span of an answer back to the source spans that produced it, and show the result.
argument-hint: "[files/paths to use as the source documents]"
---

Sources argument (optional): $ARGUMENTS

## Goal

Run the attribution primitive directly and show the raw result: for the answer in
question, which exact source span(s) produced each claim. This is the unjudged
view — no supported/distorted/unsupported verdict (that's the cookbook's `verify`).
Just the mapping.

## Steps

1. **Answer.** Use the most recent substantive answer in this conversation, unless
   the user named specific text to attribute.
2. **Sources.**
   - If files/paths were given in the argument, read each and pass it as one
     document (use the path as `doc_id`).
   - Otherwise, use the source material this turn was based on (the files read to
     produce the answer). List what you're using.
3. **Question.** The user request the answer responded to.
4. **Attribute.** Call the `attribute` tool with `documents` (each source as
   `{ doc_id, content }`), `question`, and `answer`. Pass `top_k` if the user
   wants more than the top source per claim.
5. **Report the raw mapping**, compact:
   - One line per answer span: the claim text, its `support` and `mass`, and its
     top source(s) as `→ <doc_id>: "<mapped quote>"` (weight).
   - List anything in `unsupported` (traces to nothing).
   - Note `meta` (num_claims, api_calls, tokens billed if shown).

Report the mapping as-is — do not grade the claims. For a graded grounding verdict,
point the user at the cookbook's `verify` workflow. Spends tokens.
