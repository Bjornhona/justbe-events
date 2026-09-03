import { notFound } from 'next/navigation'

/**
 * Without this file, `[locale]/not-found.tsx` never renders.
 *
 * An unmatched URL like /es/nope matches no route, so Next never resolves the
 * [locale] segment and falls straight through to the root app/not-found.tsx —
 * losing the header, the footer and the translations.
 *
 * This catch-all does match, which puts us inside [locale]; throwing notFound()
 * from here then resolves to the nearest boundary, which is the localised one.
 */
export default function CatchAllPage() {
  notFound()
}
