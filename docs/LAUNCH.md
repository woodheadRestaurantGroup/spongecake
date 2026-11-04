# QCH launch checklist

Phase 4 of the PRD. Everything the build needs is on `main`. The items below are
ordered; each one is either James, the team member doing recipe entry, or
Claude. Tick them off in this file as they happen.

## 1. Production environment (James)

- [ ] Vercel → Settings → Environment Variables → Production has: `DATABASE_URL`,
      `DATABASE_URL_UNPOOLED`, `BLOB_READ_WRITE_TOKEN`, `PAYLOAD_SECRET`,
      `RESEND_API_KEY`, `EMAIL_FROM`, `BOOTSTRAP_ADMIN_EMAIL`. `DEFAULT_SITE_SLUG`
      must NOT be set in Production.
- [ ] The latest `main` deploy is green and ran the migrations (look for
      "Migrated:" lines in the build log).
- [ ] Open the production vercel.app URL at `/sign-in`, sign in with the bootstrap
      email. The first sign-in creates the Group Admin.
- [ ] `/admin` opens. The account avatar shows and no errors appear.

## 2. Create the QCH site (James)

- [ ] Admin → Sites → Create: name "The Quality Chop House", slug `qch`,
      accent colour, and under Domains add `spongecake.thequalitychophouse.com`.
      Add the production vercel.app hostname too for now, so you can use the app
      before DNS is done.
- [ ] Admin → Tags: create the tags the kitchen wants as sections (for example
      Starters, Mains, Sauces, Pastry, Bread, Staff food), then on the site set
      "Home tags" in the order they should appear.

## 3. People (James, then the site admin)

- [ ] Admin → Users → Create the QCH site admin (head chef) with role Site Admin.
      They receive the welcome email. Site admins can add everyone else.
- [ ] Create the person doing recipe entry as a Site Admin so they can set each
      recipe's author to the chef who wrote it.
- [ ] Add editors and viewers. Every address must be the one they will sign in
      with. Names appear on recipes, so use real names.

## 4. Recipe entry (team member)

- [ ] Read `docs/RECIPE-ENTRY.md` for the conventions.
- [ ] Enter recipes as drafts, publish when checked. Set Author to the chef who
      wrote it. Use change notes when editing a published recipe.
- [ ] Add a hero photo only where there is a good one; the page is designed to
      look right without.

## 5. Domain (James)

- [ ] Vercel → Project → Settings → Domains → add `spongecake.thequalitychophouse.com`.
- [ ] In the DNS for thequalitychophouse.com add the CNAME Vercel shows
      (`cname.vercel-dns.com`). Wait for Vercel to report the certificate issued.
- [ ] Open `https://spongecake.thequalitychophouse.com/sign-in` on a phone and
      sign in. The site tile and name should be QCH, not generic.
- [ ] Remove the vercel.app hostname from the site's domains once the real one works.

## 6. Phone checks before telling staff (James, on an iPhone)

- [ ] Sign in, add to home screen, open from the icon. The icon shows the QCH tile.
- [ ] Close the app, reopen it: still signed in.
- [ ] Open a recipe, scale it, open cook mode: screen stays awake.
- [ ] Turn Wi-Fi and data off: the recipe you just opened still loads and shows
      the "Offline" pill. An unopened recipe shows the offline page.
- [ ] Ask the head chef to submit a suggestion from their phone and confirm the
      editors receive the email.

## 7. Staff notice (James)

- [ ] Share `docs/PRIVACY-NOTICE.md` with staff, or point them at `/privacy` in
      the app, before sign-ins go out.
- [ ] Send the welcome email by creating accounts; it explains sign-in and the
      home-screen step. No separate announcement is needed.

## 8. Day one and after

- [ ] Watch Vercel → Logs on launch day for "Sign-in email could not be sent"
      or "Could not send suggestion emails".
- [ ] After a week, ask three chefs: did sign-in work first time, is anything slow,
      what do they reach for that isn't there. Feed that into Phase 5.

## Known limits at launch

- iOS drops the offline cache after about a week without opening the app. The
  first open after that needs signal. Sessions last 90 days regardless.
- There is no password fallback. If Resend has an outage, existing sessions keep
  working; new sign-ins wait.
- The field-level diff in History is not built yet; History shows who saved each
  version, when, and their note.
