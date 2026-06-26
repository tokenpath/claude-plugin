---
description: Show your TokenPath token balance and warn if you're running low.
---

Call the `account` tool and report the **available** and **reserved** tokens in one compact line. If available tokens are low (under ~100,000), warn the user and tell them to run `/tokenpath:load-credits` to top up. If it fails for lack of a key, tell the user to run `/tokenpath:setup`. For full account details, see `/tokenpath:account`.
