'use client'

import React, { useActionState } from 'react'

import { requestSignInAction, type FormState } from '../actions'

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestSignInAction, {})

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Work email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          inputMode="email"
          enterKeyHint="send"
          className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-800"
        />
      </label>
      {state.error && <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-stone-900 font-semibold text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
      >
        {pending ? 'Sending…' : 'Email me a code'}
      </button>
    </form>
  )
}
