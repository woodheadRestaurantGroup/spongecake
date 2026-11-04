type SignInEmailArgs = { name: string; link: string; code: string; ttlMinutes: number }

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

export function signInEmail({ name, link, code, ttlMinutes }: SignInEmailArgs): {
  subject: string
  text: string
  html: string
} {
  const subject = `Your Spongecake sign-in code: ${code}`
  const firstName = name.split(' ')[0]

  const text = [
    `Hi ${firstName},`,
    '',
    `Your sign-in code is ${code}`,
    '',
    'Type it into the Spongecake sign-in screen, or open this link on the same device:',
    link,
    '',
    `The code and link work for ${ttlMinutes} minutes and can only be used once.`,
    'If you did not ask to sign in, you can ignore this email.',
  ].join('\n')

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border-top:4px solid #b45309">
    <p style="margin:0 0 16px;font-size:16px">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 8px;font-size:14px;color:#57534e">Your sign-in code is</p>
    <p style="margin:0 0 24px;font-size:36px;font-weight:700;letter-spacing:0.2em">${code}</p>
    <p style="margin:0 0 16px;font-size:14px;color:#57534e">Type it into the Spongecake sign-in screen, or open the link below on the same device.</p>
    <p style="margin:0 0 24px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:600">Sign in to Spongecake</a></p>
    <p style="margin:0;font-size:12px;color:#78716c">The code and link work for ${ttlMinutes} minutes and can only be used once. If you did not ask to sign in, you can ignore this email.</p>
  </div>
</body></html>`

  return { subject, text, html }
}
