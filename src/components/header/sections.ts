/**
 * The sections of the single-page site, in page order.
 *
 * `id` is the fragment and stays Spanish in both languages: a fragment is not a
 * route, it never appears in hreflang, and localising it would mean the same
 * section had two identities to keep in sync. Only the visible label is
 * translated — `key` is the lookup in the `Nav` namespace.
 *
 * The section elements themselves must carry these ids, and `globals.css` gives
 * every `section[id]` a `scroll-margin-top` so the fixed header does not sit on
 * top of the heading when an anchor is followed.
 */
export const SECTIONS = [
  { id: 'servicios', key: 'services' },
  { id: 'proyectos', key: 'projects' },
  { id: 'contacto', key: 'contact' },
] as const

export type SectionKey = (typeof SECTIONS)[number]['key']
