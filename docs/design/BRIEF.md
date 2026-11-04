# Spongecake design brief

For a design pass on the Spongecake front end and emails. Everything here is already built and working with placeholder styling; the job is to give it a considered visual identity and interaction detail that the engineering team can implement directly in Tailwind.

Screenshots of every current screen and state are in `screenshots/`, numbered in the order they are referenced below. The rendered sign-in email is `screenshots/26-email-sign-in.png` with its HTML and plain text in `emails/`.

## 1. What Spongecake is

An internal recipe database for Woodhead Restaurant Group's five restaurants. Each site gets its own instance on its own subdomain, with the site's logo and an accent colour. Chefs open it on their phones during prep and service to find a recipe, check quantities, scale a batch, and follow the method. Editors write recipes on a desktop in the CMS (Payload). There is no public audience: every screen is behind sign-in.

Full product requirements are in `../PRD.md`. The short version of what matters for design:

- **Phone first, in a kitchen.** One-handed use, wet or gloved hands, bright lights and glare, reading at arm's length, interruptions every thirty seconds. Big type, big targets, strong contrast, nothing precious.
- **Native-app feel.** Saved to the iPhone home screen and opened dozens of times a day. Instant transitions, no chrome that feels like a website.
- **Readability over decoration.** A recipe page is a working document. Hierarchy and scanning speed beat visual flourish.
- **Per-site identity, shared system.** One design system, with a small square logo and an accent colour per site. The accent currently drives a top border, primary controls and links. Design should decide how far the accent should go.
- **Light and dark.** User-selectable (Light, Dark, System). Dark is likely to be popular in dim pass areas and at night.

## 2. Users

| Role | Who | How they use it |
|---|---|---|
| Viewer | Chefs de partie, commis, front of house | Read and scale recipes on a phone. Never edits. Most users. |
| Editor | Sous chefs, head chefs | Everything a viewer does, plus writing recipes in the Payload admin, mostly on a desktop. |
| Site Admin | Head chef or GM | Also manages the site's users and home page layout. |
| Group Admin | James | Everything, across every site. |

Engagement matters. If sign-in is annoying or the app feels slow, chefs go back to photos of paper recipes in their camera roll.

## 3. Current visual system (placeholder, replace freely)

- Font: system sans (SF on iPhone). Switching to a self-hosted variable font is fine if it earns its place; two weights at most, and it must not delay first paint.
- Colours: Tailwind "stone" neutrals, white cards on a stone-50 page in light, stone-900 page with stone-800 cards in dark. Accent per site, default `#b45309`. QCH in the screenshots uses `#8b2d2d`.
- Type scale: recipe title 30px, section headings 20px, ingredient lines and method steps 18px, body 16px, captions 14px, labels 12px uppercase tracked.
- Shapes: 12px radius cards and inputs, 9999px pills for chips, 1px rings instead of shadows.
- Spacing: 16px page gutter, 24 to 32px between recipe sections.
- Touch targets: 44px minimum. Inputs 48px tall.
- Avatars: generated, not uploaded. Currently coloured initials (see section 6, Avatars).

Constraints the design should respect:

- Implemented in Tailwind CSS 4 with CSS variables for tokens. Please deliver colours, type, spacing and radii as a token set, with light and dark values.
- No large hero imagery by default. Most recipes have no photo; the design must look finished without one and good with one.
- Icons as inline SVG, small set, consistent stroke.
- Payload's admin UI is a third-party interface and is out of scope apart from the logo and the login page message (screenshots 22 to 25 are for context only).

## 4. Screens and states

Each line gives the screenshot number, the screen, and what to pay attention to.

**Entry and auth**

- 01 Sign in. Email only. First impression of the app. Needs the site's identity and a feeling of "this is ours".
- 02 Sign in with expired link message.
- 03 Check your email. Six-digit code entry. This is the main path on iOS home-screen apps, since tapping the email link opens Safari rather than the installed app. The input gets the code from iOS autofill, so it should look like a code field.
- 04 Wrong code error state.
- 05 Site not found. Hostname with no site configured. Rare, internal.
- 21 No access. Signed in but not a member of this site. Rare.

**Home (06 to 09, 15, 18)**

- 06 Home, light. Sticky search, horizontally scrolling tag chips, then sections per tag as configured by the site admin. Each row is a recipe card: title, author avatar and name, tags, optional thumbnail, chevron.
- 07 Search results. Instant, on-device, matches titles, ingredients, tags and chef names.
- 08 Tag filter active.
- 09 No results.
- 15 Recently viewed row at the top of home.
- 18 Home, dark, as a viewer (no Admin button).

Design questions for home: is a list the right default or should sections be horizontal rails? How should a site with 100 recipes and 12 tags feel? What does the empty state look like for a brand new site?

**Recipe (10 to 14, 19)**

- 10 Recipe, full page, light. The core screen. Title, author line, tags, yield scaler, ingredient sections, numbered method, notes callout, edit link for editors.
- 11 Recipe at viewport height, what you see on arrival.
- 12 Scaled to 2×. The scaler is minus and plus steppers, a direct-entry number with the yield label, quick multipliers (½×, 1×, 2×, 3×), and a "scaled ×2 from 12 portions" caption. Quantities update instantly and never round to whole units.
- 13 A recipe with a non-scaling item ("salt, to taste") and a yield that is not portions ("1 litre").
- 14 Draft badge, as seen by an editor in live preview.
- 19 Recipe, full page, dark.

Design questions for recipe: how should the scaler feel at a glance? Should quantities be more prominent than ingredient names, or the reverse? How do we show a sub-recipe link (currently accent text) without it reading as a web link? Where does a hero photo go when present, and how do step photos sit in the method?

**Profile (17, 20)**

- 17 Profile, light. Avatar, name, email, site memberships with role, appearance toggle, sign out.
- 20 Profile, dark.

**Errors**

- 16 Recipe not found.

**Admin, context only (22 to 25)**

- 22 Payload login page with our "Sign in with email" button. We can replace the Payload logo with the site's.
- 23 to 25 Payload dashboard, recipe list and recipe editor. Not for redesign.

## 5. Screens that do not exist yet

These are in the PRD for the next phases. Designs for them now would let us build straight to spec.

- **Cook mode.** Full-screen version of the recipe for use mid-prep: larger type, method steps as checkboxes, ingredients reachable in a slide-up panel, screen kept awake, an obvious way out. One-thumb operation.
- **Print view.** A4 portrait, two columns, scaled quantities, author and date in the footer. Black and white safe.
- **Favourites.** A heart on the recipe and a Favourites row on home.
- **Edit history.** A collapsed one-line "History" row under the notes showing the count and last editor. Expanded: a list of versions with avatar, name, relative time, change note. Tapping one shows a field-level diff of what changed. Must stay visually quiet.
- **Suggest an edit.** A button on the recipe opening a short free-text form. Confirmation state. For editors, a small badge showing open suggestions on the recipe.
- **Install guide.** A short illustrated "add to home screen" walkthrough for iOS Safari, reachable from profile and from a dismissible first-visit banner.
- **Offline indicator.** A quiet signal that the device is offline and the recipe shown is cached.
- **PWA assets.** Home-screen icon treatment that works with each site's square logo, splash screen, and the status bar colour.

## 6. Components to define

- App header (logo, site name, Admin pill for editors, avatar).
- Search field and tag chips (default, active, scrolling fade).
- Recipe card (with and without thumbnail).
- Section heading style for home and recipe.
- Yield scaler (steppers, number input, multipliers, caption, reset).
- Ingredient row (quantity, unit, name, note, sub-recipe link, non-scaling item).
- Method step (number, rich text with bold, italic and links, optional image).
- Notes callout.
- Tag pill (display only).
- Buttons: primary, secondary, destructive, text.
- Form field, error text, inline notice (used for expired link).
- Theme toggle segmented control.
- Draft badge.
- Empty and error states.
- **Avatars.** Generated per user from a stable seed, no uploads. Brief asks for abstract shapes or patterns in the spirit of Boring Avatars rather than initials. Must be legible at 18px, 24px, 32px and 64px, sit well on both themes and alongside any site accent, and stay stable for a user forever.

## 7. Emails

All transactional, sent from `Spongecake <spongecake@send.woodheadrestaurantgroup.co.uk>`, read mostly on a phone in the Mail app, often in dark mode. Plain HTML with inline styles, no images required, no tracking.

1. **Sign-in code** (26, with HTML and text in `emails/`). Subject carries the code so it shows in the notification. Body: greeting, the six-digit code large enough to read from a lock screen notification preview, a sign-in button for the link path, expiry note. This email is the thing a chef sees most often after the app itself.
2. **New suggestion** (to editors and site admins, not built yet). Recipe title, who suggested, the suggestion text, a button to open the recipe in the admin.
3. **Welcome** (not built yet, optional). Sent when a site admin creates an account: what Spongecake is, the site they have been added to, a sign-in button, a line about adding it to the home screen.

Per-site branding in email is desirable but secondary; the sender name and a small logo would do.

## 8. What we would like back

1. A direction: one or two looks for the recipe page and home, in light and dark, on an iPhone frame.
2. A token set: colours (neutrals plus how the per-site accent is applied), type scale, spacing, radii, with light and dark values, expressed as CSS variables.
3. Component specs for everything in section 6, with states.
4. Screen designs for every screen in section 4 and the new screens in section 5.
5. The three email templates.
6. An avatar generation scheme we can implement in SVG from a seed string.

Please design for a 390px wide iPhone first, and show how layouts relax on a tablet or desktop only where it is not obvious.
