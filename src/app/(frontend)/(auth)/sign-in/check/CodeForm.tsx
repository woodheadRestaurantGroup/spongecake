'use client'

import React, { useActionState } from 'react'

import { verifyCodeAction, type FormState } from '../../actions'

export function CodeForm({ email, redirectTo }: { email: string; redirectTo: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyCodeAction, {})

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="redirect" value={redirectTo} />
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Six-digit code</span>
        <input
          name="code"
          type="text"
          required
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
          enterKeyHint="go"
          className="h-14 w-full rounded-xl border border-stone-300 bg-white px-3 text-center text-3xl font-semibold tracking-[0.3em] outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-800"
        />
      </label>
      {state.error && <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-stone-900 font-semibold text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
