// src/i18n/routing.ts
import {defineRouting} from 'next-intl/routing'
import {createNavigation} from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',

  // 'always' puts the locale in every URL, including the default:
  // justbe-events.com/es and justbe-events.com/en.
  // Cleaner for hreflang and avoids an ambiguous root.
  localePrefix: 'always',

  // Localised routes. Spanish is the primary market, so the Spanish
  // paths are the real ones and English mirrors them.
  pathnames: {
    '/': '/',
    // '/services': {es: '/servicios', en: '/services'},
    // '/work': {es: '/proyectos', en: '/work'},
    // '/work/[slug]': {es: '/proyectos/[slug]', en: '/work/[slug]'},
    // '/about': {es: '/nosotros', en: '/about'},
    // '/news': {es: '/noticias', en: '/news'},
    // '/news/[slug]': {es: '/noticias/[slug]', en: '/news/[slug]'},
    // '/contact': {es: '/contacto', en: '/contact'},
    '/legal-notice': {es: '/aviso-legal', en: '/legal-notice'},
    '/privacy': {es: '/privacidad', en: '/privacy'},
    '/cookies': {es: '/cookies', en: '/cookies'},
  },
})

// Use these instead of next/link and next/navigation everywhere in the app —
// they keep the locale and the localised path in sync automatically.
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing)
