// The way past the gate: one password field, posted to `/api/preview`.
// Inside the gate layout, so it gets the same document shell and the same
// single sans face as the holding page it sits behind.
//
// Spanish only, and deliberately so — the one person who uses this page is the
// client. `?error=1` is the route handler saying the password was wrong; see
// `src/app/api/preview/route.ts` for why that is a redirect back here rather
// than a status code. No client JavaScript: a plain <form method="post"> is
// enough. Goes at launch with the rest of the bypass — see `src/app/robots.ts`.
import type { Metadata } from 'next'

import Logo from '@/components/Logo'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function GateAccessPage({ searchParams }: PageProps<'/gate/access'>) {
  const failed = (await searchParams).error === '1'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
      <Logo className="w-[280px] max-w-full text-ink-body" />

      <form method="post" action="/api/preview" className="mt-12 w-full max-w-xs">
        <label htmlFor="password" className="block text-sm font-medium text-ink-body">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={failed || undefined}
          aria-describedby={failed ? 'password-error' : undefined}
          className={`mt-1.5 w-full rounded-sm border bg-white px-3 py-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700 ${
            // Colour is not the only signal: the field also gets `aria-invalid`
            // and the written message below it.
            failed ? 'border-red-700' : 'border-line'
          }`}
        />
        {failed && (
          <p id="password-error" className="mt-1.5 text-sm font-medium text-red-700">
            Contraseña incorrecta.
          </p>
        )}
        <button
          type="submit"
          className="mt-6 w-full rounded-sm bg-jb-700 px-8 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-jb-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
        >
          Entrar
        </button>
      </form>
    </main>
  )
}
