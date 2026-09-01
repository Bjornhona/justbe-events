// src/i18n/request.ts
import {getRequestConfig} from 'next-intl/server'
import {hasLocale} from 'next-intl'
import {routing} from './routing'

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    // UI strings only (nav labels, button text, form labels).
    // All editorial content comes from Sanity, not from these files.
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
