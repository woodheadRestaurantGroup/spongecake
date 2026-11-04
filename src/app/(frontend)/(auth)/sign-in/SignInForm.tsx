'use client'

import React, { useActionState } from 'react'

import { Button, ErrorText, Field, inputClass } from '@/components/ui'

import { requestSignInAction, type FormState } from '../actions'

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestSignInAction, {})

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="redirect" value={redirectTo} />
      <Field label="Work email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          inputMode="email"
          enterKeyHint="send"
          placeholder="you@restaurant.co.uk"
          className={inputClass}
        />
      </Field>
      {state.error && <ErrorText>{state.error}</ErrorText>}
      <Button type="submit" size="lg" full disabled={pending} className="mt-3">
        {pending ? 'Sending…' : 'Email me a code'}
      </Button>
    </form>
  )
}
