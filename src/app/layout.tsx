/**
 * Pass-through layout.
 *
 * The real document shell lives one level down, because two branches of the
 * app need different ones: `[locale]/layout.tsx` for the site (localised
 * `lang`, fonts, Tailwind) and `studio/layout.tsx` for Sanity Studio (which
 * styles its own full-height document). Rendering <html>/<body> here would
 * nest them.
 *
 * So this file deliberately renders neither tag — it only exists to satisfy
 * the `app/layout` requirement and keep `/studio` outside `[locale]`.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return children;
}
