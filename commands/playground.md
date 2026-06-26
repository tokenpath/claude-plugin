---
description: Launch the local TokenPath attribution playground, prefilled with your latest Claude Code exchange (document, question, answer).
---

TokenPath plugin root: !`echo "$CLAUDE_PLUGIN_ROOT"`
Temp dir: !`node -e 'console.log(require("os").tmpdir())'`

## Goal

Open the local playground web UI **prefilled with the most recent exchange in
THIS Claude Code session** — the source you were working over, the user's
question, and your answer — so the user sees attribution on real content, not a
canned sample.

## Steps

1. Assemble the latest exchange from this conversation:
   - `document` — the source material this turn was based on (the files you read
     / the content in play). Concatenate the relevant sources into one string; if
     there were several files, separate them with a clear `===== <path> =====`
     header line each.
   - `question` — the user's most recent substantive request.
   - `answer` — your most recent substantive answer.
   Keep each within the API caps (document ≤ 400k chars, question/answer ≤ 10k).
2. Write them as JSON to the prefill file (create the `tokenpath` dir first):
   `<TEMP_DIR>/tokenpath/playground-prefill.json` with shape
   `{ "document": "...", "question": "...", "answer": "..." }`.
   If you genuinely can't identify a meaningful exchange, skip this step — the UI
   falls back to a built-in sample.
3. Start the server in the **background** (no external deps, Node 18+):
   `node "<PLUGIN_ROOT>/ui/server.js"` (override the port with `TOKENPATH_UI_PORT`).
4. Tell the user to open **http://127.0.0.1:4319** — it's prefilled with this
   session's document / question / answer; they click "Run attribution" (each run
   spends a few tokens). Nothing is sent to the API until they click Run. If no
   key is connected, the UI shows a banner → `/tokenpath:setup`.
5. It keeps running until they stop that background process.
