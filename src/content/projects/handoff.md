---
title: Handoff
blurb: Hand an opencode session from a laptop to a machine running T3 Code and get the commits back, over an end-to-end encrypted relay.
year: 2026
size: wide
order: 1
demo: handoff
links:
  - label: Source
    href: https://github.com/carlostbello/handoff
---

Heavy coding-agent runs chew through laptop battery and lock up a local machine. Handoff moves that work to a bigger host in my homelab without breaking my terminal flow.

One `/handoff` command in opencode snapshots the dirty files, packages a brief for the agent, and sends an encrypted payload through a relay to a machine running T3 Code. The remote thread works on its own branch, runs tests, and sends the resulting commits back into the original session.
