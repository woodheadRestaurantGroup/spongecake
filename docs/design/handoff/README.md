# Handoff: Spongecake visual redesign (app, desktop, print, emails)

## Overview
Spongecake is Woodhead Restaurant Group's internal recipe database: one instance per restaurant on its own subdomain, used mostly by chefs on iPhones (saved to the home screen) during prep and service, with editors writing in Payload on desktop. This package is a full visual pass: tokens, phone screens, desktop layout, cook mode, print sheet and three transactional emails. The product is already built with placeholder styling; this is a restyle plus a few new UI pieces (cook mode, favourites, history row, print view, welcome + suggestion emails).

## About the design files
Files in `designs/` are **design references built in HTML** — working prototypes showing intended look and behaviour, not production code. Recreate them in the existing Spongecake codebase (Next.js / React + Tailwind CSS 4 + Payload) using its components and patterns. Don't copy the prototype markup or its runtime (`support.js`, `.dc.html` format). Open any `.dc.html` file directly in a browser to see and click through it (keep the folder intact so relative files load).

- `designs/Spongecake Direction.dc.html` — overview board: three live phones, two desktop views, token summary. **Start here.**
- `designs/Spongecake App.dc.html` — the phone prototype (all mobile screens). Logic class at the bottom holds exact data/behaviour.
- `designs/Spongecake Desktop.dc.html` — desktop two-pane layout.
- `designs/Spongecake Print.dc.html` — A4 text-only print sheet.
- `designs/Spongecake Emails.dc.html` — email board (light/dark + lock-screen notification).
- `designs/emails/*.html|.txt` — **send-ready** email HTML and plain text. These *are* close to production: swap hard-coded values for template variables.
- `tokens.css` — Tailwind 4 `@theme` token set, light + dark. Drop in.
- `avatar.ts` — seeded avatar generator (SVG). Drop in.

## Fidelity
**High fidelity.** Colours, type, spacing, radii, copy and motion are final. Reproduce pixel-accurately with Tailwind utilities mapped to `tokens.css`. Copy text in the prototypes is final unless it is obviously sample data (recipes, names).

---

## Design tokens
All in `tokens.css`. Summary:

| Token | Light | Dark | Use |
|---|---|---|---|
| bg | #F6F5F2 | #121211 | page |
| surface | #FFFFFF | #1C1B19 | cards, inputs, sheets |
| surface-2 | #EEECE7 | #282623 | stepper buttons, notes callout, tag pills, pressed rows, secondary buttons |
| ink | #1A1917 | #F3F1EC | text; primary button background |
| ink-2 | #57534D | #ADA9A1 | secondary text, labels |
| ink-3 | #8C877F | #7A766F | icons, chevrons, placeholders, non-scaling "—" |
| line | #E2DFD8 | #33312D | all borders/dividers |
| danger | #B3261E | #F2877C | errors, sign out |
| accent | site colour (QCH #8B2D2D) | `color-mix(in oklch, accent 60%, white)` | see below |
| accent-soft | `color-mix(in srgb, accent 12%, transparent)` | same formula | active chip/multiplier fill |

**Accent rule (keep it subtle).** The accent appears ONLY on: logo tile background (white initial on top), active tag chip + active multiplier (accent-soft fill, 1.5px accent border, accent text), scaled quantities and scaled yield number, favourite heart (filled), cook-mode progress bar + checked boxes + "Screen on" dot, expired-link notice dot. Never on large surfaces, body text, headers, or primary buttons. The old coloured top border is removed. Primary buttons are `ink` on `bg` (they invert in dark).

**Type:** IBM Plex Sans, weights 400 and 600 only (self-host the variable font, `font-display: swap`, system fallback). Chosen because 1 / l / I are distinct ("1 l" reads correctly) and it has tabular figures. Use `font-variant-numeric: tabular-nums` on every quantity, yield, code, step number.

| Role | Size / line-height | Weight | Tracking |
|---|---|---|---|
| Recipe title (phone) | 30 / 1.15 | 600 | -0.015em |
| Recipe title (desktop) | 40 / 1.1 | 600 | -0.02em |
| Auth headline / site name | 28 / 1.15 | 600 | -0.01em |
| Section heading (Ingredients, Method) | 22 | 600 | -0.01em |
| Cook-mode step | 22 / 1.45 | 400, lead 600 | — |
| Ingredient line, method step | 18 / 1.4–1.5 | 400; qty 600 | — |
| Header site name | 18 | 600 | — |
| Card title | 17 / 1.3 | 600 | — |
| Body / inputs | 16–18 | 400 | — |
| Meta, captions | 14 | 400 | — |
| Label (section labels, "RECENTLY VIEWED") | 13 | 600 | 0.06em, uppercase |
| Wordmark "SPONGECAKE" | 13 | 600 | 0.08em, uppercase |

**Radii:** 8 (sub-recipe pill), 10 (multipliers, 36px logo tile, thumbnails), 12 (steppers, secondary buttons, code boxes), 14 (cards, grouped lists, inputs, primary button), 16 (scaler card, 64px logo tile, cook step cards), 28 (bottom sheet top corners), full (chips, tag pills, Admin pill, avatars).

**Elevation:** none. 1px `line` borders on cards; 1.5px borders on inputs, chips, multipliers, secondary buttons. No shadows except the segmented control's active segment (`0 0 0 1px line`) and cook current step (`0 0 0 1.5px line`).

**Spacing:** 4px grid. Page gutter 16. Between recipe blocks 22–36 (scaler mt 22, Ingredients heading mt 32, Method heading mt 36). List rows: 12–14 vertical padding, min-height 72 for recipe rows, 60 for profile rows.

**Touch targets:** 44 minimum everywhere; search 48; inputs, steppers, primary button 56; cook mode bottom buttons 60, exit 48.

**Motion** (all `cubic-bezier(0.32, 0.72, 0, 1)`):
- Screen push: 300ms `transform`. Incoming slides from `translateX(100%)` to 0; outgoing parallaxes to `translateX(-28%)`. Back reverses. Use View Transitions API or a transform-based router transition; no fades, no spinners between screens (data is local).
- Cook mode: 320ms slide up from `translateY(100%)`.
- Bottom sheet: 300ms from `translateY(105%)`; scrim `rgba(0,0,0,.4)` opacity 220ms.
- Press feedback: 90ms `scale(.94–.98)` on `:active`; list rows get `surface-2` background on active. No hover-only states on mobile.
- State changes (chip/multiplier/quantity colour): 120–160ms.
- Respect `prefers-reduced-motion`: replace transforms with instant swap.

---

## Screens (phone, 390pt wide)

### App header (home)
Sticky, `bg` background, padding-top = safe area. Row 48 tall, 16 gutter, gap 12: logo tile 36×36 r10 accent bg / white initial 17/600 → site name 18/600 ellipsis (flex 1) → Admin pill (editors only: h32, px12, 1.5px line border, 14/600) → avatar 34 in a 44 hit area (opens Profile). Below: search field, then chips.

### Search + chips
Search: h48, r14, surface, 1.5px line border, 20px search icon ink-2 at left 14, placeholder "Recipes, ingredients, chefs" 17px, clear button (20px ink-3 circle with ×) when non-empty. Chips row: horizontal scroll, 8 gap, padding 10 16 0, right-edge fade `mask-image: linear-gradient(to right, #000 82%, transparent)`. Chip: h40, px16, r-full, 15/600, default surface bg + 1.5px line border + ink text; active = accent-soft / accent border / accent text. Tapping an active chip clears it.

### Home (06, 15, 18)
Answer to the brief's questions: **grouped lists are the default** (fast to scan, scale to 100 recipes); a horizontal rail is used only for **Recently viewed** (and Favourites when built — same rail).
- Section label row: padding 26 16 10, label style, right-aligned count 14/400.
- Recently viewed rail: cards 164 wide, min-h 96, p14, r14, surface, 1px line; title 16/600 (2 lines), "Viewed 20 min ago" 13 ink-2.
- Grouped list: margin 0 16, r14, surface, 1px line, overflow hidden. Row: full-width button, gap 12, padding 12 8 12 14, min-h 72, divider 1px line between rows. Optional thumbnail 52×52 r10 left. Title 17/600; meta row gap 6: avatar 18 + "Name · Tag, Tag" 14 ink-2 ellipsis. Chevron 20 ink-3 right.
- Empty new site (not mocked): same label style "No recipes yet", body 16 ink-2 "Editors can add recipes in Admin.", editors get secondary button "Open Admin".

### Search results / tag filter / no results (07–09)
When query or tag active, sections are replaced by one label "N recipes" and a single grouped list. Matching is on-device across title, tags, chef name, ingredient names. If matched only by ingredient, add a third line: "Contains **beef dripping**" 14 ink-2/ink. No results: centred, padding 56 32: "Nothing for “query”" 20/600, "Try an ingredient, a tag or a chef’s name." 16 ink-2, secondary button "Clear search" (h44, surface-2, r12, 15/600) clears query and tag.

### Recipe (10–14, 19)
- **Top bar** sticky: back button (chevron + "Recipes", or the parent recipe's first word when inside a sub-recipe) left; title 16/600 fades in centred once title scrolls off (opacity 150ms, threshold ~90px); right: "Edit" text button (editors), heart 44×44 (outline ink → filled accent).
- Draft badge (editor preview only): h26, px10, r-full, 1.5px **dashed** ink-3 border, 12/600 uppercase 0.06em "DRAFT", above title, mb10.
- Title 30/600. Author line mt12: avatar 24, name 15/600, "· Updated 2 days ago" ink-2. Tag pills mt12: h28 px10 r-full surface-2 13/600 ink-2.
- Hero photo (when present): mt18, full-width, aspect 4:3, r16. No photo = nothing (design is complete without).
- **Scaler** card mt22: p12, r16, surface, 1px line.
  - Row: − button 56×56 r12 surface-2 (22px icon, 2.4 stroke) · centre column: number input 32/600 tabular, centred, borderless, colour ink (accent when scaled); unit label 14 ink-2 under it · + button.
  - Multipliers mt10: 4-col grid gap 6: ½× 1× 2× 3×, h44 r10 16/600, default transparent + 1.5px line border; active = accent-soft/accent/accent.
  - Caption row mt8 min-h36: "Base recipe · 12 portions" or "Scaled ×2 from 12 portions" 14 ink-2; "Reset" text button 14/600 right when scaled.
  - Steppers move by a per-recipe step (portions 1, litres 0.5, grams 50, large batches 5). Quantities never round to whole units: round to 2 dp, trim trailing zeros (`String(Math.round(x*100)/100)`).
- **Ingredients**: heading 22/600 mt32. Each section: label (13/600 uppercase ink-2) mt18. Row = grid `96px 1fr auto`, column-gap 14, baseline aligned, padding 13 0, bottom 1px line.
  - Quantity column: right-aligned, 18/600 tabular, no wrap, "3 kg" (value + space + unit). Ink at 1×, **accent when scaled** (160ms colour transition) — answers "how do I know these are scaled".
  - Name 18/400 ink, note ", peeled" ink-2 in the same line. Quantity and name are the same size; weight carries the quantity.
  - Non-scaling item: qty "—" in ink-3; when scaled, right column shows "NOT SCALED" 12/600 uppercase 0.04em ink-2.
  - **Sub-recipe**: the entire row is tappable; right column shows a pill h30 r8 surface-2 "Recipe ›" 13/600. No accent, no underline — it reads as an app affordance. Pushes the sub-recipe (back returns to parent).
- **Method**: heading 22/600 mt36. Step: flex gap 14, padding 14 0. Number in a 32px circle, 1.5px line border, 15/600 ink-2. Text 18/1.5; bold runs 600; italics as italics; inline links underlined ink (not accent). Step image: mt12, aspect 16:10, r12, full text-column width.
- **Notes callout**: mt20, p16, r14, surface-2. "CHEF’S NOTE" label then 17/1.5 body.
- **History row** (new): mt20, full-width button, min-h52, top+bottom 1px line, clock icon 18, "History · 3 versions, last by Tom 2 days ago" 15 ink-2, chevron rotates 90° when open (180ms). Expanded list: rows avatar 24 + "**Name** · when" / change note, 15/1.4. (Tapping a version → field-level diff: not mocked; use same quiet styling, removed text struck-through ink-3, added text with accent-soft background.)
- "Suggest an edit": secondary button full width h52 r14 1.5px line, 16/600.
- **Sticky bottom bar**: padding 12 16 + safe-area, bg, top 1px line; primary button "Cook mode" h56 r14 ink/bg 18/600 with phone icon.

### Cook mode (new)
Full-screen overlay. Wake Lock API on enter, release on exit.
- Header (below safe area): exit button 48×48 r-full surface-2 with × → title 16/600 + yield "24 portions · ×2" 14 ink-2 → "● Screen on" 13 ink-2 with 7px accent dot.
- Progress: 4px track line r2, fill accent, width = done/total, 220ms; "Step 2 of 6" 14/600 ink-2 (or "All steps done").
- Steps list: gap 6, padding 4 12. Step card = full-width button, padding 18 14, r16: checkbox 32×32 r9 2px border ink-3 (checked: accent fill/border, white check) · "STEP n" label + text 22/1.45. Current step (first unchecked) = surface bg + `0 0 0 1.5px line` ring; done steps opacity .45. Tap toggles.
- Bottom bar: padding 10 16 + safe area, top 1px line, two buttons gap 10, h60 r16 18/600: "Ingredients" (surface, 1.5px line) opens sheet; "Done, next" (ink/bg) checks current step and smooth-scrolls next into view; becomes "Finish" (exits) when all done.
- Ingredients sheet: height 72%, surface, r28 top, grabber 40×5 line; "Ingredients" 22/600 + yield right; rows like recipe but 20px and qty column 104px. Scrim tap / grabber closes.

### Profile (17, 20)
Back "Recipes". Centred avatar 72, name 24/600 mt14, email 15 ink-2. "SITES" label → grouped list rows min-h60: site logo tile 30 r8 (each site's own accent) + name 16/600 + role 14 ink-2. "APPEARANCE" → segmented control: track p4 r14 surface-2, 3-col gap 4, segments h44 r10 15/600; active surface + 1px line ring, ink; inactive ink-2. Light / Dark / System, applies instantly. Then grouped list: "Add to Home Screen ›" (opens install guide), "Sign out" 16/600 danger. Footer "Spongecake · Woodhead Restaurant Group" 13 ink-2.

### Sign in (01, 02)
Padding 132 24 48, column. Logo tile 64 r16 accent / white initial 30/600 → "SPONGECAKE" wordmark mt20 → site name 28/600 mt4 → body 17/1.45 ink-2 mt40 "Sign in with your work email. We’ll send you a six-digit code — no password." → (expired variant) notice mt16: p12 14, r12, surface-2, 8px accent dot + "That sign-in link has expired. Enter your email for a fresh code." 15 → "Work email" 15/600 mt24 → input mt8 h56 r14 1.5px line (focus: ink border) 18px, `type=email autocomplete=email` → primary "Email me a code" mt12 h56 → footer "Trouble signing in? Ask your head chef." 14 ink-2 centred.

### Check your email (03, 04)
Back button 44 top-left. "Check your email" 28/600 mt28; "Enter the code we sent to **email**" 17 ink-2. Code field mt28: 6-col grid gap 8 of boxes h64 r12 surface 2px border, 30/600 tabular; the next empty box has ink border; error state all boxes danger border. One real `<input inputmode="numeric" autocomplete="one-time-code" maxlength="6">` overlaid transparently across the boxes (keeps iOS autofill). Auto-submits at 6 digits; on success push to home ~260ms later. Error text 15/600 danger mt12: "That code didn’t match. Check the newest email, or send another." Buttons row mt20: "Send a new code" (surface-2, h44 r12 → "Sent ✓"), "Use a different email" (text, ink-2).

### Errors: site not found (05), no access (21), recipe not found (16)
Not separately mocked — build from the no-results pattern: centred block, 20/600 heading, 16 ink-2 body, one secondary button. Suggested copy: "No Spongecake here" / "This address isn’t set up for a restaurant." · "You’re not on this site yet" / "Ask the head chef at {site} to add {email}." + "Sign out" · "Recipe not found" / "It may have been unpublished or renamed." + "Back to recipes".

### Offline indicator (not mocked)
Pill under the header, h28 r-full surface-2, 13/600 ink-2, 7px ink-3 dot: "Offline · showing saved copy". No accent, no red.

### PWA
`theme-color` meta = bg token per theme (#F6F5F2 / #121211), status bar style default. Home-screen icon: site logo on accent square, logo at ~60% with safe padding; splash = bg colour with 64px logo tile centred.

## Desktop (≥1024px) — `Spongecake Desktop.dc.html`
- Top bar h64, bottom 1px line: logo tile 36 + site name (260 wide) · centred search max-w 520 h44 r12 with "/" key hint · Admin pill · avatar 36.
- Two panes: left sidebar 340 (right 1px line, own scroll, p16 12): wrapping chips (h34 px12 14/600), grouped labels 12/600, rows p10 8 r10 with selected row = surface-2 bg, hover surface-2. Right main pane (own scroll), content max-w 1040 centred, p 36 40 64.
- Recipe header: title 40/600 + author/tags inline; actions right: heart 44 bordered, "Print", "Edit" (editors), "Cook mode" primary (h44 r12).
- Body grid `400px 1fr` gap 48: left column **sticky top 24** with scaler + ingredients (17px rows, qty col 88); right column method (max-w 620), notes, history + "Suggest an edit" on one row.
- Tablet (768–1023): phone layout, content max-w 640 centred; recipe can switch to the two-column body when width ≥ 900.

## Print — `Spongecake Print.dc.html`
A4 portrait, 16mm margins, pure black on white, no images/avatars/colour. Implement as a print stylesheet on the recipe route (or `/recipes/[slug]/print?scale=2`) that respects the current scale.
- Header: site name + tags (9pt/600 uppercase 0.08em, space-between) · title 26pt/600 mt10 · meta row 11pt: **Yield** 24 portions · **Scaled** ×2 from 12 portions (only if scaled) · **By** Ellie Marsh · 1.5pt rule mt12.
- Body grid `38% 1fr` gap 22pt. Left "INGREDIENTS": section title 10.5pt/600 with 0.75pt rule under; rows grid `52pt 1fr`, 4pt padding, 0.5pt #999 divider, qty right-aligned 600 tabular; sub-recipes get " (see recipe)"; non-scaling items get italic " — not scaled" when scaled. Right "METHOD": rows grid `18pt 1fr`, 11pt/1.45, "1." numbers 600, bold leads. Chef’s note: 0.75pt black box, p 8pt 10pt.
- Running footer every page: 8.5pt, 0.75pt top rule: "{title} · {site} · Spongecake" left, "By {author} · v{n}, updated {date} · Printed {date}" right.
- `break-inside: avoid` on rows, sections, note; orphans/widows 3.

## Emails — `designs/emails/`
Plain table-based HTML, inline styles plus one `<style>` block for `@media (prefers-color-scheme: dark)` overrides (class hooks `.bg .card .ink .ink2 .soft .line .btn .acc`). `<meta name="color-scheme" content="light dark">`. System font stack (Plex listed second). Hidden preheader. No images: the site logo is a 32×32 table cell with accent bg and initial. Max width 480, card r16 surface 1px line, padding 28 24.
Template variables to substitute: `{siteName}`, `{siteInitial}`, `{siteAccent}` (light; dark uses the mixed value — precompute server-side), `{host}`, `{firstName}`, `{code}`, `{verifyUrl}`, recipe/suggester fields.
1. **Sign-in** — Subject `{code} is your Spongecake code` (code first for notification + iOS autofill). Code 40px/600, letter-spacing .14em, in a surface-2 panel labelled "YOUR SIGN-IN CODE". Button "Sign in on this device". Expiry line.
2. **New suggestion** — Subject `Suggestion on {recipeTitle}`. Label "NEW SUGGESTION", title 22/600, meta line, suggester + time + verbatim text in surface-2 panel, button "Review in admin", open-count line.
3. **Welcome** — Subject `You’ve been added to Spongecake`. Greeting, headline "You’re on {siteName} recipes", two-sentence explainer, "Sign in" button, no-password line, rule, "PUT IT ON YOUR HOME SCREEN" with 3 numbered steps.
Plain-text versions alongside each.

## Avatars — `avatar.ts`
FNV-1a hash of a stable seed (lower-cased email or immutable user id) → background + circle (70% size) + rotated rounded square (55%, rx 18%) from a fixed 7-colour palette, three distinct colours, clipped to a circle. Deterministic forever: **never change the palette order or hash** once shipped. Legible at 16–72px. Replaces initials everywhere.

## Icons
Inline SVG, 24 viewBox, 2px stroke (2.2–2.4 for small chevrons/steppers), round caps/joins, `currentColor`. Set used: search, chevron left/right, plus, minus, close, heart, clock (history), list (ingredients), phone (cook mode), check. Use the codebase's icon set if equivalent (e.g. Lucide matches this style).

## State (beyond what exists)
- `themePref: 'light'|'dark'|'system'` (localStorage; set `data-theme` before first paint via inline script to avoid flash).
- Per-recipe `targetYield` (session); derived `factor = target / base`.
- `favourites: Set<recipeId>` (per user, server).
- Cook mode: `doneSteps: boolean[]` per recipe (session), sheet open flag, wake lock handle.
- Recently viewed: last ~10 recipe ids with timestamps (local).
- Recipe history: versions from Payload (`versions` collection) — count, last editor, change notes.

## Files
- `designs/` — prototypes (open in a browser), see list at top.
- `tokens.css`, `avatar.ts` — ready to use.
- `PROMPT.md` — the prompt to give Claude Code.
