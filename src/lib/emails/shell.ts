import { darkAccent } from './colour'

export type EmailSite = { name: string; accent: string }

export type EmailMessage = { subject: string; html: string; text: string }

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

export function siteInitial(name: string): string {
  return (name.replace(/^the\s+/i, '')[0] || 'S').toUpperCase()
}

/** Hidden preheader text, padded so mail clients do not pull body text into the preview. */
function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(text)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>`
}

/**
 * The shared email frame from the design handoff: site header, white card,
 * footer, with dark-mode overrides keyed on class hooks.
 */
export function emailShell(args: {
  site: EmailSite
  title: string
  preheaderText: string
  cardHtml: string
  footerHtml: string
}): string {
  const { site, title, preheaderText, cardHtml, footerHtml } = args
  const accent = site.accent
  const accentDark = darkAccent(accent)
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(title)}</title>
<style>
body{margin:0;padding:0;-webkit-text-size-adjust:100%}
a{color:#1A1917}
@media (prefers-color-scheme: dark){
  .bg{background:#121211 !important}
  .card{background:#1C1B19 !important;border-color:#33312D !important}
  .ink{color:#F3F1EC !important}
  .ink2{color:#ADA9A1 !important}
  .soft{background:#282623 !important}
  .line{border-color:#33312D !important}
  .btn{background:#F3F1EC !important;color:#121211 !important}
  .btn a{color:#121211 !important}
  .acc{background:${accentDark} !important;color:#121211 !important}
  a{color:#F3F1EC !important}
}
</style></head>
<body class="bg" style="margin:0;padding:0;background:#F6F5F2;">
${preheader(preheaderText)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background:#F6F5F2;">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;font-family:-apple-system,BlinkMacSystemFont,'IBM Plex Sans','Segoe UI',Helvetica,Arial,sans-serif;">
<tr><td style="padding:0 4px 16px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td class="acc" width="32" height="32" align="center" valign="middle" style="width:32px;height:32px;border-radius:8px;background:${accent};color:#FFFFFF;font-size:15px;font-weight:600;line-height:32px;">${escapeHtml(siteInitial(site.name))}</td>
    <td style="padding-left:10px;">
      <div class="ink2" style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#57534D;line-height:1.2;">Spongecake</div>
      <div class="ink" style="font-size:15px;font-weight:600;color:#1A1917;line-height:1.3;">${escapeHtml(site.name)}</div>
    </td>
  </tr></table>
</td></tr>
<tr><td class="card" style="background:#FFFFFF;border:1px solid #E2DFD8;border-radius:16px;padding:28px 24px;">${cardHtml}</td></tr>
<tr><td class="ink2" style="padding:16px 8px 0;font-size:12px;line-height:1.5;color:#57534D;text-align:center;">${footerHtml}</td></tr>
</table></td></tr></table></body></html>`
}

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td class="btn" align="center" style="background:#1A1917;border-radius:12px;"><a href="${escapeHtml(href)}" style="display:block;padding:15px 20px;font-size:16px;font-weight:600;color:#F6F5F2;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`
}

export function spacer(height: number): string {
  return `<div style="height:${height}px;line-height:${height}px;">&nbsp;</div>`
}

export function label(text: string, marginBottom = 6): string {
  return `<div class="ink2" style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#57534D;margin:0 0 ${marginBottom}px;">${escapeHtml(text)}</div>`
}

export function body(html: string, marginBottom = 20): string {
  return `<div class="ink" style="font-size:16px;line-height:1.5;color:#1A1917;margin:0 0 ${marginBottom}px;">${html}</div>`
}

export function muted(html: string): string {
  return `<div class="ink2" style="font-size:14px;line-height:1.5;color:#57534D;margin:0;">${html}</div>`
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}
