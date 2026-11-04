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

export function signInEmail(args: {
  site: EmailSite
  name: string
  code: string
  link: string
  ttlMinutes: number
}): EmailMessage {
  const { site, name, code, link, ttlMinutes } = args
  const first = firstName(name)
  const subject = `${code} is your Spongecake code`

  const card =
    body(`Hi ${escapeHtml(first)},`, 16) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr><td class="soft" style="background:#EEECE7;border-radius:12px;padding:16px 18px;">` +
    label('Your sign-in code') +
    `<div class="ink" style="font-size:40px;line-height:1.1;font-weight:600;letter-spacing:.14em;color:#1A1917;font-variant-numeric:tabular-nums;">${code}</div></td></tr></table>` +
    body('Type it into Spongecake, or tap the button on this phone to sign in straight away.') +
    button(link, 'Sign in on this device') +
    spacer(20) +
    muted(
      `The code and button work for ${ttlMinutes} minutes, once. If you didn’t ask to sign in, ignore this email — nobody can get in without the code.`,
    )

  const html = emailShell({
    site,
    title: subject,
    preheaderText: `Enter ${code} in Spongecake. Works for ${ttlMinutes} minutes.`,
    cardHtml: card,
    footerHtml: 'You asked to sign in to Spongecake.<br>Spongecake · Woodhead Restaurant Group',
  })

  const text = [
    `Hi ${first},`,
    '',
    `Your sign-in code: ${code}`,
    '',
    'Type it into Spongecake, or open this link on this phone:',
    link,
    '',
    `The code and link work for ${ttlMinutes} minutes, once. If you didn't ask to sign in, ignore this email.`,
    '',
    `— Spongecake · ${site.name}`,
  ].join('\n')

  return { subject, html, text }
}
