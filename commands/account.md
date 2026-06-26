---
description: Show your TokenPath account details — connected email, customer id, and token balance.
---

Call the `account` tool and report, in a compact block:

- **Email** and **customer id** — who the API key is connected to.
- **Available tokens** and **reserved tokens** — the current balance.
- The API base URL, only if it is non-default.

If it fails for lack of a key, tell the user to run `/tokenpath:setup`. To add more
tokens, point them at `/tokenpath:load-credits`. Never print the API key.
