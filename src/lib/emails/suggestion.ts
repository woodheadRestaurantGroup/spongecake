import {
  button,
  emailShell,
  escapeHtml,
  label,
  muted,
  spacer,
  type EmailMessage,
  type EmailSite,
} from './shell'

export function suggestionEmail(args: {
  site: EmailSite
  recipeTitle: string
  recipeMeta: string
  suggesterName: string
  when: string
  text: string
  adminUrl: string
  openCount: number
}): EmailMessage {
  const { site, recipeTitle, recipeMeta, suggesterName, when, text, adminUrl, openCount } = args
  const subject = `Suggestion on ${recipeTitle}`
  const countLine =
    openCount === 1
      ? 'This recipe has 1 open suggestion.'
      : `This recipe has ${openCount} open suggestions.`

  const card =
    label('New suggestion') +
    `<div class="ink" style="font-size:22px;line-height:1.25;font-weight:600;color:#1A1917;margin:0 0 10px;">${escapeHtml(recipeTitle)}</div>` +
    `<div class="ink2" style="font-size:14px;line-height:1.5;color:#57534D;margin:0;">${escapeHtml(recipeMeta)}</div>` +
    spacer(20) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr><td class="soft" style="background:#EEECE7;border-radius:12px;padding:16px 18px;">` +
    `<div class="ink" style="font-size:15px;font-weight:600;color:#1A1917;margin:0 0 6px;">${escapeHtml(suggesterName)} <span class="ink2" style="font-weight:400;color:#57534D;">· ${escapeHtml(when)}</span></div>` +
    `<div class="ink" style="font-size:16px;line-height:1.5;color:#1A1917;">${escapeHtml(text).replace(/\n/g, '<br>')}</div></td></tr></table>` +
    button(adminUrl, 'Review in admin') +
    spacer(16) +
    muted(countLine)

  const html = emailShell({
    site,
    title: subject,
    preheaderText: `${suggesterName} suggested an edit to ${recipeTitle}.`,
    cardHtml: card,
    footerHtml: `You’re an editor at ${escapeHtml(site.name)}.<br>Spongecake · Woodhead Restaurant Group`,
  })

  const plain = [
    `New suggestion: ${recipeTitle}`,
    '',
    `${suggesterName}, ${when}:`,
    `"${text}"`,
    '',
    'Review in admin:',
    adminUrl,
    '',
    countLine,
    '',
    `— Spongecake · ${site.name}`,
  ].join('\n')

  return { subject, html, text: plain }
}
