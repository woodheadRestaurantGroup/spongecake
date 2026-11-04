import {
  body,
  button,
  emailShell,
  escapeHtml,
  firstName,
  label,
  muted,
  spacer,
  type EmailMessage,
  type EmailSite,
} from './shell'

export function welcomeEmail(args: {
  site: EmailSite
  name: string
  signInUrl: string
  addedBy: string
}): EmailMessage {
  const { site, name, signInUrl, addedBy } = args
  const first = firstName(name)
  const subject = 'You’ve been added to Spongecake'

  const step = (n: number, html: string) =>
    `<tr><td valign="top" class="ink" style="width:24px;padding:6px 0;font-size:15px;font-weight:600;color:#1A1917;">${n}.</td><td class="ink" style="padding:6px 0;font-size:15px;line-height:1.45;color:#1A1917;">${html}</td></tr>`

  const card =
    body(`Hi ${escapeHtml(first)},`, 12) +
    `<div class="ink" style="font-size:22px;line-height:1.25;font-weight:600;color:#1A1917;margin:0 0 10px;">You’re on ${escapeHtml(site.name)} recipes</div>` +
    body(
      'Spongecake is where our kitchen keeps its recipes. Search, scale a batch and follow the method on your phone during prep and service.',
    ) +
    button(signInUrl, 'Sign in') +
    spacer(12) +
    muted('Sign in with this email address. We’ll send a code each time — there’s no password.') +
    spacer(24) +
    `<div class="line" style="border-top:1px solid #E2DFD8;height:20px;line-height:20px;">&nbsp;</div>` +
    label('Put it on your home screen') +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
    step(1, 'Open the sign-in link in Safari on your iPhone.') +
    step(2, 'Tap the Share button, then <b>Add to Home Screen</b>.') +
    step(3, 'Open Spongecake from its icon — it works like an app.') +
    `</table>`

  const html = emailShell({
    site,
    title: subject,
    preheaderText: `Recipes for ${site.name}, on your phone.`,
    cardHtml: card,
    footerHtml: `Added by ${escapeHtml(addedBy)}.<br>Spongecake · Woodhead Restaurant Group`,
  })

  const text = [
    `Hi ${first},`,
    '',
    `You're on ${site.name} recipes. Spongecake is where our kitchen keeps its recipes: search, scale a batch and follow the method on your phone.`,
    '',
    `Sign in: ${signInUrl}`,
    "We'll email a code each time — no password.",
    '',
    'Put it on your home screen:',
    '1. Open the link in Safari on your iPhone.',
    '2. Tap Share, then Add to Home Screen.',
    '3. Open Spongecake from its icon.',
    '',
    `Added by ${addedBy}.`,
    '— Spongecake · Woodhead Restaurant Group',
  ].join('\n')

  return { subject, html, text }
}
