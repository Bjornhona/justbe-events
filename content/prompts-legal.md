# Claude Code prompts — legal pages

**Run these AFTER Prompt 2** (Sanity client, queries, locale helper). They depend
on the client, the `siteSettings` query and a Portable Text renderer.

The legal *text* is already written — see `legal-es.md` and `legal-en.md`.
Do not let the agent write legal wording. Its job here is plumbing only.

---

## Prompt L1 — Portable Text renderer and the legalPage query

```
Add rendering support for legalPage documents.

1. pnpm add @portabletext/react
2. Create src/components/PortableText.tsx wrapping PortableTextComponents
   with styling from the design tokens in globals.css:
   - h2: large, ink, generous top margin
   - h3: medium, ink
   - normal: max-w-prose, relaxed leading, ink-muted
   - blockquote: left border in jb-500
   - bullet lists
   - links: jb-700, underlined, external ones get rel="noopener noreferrer"
   Tables are not supported by Portable Text blocks — render the processor
   list as a definition list instead of a table.
3. Add a GROQ query getLegalPage(slug) to src/sanity/lib/queries.ts returning
   title, body and lastUpdated.
4. TypeScript types for the result, no `any`.
```

---

## Prompt L2 — the three routes

```
Build the three legal routes as server components:
  src/app/[locale]/legal-notice/page.tsx
  src/app/[locale]/privacy/page.tsx
  src/app/[locale]/cookies/page.tsx

Each one:
- Fetches its legalPage document by slug ("legal-notice", "privacy", "cookies")
- Uses pickLocale to select the body for the active locale
- Renders title, the PortableText body, and "Última actualización / Last
  updated" with lastUpdated formatted for the locale
- generateMetadata with the localised title and robots noindex removed only
  on production
- Calls notFound() if the document is missing
- Narrow reading column, generous vertical rhythm, nothing decorative

Do NOT hardcode the fiscal data in these pages. It lives in Sanity.
```

---

## Prompt L3 — seed the legal content

```
Extend scripts/seed.ts with a function seedLegal().

Read the three Spanish documents from content/legal-es.md and the three
English ones from content/legal-en.md, split on the "## " headings, convert
each to Portable Text using @portabletext/block-tools with the default schema,
and createOrReplace three legalPage documents with fixed _ids:
  legal-notice, privacy, cookies

Each document gets:
  title:  {es, en}
  slug:   {_type: "slug", current: <id>}
  body:   {es: <blocks>, en: <blocks>}
  lastUpdated: today in YYYY-MM-DD

Convert the markdown tables into simple heading + paragraph pairs, since
Portable Text has no table type.

Preserve [PENDIENTE] and [PENDING] markers verbatim — they are deliberate
placeholders for data that has not arrived yet.
```

---

## Before you publish

- [ ] Registro Mercantil details from Barbara — replace both placeholder markers
- [ ] Replace [FECHA] / [DATE] with the launch date
- [ ] Confirm the Sanity dataset region — if it is US, the privacy policy needs
      Sanity listed under international transfers too
- [ ] Add a line to the English legal notice stating the Spanish version prevails
- [ ] Footer links to all three, in both locales
- [ ] **Have these reviewed by a lawyer before launch**
- [ ] When HubSpot goes in: add it to the processor table, add the CRM purpose
      and retention period, and build the cookie consent banner
