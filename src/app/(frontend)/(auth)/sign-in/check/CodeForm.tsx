'use client'

import React, { useActionState, useRef, useState } from 'react'

import { TransitionLink } from '@/components/nav/ViewTransitions'
import { cx } from '@/components/ui'

import { resendCodeAction, verifyCodeAction, type FormState } from '../../actions'

/**
 * Six visible boxes with one real input laid over them, so iOS can autofill
 * the code from Messages and Mail. Submits itself at six digits.
 */
export function CodeForm({
  email,
  redirectTo,
  signInHref,
}: {
  email: string
  redirectTo: string
  signInHref: string
}) {
  const [code, setCode] = useState('')
  const [dirty, setDirty] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await verifyCodeAction(prev, formData)
    if (result.error) {
      setCode('')
      setDirty(false)
    }
    return result
  }, {})
  const [resendState, resendAction, resending] = useActionState<FormState, FormData>(
    resendCodeAction,
    {},
  )

  const showError = Boolean(state.error) && !dirty

  const boxes = [0, 1, 2, 3, 4, 5]

  return (
    <>
      <form ref={formRef} action={action} className="mt-7">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="redirect" value={redirectTo} />
        <div className="relative grid grid-cols-6 gap-2" onClick={() => inputRef.current?.focus()}>
          {boxes.map((i) => {
            const border = showError
              ? 'border-danger'
              : i === code.length
                ? 'border-ink'
                : 'border-line'
            return (
              <div
                key={i}
                aria-hidden
                className={cx(
                  'flex h-16 items-center justify-center rounded-[12px] border-2 bg-surface text-[30px] font-semibold tabular transition-colors duration-[120ms]',
                  border,
                )}
              >
                {code[i] ?? ''}
              </div>
            )
          })}
          <input
            ref={inputRef}
            id="code"
            name="code"
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 6)
              setDirty(true)
              setCode(next)
              // Submit as soon as six digits are in, so pasting or autofill signs in without a tap.
              if (next.length === 6 && !pending)
                queueMicrotask(() => formRef.current?.requestSubmit())
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            aria-label="Six-digit code"
            className="absolute inset-0 h-full w-full opacity-0"
            style={{ fontSize: 30, letterSpacing: 40 }}
          />
        </div>
        {showError && (
          <p className="mt-3 text-[15px] font-semibold leading-[1.4] text-danger">{state.error}</p>
        )}
        {pending && <p className="mt-3 text-[15px] text-ink-2">Signing in…</p>}
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        <form action={resendAction}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="redirect" value={redirectTo} />
          <button
            type="submit"
            disabled={resending || resendState.sent}
            className="h-11 rounded-[12px] bg-surface-2 px-4 text-[15px] font-semibold active:opacity-70 disabled:opacity-100"
          >
            {resendState.sent ? 'Sent ✓' : resending ? 'Sending…' : 'Send a new code'}
          </button>
        </form>
        <TransitionLink
          href={signInHref}
          direction="pop"
          className="flex h-11 items-center rounded-[12px] px-4 text-[15px] font-semibold text-ink-2 active:opacity-70"
        >
          Use a different email
        </TransitionLink>
      </div>
      {resendState.error && <p className="mt-3 text-[15px] text-danger">{resendState.error}</p>}
    </>
  )
}
