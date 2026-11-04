import React from 'react'

/**
 * Rendered on the Payload admin login page in place of the password form.
 * Signing in happens on the front end; the same session cookie works here.
 */
export function MagicLinkLogin() {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
      <p style={{ marginBottom: '1.5rem' }}>
        Spongecake signs you in with a link or code sent to your email.
      </p>
      <a
        href="/sign-in?redirect=%2Fadmin"
        className="btn btn--style-primary btn--size-large"
        style={{ display: 'inline-block', textDecoration: 'none' }}
      >
        Sign in with email
      </a>
    </div>
  )
}
