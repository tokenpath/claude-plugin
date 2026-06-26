---
description: Connect your TokenPath API key (10M free tokens, no card) so attribution works.
argument-hint: "[api_key]"
---

TokenPath plugin root: !`echo "$CLAUDE_PLUGIN_ROOT"`
Provided key argument (may be empty): $ARGUMENTS

## Goal

Make sure the TokenPath MCP tools have a working API key, then confirm the account.

## Steps

1. First call the `account` tool. If it returns an account with a token balance, TokenPath is already set up — report the email and `available_tokens`, then stop.
2. If `account` reports no valid key:
   - If a key was provided in the argument above, use it.
   - Otherwise, tell the user to create a free key at https://platform.tokenpath.ai (10,000,000 free tokens, no card required) and paste it back. Wait for it.
3. Save and validate the key by running this with the Bash tool, substituting the real key and the plugin root printed above:

   `node "<PLUGIN_ROOT>/mcp/src/setkey.js" "<API_KEY>"`

   It writes the key to the shared config (`~/.config/tokenpath/config.json`, mode 600 — the same place the `tp` CLI reads) and prints the authenticated account.
4. Call the `account` tool once more to confirm, and report the balance.

Never print the full API key back to the user; the script masks it.
