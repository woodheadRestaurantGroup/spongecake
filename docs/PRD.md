# Spongecake – Product Requirements Document

**Status:** Draft v1 for sign-off
**Owner:** James Woodhead (Woodhead Restaurant Group)
**Date:** 4 November 2026

---

## 1. Summary

Spongecake is an internal recipe database for Woodhead Restaurant Group kitchens. Each site gets its own branded instance at its own domain (for example `spongecake.thequalitychophouse.com`), all served from a single codebase and deployment. Chefs open it on their phones at work, so it must feel like a native app: installable to the iPhone home screen, lightning fast, readable at arm's length, and logged in for months at a time.

Recipes are authored in Payload CMS with live preview. Every recipe carries structured ingredients and a yield, and the reader can rescale the yield on the front end to recalculate every quantity. Recipes show their author, keep a full edit history, and can be tagged to build a browsable, searchable front page. Readers without edit rights can suggest edits, which are emailed to the site's editors.

The first site to go live is The Quality Chop House (QCH). Four further sites follow once QCH is live. There is no pilot phase; QCH launches as soon as the build is complete and recipe entry is done.

## 2. Goals and non-goals

### Goals

1. One recipe source of truth per site, always up to date and reachable in seconds from a phone.
2. Native-app feel on iOS Safari and home-screen mode: sub-second loads, instant transitions, no re-login friction.
3. Simple, accurate scaling of ingredient quantities to any yield.
4. Clear authorship and accountability through visible authors and an edit history.
5. Low-friction contribution via suggested edits, without granting edit rights widely.
6. Operationally cheap: one deployment, managed services, minimal maintenance.

### Non-goals for v1

- Allergen, nutrition or dietary data.
- Costing, stock or supplier integration.
- Sharing or copying recipes between sites (designed for, not built).
- Public access of any kind. Everything is behind login.
- Native iOS or Android apps. The web app is the app.
- A bespoke mobile authoring UI. Payload's admin is used for editing in v1 (see 7.9).

## 3. Users and roles

Everyone who uses Spongecake is a staff member with an account created by a site admin. There is no self sign-up.

| Role | Scope | Can |
|---|---|---|
| **Viewer** | Per site | Read published recipes, scale yields, favourite, use cook mode and print view, submit suggestions. |
| **Editor** | Per site | Everything a Viewer can, plus create, edit, publish and archive recipes, create tags, upload images, resolve suggestions. |
| **Site Admin** | Per site | Everything an Editor can, plus create and manage users for the site, assign roles, manage site tags and home page layout, edit site branding, override a recipe's author. |
| **Group Admin** | All sites | Everything, across every site. Creates sites. Also the break-glass account for support. |

A user holds one membership per site, each with its own role, so a chef can be a Viewer at one site and an Editor at another. Group Admin is a global flag, not a site membership.

Roles are deliberately named by access level, not by kitchen job title. A head chef is usually a Site Admin, but not always.

## 4. Multi-site architecture

**Decision:** one Next.js and Payload application, one Postgres database, tenant-scoped data. Sites are not separate deployments or databases.

Why: users can hold accounts across several sites with a single identity; fixes and features ship once; cross-site recipe copying remains possible later; hosting cost and operational load stay flat as sites are added.

How it works:

- A **Sites** collection holds every site, its domains, logo and accent colour.
- Payload's multi-tenant plugin scopes Recipes, Tags, Media and Suggestions to a site and enforces that scoping in access control, so an Editor at site A can never read or write site B's data through the API or the admin.
- Next.js middleware reads the request hostname, looks up the matching site, and makes it available to every page and API route. An unknown hostname gets a neutral "site not found" page.
- All five domains point at the same Vercel project. Each is added as a custom domain and gets automatic TLS.
- Sessions are per domain, because browsers scope cookies by host. A multi-site user signs in once per site domain. At a 90-day session length this is rare.

Sites and domains known today:

| Site | Domain | DNS control |
|---|---|---|
| The Quality Chop House | `spongecake.thequalitychophouse.com` | James |
| Portland | `spongecake.portlandrestaurant.co.uk` | James or previous developer |
| Three further sites | TBC | James owns three of five; previous developer holds two |

Action before launch: confirm the full list of five domains and arrange DNS access for the two held by the previous developer.

## 5. Authentication and sessions

### 5.1 Magic link sign-in

Passwords are not used for day-to-day sign-in. Users enter their email and receive a sign-in email containing:

1. A **magic link** that signs them in when opened.
2. A **six-digit code** they can type into the sign-in screen instead.

The code exists because of iOS. A home-screen web app has its own cookie storage separate from Safari. If a chef taps the link in Mail, iOS opens Safari and signs in there, not in the home-screen app. Typing the code into the app itself avoids this. The sign-in screen explains this in one line when it detects standalone mode.

Rules:

- Links and codes expire after 15 minutes and are single use.
- Requests are rate limited per email and per IP.
- Unknown emails receive no email and the UI gives the same "check your inbox" response, so the form cannot be used to discover accounts.
- Group Admins additionally keep a password for break-glass access to the admin panel in case email delivery fails.

### 5.2 Session persistence

- Sign-in sets a server-issued, `httpOnly`, `Secure`, `SameSite=Lax` session cookie valid for **90 days**.
- Every authenticated request past the midpoint of a session's life silently reissues the cookie, so an active user never sees a login screen. Sliding renewal is handled in middleware.
- Server-set `httpOnly` cookies are not subject to Safari's seven-day cap on script-writable storage, so persistence survives on iOS as long as the user opens the app within 90 days.
- Sign-out is explicit and available from the profile screen. A Site Admin can revoke a user's sessions by removing their membership.

### 5.3 Payload admin access

Editors and Site Admins use the same magic link flow for the Payload admin panel at `/admin` on their site's domain. The default Payload login view is replaced with the Spongecake sign-in. Group Admins also see the password form.

## 6. Data model

All collections live in Payload. Tenant-scoped collections carry a `site` relationship managed by the multi-tenant plugin.

### 6.1 Sites

| Field | Type | Notes |
|---|---|---|
| name | text | Display name |
| slug | text | Unique |
| domains | array of text | Hostnames that resolve to this site |
| logo | upload (Media) | Square, used in header and as PWA icon |
| accentColour | text (hex) | Used for the top border, controls and PWA theme colour |
| homeTags | relationship to Tags, ordered | Tags shown as sections on the home page, in this order |

### 6.2 Users

Payload auth-enabled collection.

| Field | Type | Notes |
|---|---|---|
| email | email | Unique, login identifier |
| name | text | Shown as author |
| memberships | array of { site, role } | role is `viewer`, `editor` or `siteAdmin` |
| isGroupAdmin | checkbox | Global superuser |
| favourites | relationship to Recipes, hasMany | Server-side so favourites roam across devices |
| avatarSeed | text, auto | Set once on create; drives the generated avatar (see 7.7) |
| password | auth | Only used by Group Admins |

### 6.3 Recipes

Drafts and versions enabled. Versions power edit history.

| Field | Type | Notes |
|---|---|---|
| title | text | Required |
| slug | text | Unique per site, auto from title, editable |
| site | relationship | Tenant |
| status | drafts (`draft` / `published`) + `archived` checkbox | Front end shows published and not archived. Archived recipes stay in the admin and history. |
| author | relationship to Users | Defaults to the creating user. Editable by Site Admins and Group Admins only, so recipes typed up during data entry can be credited to the chef who wrote them. |
| heroImage | upload (Media), optional | Shown at top of recipe when present |
| yield | group { amount: number, label: text } | Amount is required. Label defaults to "portions" and is free text per recipe, for example "litres", "trays", "loaves". |
| ingredientSections | array | See below. At least one section. A single section with no title renders as a flat list. |
| method | array of steps | Each step is rich text (bold, italic, links only) with an optional image. Steps render numbered and become checkboxes in cook mode. |
| notes | rich text, optional | Chef's notes, service notes, storage |
| tags | relationship to Tags, hasMany | Drives home page sections and filtering |
| changeNote | text, optional | Entered on save, shown in history |

**Ingredient section:** `{ title?: text, ingredients: array }`

**Ingredient row:**

| Field | Type | Notes |
|---|---|---|
| quantity | number, nullable | Decimal. Empty means no quantity shown (for example "salt"). |
| unit | select | `g`, `kg`, `ml`, `l`, `tsp`, `tbsp`, `each`, `pinch`, `bunch`, `sheet`, `none`, plus `other` with a free-text label. List is extendable in code. |
| item | text | Required unless `subRecipe` is set |
| subRecipe | relationship to Recipes, optional | Renders the sub-recipe's title as a link in place of `item`. Just a link, nothing more. |
| note | text, optional | Prep note such as "finely diced" or "room temperature" |
| scales | checkbox, default on | When off, the quantity is shown unchanged at every yield and labelled "to taste" or whatever the note says |

### 6.4 Tags

| Field | Type | Notes |
|---|---|---|
| name | text | Unique per site |
| slug | text | Auto |
| site | relationship | Tenant |

Editors create tags. Site Admins choose which tags appear as home page sections and in what order, via the Site's `homeTags` field. Tags are freeform so each kitchen can structure its own front page (for example Starters, Mains, Pastry, Sauces, Bread, Staff Food).

### 6.5 Suggestions

| Field | Type | Notes |
|---|---|---|
| recipe | relationship | |
| site | relationship | Tenant |
| submittedBy | relationship to Users | Auto |
| body | textarea | Free text |
| status | select | `open`, `resolved`, `dismissed` |
| resolvedBy, resolvedAt | auto | Set when status changes |

### 6.6 Media

Payload upload collection backed by Vercel Blob. Tenant scoped. Image sizes generated on upload: thumbnail, card, hero. Served through `next/image`.

## 7. Front end requirements

### 7.1 Home

- Header: site logo, site name, search field, profile avatar.
- Subtle top border in the site accent colour.
- **Recently viewed** row at the top when the user has history on this device.
- **Favourites** row when the user has any.
- One section per tag in the site's `homeTags` order, each a horizontal or grid list of recipe cards. Remaining tags available via a "Browse all tags" list.
- Recipe card: title, author avatar and name, hero thumbnail if present, tags.

### 7.2 Search and browse

- Search is instant and on-device. With 50 to 100 recipes per site, the published recipe index (title, tags, ingredient names, author) is shipped as a small JSON document and searched client side as the user types. The index is revalidated whenever a recipe is published.
- Tag filter chips. Multiple tags narrow the results.
- Results update without a page load.

### 7.3 Recipe view

Layout in order: hero image (if any), title, author line (avatar, name, "last edited" relative time), tags, yield scaler, ingredients grouped by section, method steps, notes, collapsed history, actions.

Actions: Favourite, Cook mode, Print, Suggest an edit, and for Editors an "Edit in admin" link that opens the Payload editor for this recipe.

Readability: large base type, generous line height, high contrast, no text below 16px, tap targets at least 44px. Respects system dark mode.

### 7.4 Yield scaling

- The scaler shows the current yield amount and label, for example "12 portions".
- Controls: minus and plus steppers, direct numeric input, and quick multipliers ½×, 1×, 2×, 3× relative to the recipe's base yield.
- Scale factor = target amount ÷ base amount. Every ingredient with `scales` on is multiplied by the factor. Ingredients with `scales` off are shown unchanged.
- **No rounding to whole units.** 1.5 eggs is shown as 1.5 eggs. Values are displayed with up to two decimal places and trailing zeros trimmed, so 0.333 displays as 0.33 and 2.50 as 2.5. Open question 10.3 asks whether two decimals is the right display precision.
- Units never change. Grams stay grams at any scale. A later version can offer automatic g to kg promotion if wanted.
- The chosen yield is kept in the URL (`?yield=24`) so it survives reloads, is shareable, and carries into print view and cook mode.
- Scaling is pure client-side arithmetic over the already loaded recipe. No network request.

### 7.5 Cook mode

- Full-screen, distraction-free view with larger type and extra spacing.
- Method steps have checkboxes. Checked state is stored on the device per recipe and cleared when the user leaves cook mode or taps reset.
- Ingredients are reachable from a slide-up panel without leaving the step list, scaled to the current yield.
- Requests a screen wake lock so the phone does not sleep mid-prep. Falls back silently where unsupported.

### 7.6 Print view

- Dedicated print stylesheet for A4 portrait: title, yield as scaled, ingredients and method in a two-column layout, author and last-edited date in the footer. No navigation, no images other than the hero at reduced size.

### 7.7 Authors and avatars

- Every recipe shows its author's name and avatar wherever it appears.
- Avatars are generated, not uploaded. Each user gets a deterministic abstract pattern, in the style of Boring Avatars' "marble" or "bauhaus" variants, seeded from `avatarSeed` and coloured from a fixed palette that sits well against each site's accent. The same user always gets the same avatar everywhere.
- Avatars render as inline SVG, so they cost no network requests and work offline.

### 7.8 Edit history

- A collapsed "History" row sits beneath the notes, showing the number of edits and the last editor. It is one line and visually quiet by default.
- Expanding it lists each saved version: avatar, editor name, relative time, and the change note if one was given.
- Tapping a version shows **what changed**: a field-level diff against the previous version. Changed ingredients and steps are highlighted with old and new values; unchanged content is hidden. This is computed server side from Payload's stored versions.
- Payload's own version comparison in the admin remains available to Editors for full detail and for restoring a previous version.

### 7.9 Editing

- Recipes are created and edited in the Payload admin at `/admin` on the site's domain. Live preview shows the real front-end recipe view beside the editor as the author types, including the yield scaler.
- Payload's admin is responsive and usable for quick corrections on a phone. It is not optimised for authoring a full recipe on a phone.
- The "Edit in admin" action on every recipe deep-links Editors straight to that recipe's edit screen so a phone fix is two taps away.
- A lightweight mobile quick-edit form on the front end is explicitly deferred. We evaluate after QCH has been live for a few weeks and editors have tried the admin on their phones.

### 7.10 Suggest an edit

- Any signed-in user can open "Suggest an edit" on a recipe and submit free text.
- On submission, every Editor and Site Admin at that site receives an email containing the recipe title, the suggester's name, the text, and a link to the recipe in the admin.
- Editors see an open-suggestion count on the recipe in the admin and on the front-end recipe page, and resolve or dismiss suggestions from the admin.
- The suggester can see their own open suggestions on their profile screen with status.

### 7.11 Profile

- Avatar, name, email, sites the user belongs to with role.
- Favourites list.
- My suggestions with status.
- Install instructions for adding to the home screen (iOS cannot prompt programmatically, so this is a short illustrated guide).
- Sign out.

## 8. App-like performance and PWA

### 8.1 Targets on an iPhone over 4G

| Metric | Target |
|---|---|
| Largest Contentful Paint, recipe page, warm | under 1.0 s |
| Largest Contentful Paint, recipe page, cold | under 2.0 s |
| Tap to visible navigation | under 100 ms perceived |
| Lighthouse performance, mobile | 95 or above |

### 8.2 How we get there

- **Rendering:** Next.js App Router with React Server Components. Recipe and home pages are statically rendered and cached at the edge, then revalidated on demand. A Payload `afterChange` hook calls revalidation for the affected recipe, its tags, the home page and the search index the moment something is published, so content is never stale and never rendered on request.
- **Navigation:** Next.js `Link` prefetches routes as cards enter the viewport and on touch start, so the next page is usually already in memory when the user taps. Page transitions use the View Transitions API with a short cross-fade and shared-element motion on the hero image where supported, falling back to an instant swap elsewhere.
- **Partial updates:** favouriting, scaling, filtering and search all happen client side with optimistic UI. The only full navigations are between pages, and those are prefetched.
- **Payload:** small JSON payloads per route; the search index is one small document; images are sized server side and lazy loaded below the fold.
- **Fonts:** a single variable font, self-hosted, with `font-display: swap` and size-adjusted fallback to avoid layout shift.
- **Region:** Vercel functions and the database both run in London (see section 9), keeping any dynamic round trip short.

### 8.3 Installability

- Web app manifest generated per site at `/manifest.webmanifest` with the site's name, logo-derived icons, accent as theme colour, `display: standalone`.
- Apple touch icons and status bar styling per site.
- First-run banner in Safari pointing to the profile screen's install guide. Dismissible, shown at most once per device.

### 8.4 Offline

Kitchens often have patchy signal, so the app must degrade gracefully.

- A service worker (Serwist) precaches the app shell and the published search index.
- Every recipe page and its images the user visits are cached with a stale-while-revalidate strategy, so previously viewed recipes open instantly and work offline.
- Favourited recipes are prefetched into the cache in the background when the user is online, so the recipes a chef cares about are always available.
- An unobtrusive offline indicator appears when the network is unavailable, and the search index continues to work against cached recipes.
- Known limit: iOS evicts cached storage for web apps not opened in roughly seven days. A chef who has not opened the app in a week will need to be online the first time they open it again. The 90-day session cookie is unaffected.
- Stretch goal (post-launch): a "Download all recipes for offline" toggle on the profile screen.

## 9. Technical stack and hosting

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | Payload 3 runs natively inside it; one app for admin and front end |
| CMS and API | Payload 3 with multi-tenant plugin, drafts, versions, live preview | Structured content, auth, access control and versioning out of the box |
| Database | **Neon Postgres**, AWS eu-west-2 (London) | See 9.1 |
| Media | Vercel Blob via Payload storage adapter | Zero config with Vercel, image volume is low |
| Email | Resend via Payload email adapter | Reliable transactional delivery for magic links and suggestion alerts; UK-friendly pricing; free tier covers launch volume |
| Hosting | Vercel Pro, functions pinned to `lhr1` (London) | Edge caching, custom domains per site, preview deployments |
| Service worker | Serwist | Maintained successor to next-pwa, App Router support |
| Search | Client-side fuzzy search over a published JSON index | Instant, works offline, trivially small at this scale |
| Styling | Tailwind CSS with CSS variables for site accent | Fast to iterate, small output |
| Avatars | Boring Avatars (inline SVG) | Deterministic, no storage |

### 9.1 Database choice

Neon over Supabase, for this project specifically:

- Native Vercel Marketplace integration: provisioning, environment variables and billing live in the Vercel dashboard.
- Database branching per preview deployment, so every pull request gets an isolated copy of the schema and sample data for free.
- Serverless connection pooling designed for Vercel functions, which avoids connection exhaustion.
- London region available (AWS eu-west-2), matching Vercel `lhr1`.
- Free tier comfortably covers five sites of 100 recipes; paid tier is modest if needed.

Supabase in London would also work and we only use Postgres from either provider, so switching later is a connection string change plus a migration run.

### 9.2 Environments

- **Production:** `main` branch, all five site domains.
- **Preview:** every pull request, on a Vercel preview URL, with its own Neon branch. A test site record maps the preview hostname so the tenant lookup works.
- **Local:** Docker Postgres or a Neon dev branch, `.env.local`.

### 9.3 Indicative monthly cost

| Service | Tier | Approximate cost |
|---|---|---|
| Vercel | Pro, 1 seat | £16 to £20 |
| Neon | Free, upgrade to Launch if needed | £0 to £15 |
| Vercel Blob | Pay as you go | under £1 |
| Resend | Free (3,000 emails per month) | £0 |
| Domains | Already owned | £0 |

Expect roughly £20 to £35 per month in total at launch.

## 10. Security, privacy and operations

- Tenant isolation is enforced in Payload access control functions and covered by automated tests that attempt cross-site reads and writes with each role.
- Magic link tokens are hashed at rest, single use, 15-minute expiry, rate limited.
- Personal data held: name, email, role, favourites, recipe edit attribution. No other staff data. A Site Admin can delete a user; their authored recipes remain with the name retained for attribution, which should be noted in the staff privacy notice.
- Neon point-in-time recovery covers backups. A weekly export of recipes to JSON is kept in Blob storage as a belt-and-braces measure.
- Error monitoring via Sentry. Vercel Analytics for page performance.
- All traffic over HTTPS with HSTS. Admin and API share the same origin, so no CORS surface.

## 11. Open questions

1. **Sending domain for email.** Magic links and suggestion alerts need a verified sending domain, for example `spongecake@woodheadrestaurantgroup.co.uk`. Which domain, and who can add DNS records for it?
2. **Author override during data entry.** Confirmed as a Site Admin ability (6.3). Please confirm the team member doing data entry will have Site Admin or that you will reassign authors afterwards.
3. **Display precision for scaled quantities.** Proposed: up to two decimal places, trailing zeros trimmed, never rounded to whole units. Confirm or set a different precision.
4. **Who can suggest edits.** Proposed: any signed-in user, including Editors, so the feature also works as a lightweight comment thread. Confirm.
5. **Who can create tags.** Proposed: Editors create, Site Admins curate the home page. Confirm.
6. **Dark mode.** Proposed: follow the system setting. Confirm, or specify light only.
7. **Remaining three site names and domains**, and timing for DNS handover from the previous developer.
8. **First Group Admin account** is James. Any second person for cover?
9. **Unit list.** The proposed select list is in 6.3. Anything missing that your kitchens use routinely?
10. **Recipe images.** Hero image plus optional per-step images is proposed. Is per-step enough, or do you want a gallery?

## 12. Build plan

Phases are sequential but short. Each ends with something deployable.

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Foundations** | Repo scaffold, Next.js and Payload, Neon, Vercel project, Resend, Sentry, CI, QCH domain pointed at a holding page | Deploys to production on push to `main`; preview deploys per PR |
| **1. Core** | Sites, Users with memberships and roles, magic link sign-in with code fallback, 90-day sliding sessions, Recipes, Tags, Media, tenant isolation tests, Payload admin with live preview, front-end home, search, recipe view and yield scaling | A QCH Editor can sign in, author a recipe in the admin, and a Viewer can read and scale it on an iPhone |
| **2. App feel** | PWA manifest and icons per site, service worker and offline caching, prefetching and view transitions, favourites, recently viewed, cook mode with wake lock, print view, site branding | Lighthouse targets met; installed app works offline for viewed recipes |
| **3. Collaboration** | Suggestions with email alerts, edit history with field-level diff, change notes, generated avatars, profile screen with install guide | Full suggest, notify, resolve loop works end to end |
| **4. Launch QCH** | Recipe data entry by the team, author reassignment, user onboarding, DNS for QCH live, staff privacy notice | QCH staff using it daily |
| **5. Roll-out** | Add the remaining four sites, branding per site, DNS handover from previous developer | All five sites live |
| **Later** | Cross-site recipe copy, mobile quick-edit, download-all offline, g to kg unit promotion, allergens | Prioritised after launch feedback |

Phases 1 to 3 are the build. Data entry in Phase 4 can begin as soon as Phase 1 is deployed, in parallel with Phases 2 and 3.

## 13. Decisions log

| Date | Decision |
|---|---|
| 2026-11-04 | Single deployment, tenant-scoped data rather than one database per site, to support multi-site users and future recipe sharing. |
| 2026-11-04 | Magic link sign-in with six-digit code fallback for iOS home-screen apps. No passwords except Group Admin break-glass. |
| 2026-11-04 | 90-day sessions with sliding renewal via httpOnly cookie. |
| 2026-11-04 | Roles: Viewer, Editor, Site Admin, Group Admin. Access-level names, not job titles. |
| 2026-11-04 | Yield is a number plus a free-text label per recipe, not always portions. |
| 2026-11-04 | No rounding of scaled quantities. |
| 2026-11-04 | Freeform tags drive the home page; no allergen data in v1. |
| 2026-11-04 | Recipe states: draft, published, archived. |
| 2026-11-04 | Edit history shows who, when and what changed. |
| 2026-11-04 | Suggestions are free text and emailed to editors per suggestion. |
| 2026-11-04 | Offline reading of viewed and favourited recipes is in v1. |
| 2026-11-04 | Vercel hosting with functions in London; Neon Postgres in London. |
| 2026-11-04 | No pilot; QCH launches directly. |
