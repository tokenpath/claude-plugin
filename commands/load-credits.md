---
description: Add tokens to your TokenPath account — shows your balance and where to top up.
---

## Goal

Help the user add TokenPath credits (tokens).

## Steps

1. Call the `account` tool and show the current balance (available + reserved
   tokens). If there is no valid key, tell the user to run `/tokenpath:setup`
   first and stop.
2. Tell the user to top up at **https://platform.tokenpath.ai** — the same
   dashboard where they manage their account. Pricing is pay-as-you-go ($1 per
   1,000,000 attributed tokens, no monthly minimum); the 10,000,000 free signup
   tokens are used first.
3. Offer to call `account` again once they've topped up to confirm the new
   balance.

There is no purchase API in the plugin — topping up happens in the dashboard; this
command just surfaces the balance and the link.
