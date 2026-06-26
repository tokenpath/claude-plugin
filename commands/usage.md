---
description: Show recent TokenPath usage — your latest attribution/billing events and tokens spent.
argument-hint: "[how many events, default 20]"
---

Count argument (optional): $ARGUMENTS

Call the `usage` tool (pass `limit` from the argument if a number was given,
otherwise use the default). Report a compact, newest-first list of recent
usage/billing events — each with its timestamp, what it was (e.g. an attribution
call), and the tokens/credits it spent — followed by a total for the window shown.

If it fails for lack of a key, tell the user to run `/tokenpath:setup`. To check
the remaining balance, point them at `/tokenpath:credits`.
