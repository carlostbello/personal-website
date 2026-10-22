# Design rules

The site is drawn in the visual language of Carlos's cartoon avatar: a comic
book, not a SaaS landing page. Every new page or component gets checked
against this file before it ships.

## The system

| Token | Value | Source |
| --- | --- | --- |
| `--field` | `#3b5a8c` | The avatar's background blue. Page background. |
| `--ink` | `#0b0b0c` | The avatar's line work. Borders, drawings, text on white. |
| `--accent` | `#f3b53f` | Marigold, the classic comic yellow on blue. The single loud color: lettering, caption boxes, one panel per row at most. |
| `--page` | `#ffffff` | Panels and balloons. Comic white, never cream. |

- **Lettering** (`Bowlby One`, marigold with an ink outline): page titles and section heads only.
- **Hand** (`Patrick Hand`): speech balloons, caption boxes, dates. Never body text.
- **Body** (`Atkinson Hyperlegible Next`): everything you read. Designed for low-vision legibility.
- **Mono** (`Atkinson Hyperlegible Mono`): code only.

Building blocks: `.panel` (white box with boiling ink border), `.caption` (marigold
box in a panel's corner), `.balloon` (speech), `.lettering`, and ink drawings
with `data-ink` that draw themselves on scroll.

## Motion rules

Every animation must have a job. Current jobs:

1. **Stamp**: titles land like comic sound effects, once, on load.
2. **Rise / pop**: the avatar rises onto the hero floor; balloons pop from their tail.
3. **Boil**: ink borders shimmer at ~8fps like hand-drawn animation. Decorative ink only, never text.
4. **Ink-in**: drawings draw their strokes when they first scroll into view.
5. **Narrator**: the corner avatar comments on the section in view. Click to poke him.
6. **Lean**: the hero avatar tilts toward the pointer (fine pointers only).
7. **Panel wipe**: page navigation wipes like turning to the next panel.
8. **Reading progress**: marigold bar on posts, scroll-driven CSS.

All of it switches off under `prefers-reduced-motion`. The page must make
complete sense with no JavaScript.

## Slop audit

Run this before approving any design change. It covers the generic AI tells and
the model-specific defaults, including the ones Claude falls back on when told
to avoid generic design.

**Never**
- Cream/paper backgrounds, italic serif accent words, uppercase letter-spaced mono labels, hairline rules, terracotta accents (the Claude editorial kit).
- Purple/blue/indigo gradients, Inter, zinc-950 dark mode, shadcn-default cards (the v0/GPT kit).
- Glassmorphism, gradient blobs, gradient text, sparkle icons, Lucide icons on every item.
- Centered hero with gradient headline and two buttons. Typed-text heroes. Fake terminals.
- Bento grids, identical three-card rows, tech-stack logo walls, "trusted by" rows, testimonial carousels.
- Fade-up on every element, `hover:scale` on every card, parallax for its own sake, scroll hijacking, cursor glows, custom cursors.
- Second-order defaults: neo-brutalist hard offset shadows, grain overlays, CRT green, Y2K chrome, marquee tickers, sticker/tape collage, numbered "01 /" section labels.
- "Available for work" dots, "Currently building" pills, version badges, "© Built with ♥" footers, "scroll ↓" hints, live dots on static content.

**Ask of every mockup**
- Could this belong to someone else if the name changed? If yes, it is not done.
- Does every color trace back to the avatar or a real object?
- Can you point at three things that come from Carlos's actual life or work?
- Does every motion explain, respond or reveal something?
- Does it work on a phone, with a keyboard, with motion reduced, without JS?

## Copy rules

`npm run lint:copy` flags machine-sounding vocabulary, "not X but Y" framing,
stock openers and leftover `TK` placeholders. `npm run deploy` runs it in
strict mode, so placeholders cannot ship. Beyond the linter: name real things
(machines, venues, numbers), keep opinions, vary sentence length.
