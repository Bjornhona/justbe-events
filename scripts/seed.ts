/**
 * scripts/seed.ts — run once, locally, never on production data.
 *
 *   pnpm add -D tsx dotenv
 *   pnpm tsx scripts/seed.ts
 *
 * WHAT SEEDING IS
 * It fills the CMS with realistic stand-in content so you can build and style
 * every section today, without waiting for Barbara's photos and text. When her
 * material arrives it is a content edit in the Studio, not a build task.
 *
 * WHY A SCRIPT AND NOT TYPING IT IN THE STUDIO
 * Ten services × two languages is tedious by hand and you will do it more than
 * once — after a schema change, after a dataset wipe, when you set up the
 * development dataset. The script is repeatable and lives in git.
 *
 * SAFETY
 * Uses createOrReplace with fixed _ids, so re-running is idempotent.
 * Point SANITY_STUDIO_DATASET at `development` while you build.
 */

import {readFileSync} from 'node:fs'

import {htmlToBlocks, randomKey} from '@portabletext/block-tools'
import {createClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {JSDOM} from 'jsdom'
import MarkdownIt from 'markdown-it'

/**
 * `pnpm seed --dry-run` prints what would be written and commits nothing.
 *
 * Worth having on a script whose whole job is createOrReplace: the legal pages
 * are converted from markdown by a hundred lines of parsing, and being able to
 * read the blocks before they overwrite the published policies is the
 * difference between catching a bad conversion and publishing one.
 */
const DRY_RUN = process.argv.includes('--dry-run')

const required = ['NEXT_PUBLIC_SANITY_PROJECT_ID', 'SANITY_API_WRITE_TOKEN']
if (!DRY_RUN) {
  for (const k of required) {
    if (!process.env[k]) throw new Error(`Missing ${k} — check .env.local`)
  }
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'dry-run',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'development',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-09-01',
  token: process.env.SANITY_API_WRITE_TOKEN || 'dry-run', // local only — never in Vercel
  useCdn: false,
})

const services = [
  // Imagine · Imaginamos
  ['imagine', 'Concepto y storytelling', 'Concept & storytelling',
   'Cada evento empieza con una idea que se pueda contar en una frase. Ahí es donde empezamos.',
   'Every event starts with an idea you can say in one sentence. That is where we begin.'],
  ['imagine', 'Dirección creativa', 'Creative direction',
   'Una sola visión que atraviesa el espacio, el sonido, la luz y el ritmo de la jornada.',
   'One vision running through the space, the sound, the light and the rhythm of the day.'],
  ['imagine', 'Diseño gráfico y 3D', 'Graphic & 3D design',
   'Ver el evento antes de construirlo, hasta el último detalle.',
   'Seeing the event before it is built, down to the last detail.'],

  // Build · Construimos
  ['build', 'Arquitectura efímera', 'Ephemeral architecture',
   'Espacios que existen durante unos días y se recuerdan durante años.',
   'Spaces that exist for a few days and are remembered for years.'],
  ['build', 'Producción audiovisual', 'Audiovisual production',
   'Pantallas, proyección y contenido, instalados y operados por el mismo equipo.',
   'Screens, projection and content, installed and run by the same team.'],
  ['build', 'Iluminación y sonido', 'Lighting & sound',
   'Lo que hace que una sala llena se sienta llena.',
   'What makes a full room feel full.'],
  ['build', 'Mobiliario', 'Furniture',
   'Construcción y alquiler, medido para el espacio y no al revés.',
   'Built and rented, measured to the space rather than the other way round.'],

  // Live · Vivimos
  ['live', 'Gestión integral del evento', 'Event management',
   'Desde el primer presupuesto hasta el último camión. Un solo interlocutor.',
   'From the first budget to the last truck. One point of contact.'],
  ['live', 'Espacios inmersivos', 'Immersive spaces',
   'El asistente deja de mirar el evento y pasa a estar dentro.',
   'The guest stops watching the event and starts being inside it.'],
  ['live', 'Viajes de incentivo', 'Incentive travel',
   'Programas que la gente cuenta al volver, no solo mientras están.',
   'Programmes people talk about after they get home, not just while they are there.'],
  ['live', 'Servicios de conserjería', 'Concierge services',
   'Atención individual para invitados que están acostumbrados a ella.',
   'Individual attention for guests who are used to it.'],
]

// Placeholder projects. permissionGranted is false on every one —
// the site renders anonymousLabel until Barbara has the written email.
const projects = [
  {
    id: 'project-familyday',
    es: 'Family day para 2.000 personas', en: 'Family day for 2,000',
    client: 'Lidl Spain',
    anonEs: 'una cadena de distribución alimentaria',
    anonEn: 'a food retail chain',
    typeEs: 'Family day', typeEn: 'Family day',
    city: 'Barcelona', year: 2024, pillar: 'live',
  },
  {
    id: 'project-convention',
    es: 'Convención anual', en: 'Annual convention',
    client: 'Nestlé',
    anonEs: 'una multinacional de alimentación',
    anonEn: 'a global food multinational',
    typeEs: 'Convención y arquitectura efímera', typeEn: 'Convention & ephemeral architecture',
    city: 'Madrid', year: 2023, pillar: 'build',
  },
  {
    id: 'project-celebration',
    es: 'Celebración de aniversario', en: 'Anniversary celebration',
    client: 'Longines',
    anonEs: 'una casa relojera suiza',
    anonEn: 'a Swiss watchmaking house',
    typeEs: 'Celebración y conserjería', typeEn: 'Celebration & concierge',
    city: 'Barcelona', year: 2024, pillar: 'live',
  },
  {
    id: 'project-launch',
    es: 'Lanzamiento de producto', en: 'Product launch',
    client: '',
    anonEs: 'una marca internacional de gran consumo',
    anonEn: 'an international consumer brand',
    typeEs: 'Lanzamiento y rueda de prensa', typeEn: 'Product launch & press conference',
    city: 'Lisboa', year: 2025, pillar: 'imagine',
  },
]

// ---------------------------------------------------------------------------
// Legal pages
//
// The three policies are drafted as markdown in content/legal-{es,en}.md and
// converted here. That direction is deliberate and one-way: the markdown is the
// drafting format, Sanity is where the published text lives. Once Barbara has
// corrected something in the Studio, re-running this WILL overwrite it —
// createOrReplace, not patch. Treat it as a first import, not a sync.
// ---------------------------------------------------------------------------

/**
 * The `_id` doubles as `slug.current`. The routes fetch by exactly these
 * strings, so they are set explicitly rather than generated from the title —
 * `legalPage.slug` generates from `title.es`, which would produce
 * "1-aviso-legal" and 404 every legal route.
 *
 * Order matches the order of the `## ` sections in both files.
 */
const LEGAL_IDS = ['legal-notice', 'privacy', 'cookies'] as const
type LegalId = (typeof LEGAL_IDS)[number]

/**
 * The default block schema, as shipped. The markdown only ever produces h3,
 * paragraphs, bullet lists and `strong`, all of which `localeBlock` allows, so
 * there is nothing to be gained by compiling the project's own schema here.
 */
const blockContentType = Schema.compile({
  name: 'default',
  types: [{name: 'blockContent', type: 'array', of: [{type: 'block'}]}],
}).get('blockContent')

// `typographer` stays off: it would rewrite quotes and dashes, and this is
// legal text that should reach Sanity character-for-character as drafted.
const md = new MarkdownIt()

const parseHtml = (html: string) => new JSDOM(html).window.document

/**
 * The block shapes this script writes, spelled out rather than borrowed from
 * block-tools' `TypedObject` — that type is just `{_type: string}`, so an object
 * literal carrying `style` or `rows` fails excess-property checking against it.
 * Writing them out also documents exactly what lands in the dataset.
 */
type PtSpan = {_type: 'span'; _key: string; text: string; marks: string[]}

type PtTextBlock = {
  _type: 'block'
  _key: string
  style: string
  markDefs: never[]
  children: PtSpan[]
}

type PtProcessorRow = {
  _type: 'processorRow'
  _key: string
  provider: string
  purpose: string
}

type PtProcessorList = {
  _type: 'processorList'
  _key: string
  rows: PtProcessorRow[]
}

/** Anything that can appear in a legal page body. */
type LegalBlock = PtTextBlock | PtProcessorList | {_type: string}

const span = (text: string, marks: string[] = []): PtSpan => ({
  _type: 'span',
  _key: randomKey(12),
  text,
  marks,
})

const textBlock = (style: string, text: string): PtTextBlock => ({
  _type: 'block',
  _key: randomKey(12),
  style,
  markDefs: [],
  children: [span(text)],
})

/** One `| a | b |` row split into trimmed cells. */
function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())
}

/** `|---|---|` — the alignment row, which carries no content. */
const isSeparatorRow = (line: string) =>
  tableCells(line).every((cell) => /^:?-+:?$/.test(cell))

/**
 * Splits a section into runs of markdown and runs of table, so the table can be
 * converted structurally while everything around it keeps its position.
 */
function splitOnTables(markdown: string) {
  const parts: {kind: 'markdown' | 'table'; lines: string[]}[] = []

  for (const line of markdown.split('\n')) {
    const kind = line.trimStart().startsWith('|') ? 'table' : 'markdown'
    const last = parts[parts.length - 1]
    if (last && last.kind === kind) last.lines.push(line)
    else parts.push({kind, lines: [line]})
  }

  return parts
}

/**
 * A markdown table → Portable Text.
 *
 * PORTABLE TEXT HAS NO TABLE TYPE, so there are two conversions and which one
 * applies depends on the table.
 *
 * The processor table in the privacy policy becomes a `processorList` object:
 * its two columns are a name and what that provider is used for, the pairing is
 * required by RGPD art. 13.1(e), and flattening it to prose would keep the words
 * and lose the association. Its header row ("Proveedor | Finalidad") is chrome
 * and is dropped.
 *
 * Any other table degrades to heading + paragraph pairs, one pair per row.
 * Today there is no such table in either file — the processor table is the only
 * one — so that branch is a guard against a future edit silently losing content
 * rather than something currently exercised.
 */
function tableToBlocks(lines: string[], docId: LegalId): LegalBlock[] {
  const rows = lines
    .filter((line) => line.trim() !== '')
    .filter((line) => !isSeparatorRow(line))
    .map(tableCells)

  if (rows.length === 0) return []

  const isProcessorTable = docId === 'privacy' && rows[0].length === 2

  if (isProcessorTable) {
    return [
      {
        _type: 'processorList',
        _key: randomKey(12),
        // `slice(1)` drops the header row.
        rows: rows.slice(1).map(([provider, purpose]) => ({
          _type: 'processorRow',
          _key: randomKey(12),
          provider,
          purpose,
        })),
      },
    ]
  }

  return rows.slice(1).flatMap(([head, ...rest]) => [
    textBlock('h3', head),
    textBlock('normal', rest.join(' — ')),
  ])
}

/**
 * One `## ` section of markdown → Portable Text blocks.
 *
 * The trailing "**Última actualización:** [FECHA]" line is removed rather than
 * converted. That placeholder was never meant to be published, and the date is
 * now a real field on the document (`lastUpdated`) which the page renders
 * itself — leaving the line in would print a literal "[FECHA]" under a policy
 * that already shows its date.
 *
 * `[PENDIENTE: …]` and `[PENDING: …]` are deliberately NOT touched. They are
 * genuinely missing data — the Registro Mercantil entry — and must survive to
 * the Studio so that whoever fills them in can find them.
 */
function sectionToBlocks(section: string, docId: LegalId): LegalBlock[] {
  const body = section
    .split('\n')
    .slice(1) // the `## ` heading itself becomes the title
    .join('\n')
    .replace(/^\*\*(Última actualización|Last updated):\*\*.*$/gm, '')
    .replace(/\n---\s*$/, '') // the rule separating this section from the next
    .trim()

  return splitOnTables(body).flatMap((part) => {
    const text = part.lines.join('\n').trim()
    if (text === '') return []

    return part.kind === 'table'
      ? tableToBlocks(part.lines, docId)
      : (htmlToBlocks(md.render(text), blockContentType, {
          parseHtml,
        }) as LegalBlock[])
  })
}

/**
 * Splits a file into its three `## ` sections and returns heading + body for
 * each. Anything before the first `## ` — the "Borrador para revisión" note —
 * is dropped, which is correct: it is a message to us, not to a visitor.
 */
function readLegalFile(path: string) {
  const sections = readFileSync(path, 'utf8').split(/^## /m).slice(1)

  if (sections.length !== LEGAL_IDS.length) {
    throw new Error(
      `${path}: expected ${LEGAL_IDS.length} "## " sections, found ${sections.length}`,
    )
  }

  return sections.map((section, i) => ({
    // "1. Aviso legal" → "Aviso legal". The number orders the sections inside
    // the drafting file; on a page of its own it is meaningless.
    title: section.split('\n')[0].trim().replace(/^\d+\.\s*/, ''),
    blocks: sectionToBlocks(section, LEGAL_IDS[i]),
  }))
}

/** The three documents, built but not written — see `--dry-run`. */
function buildLegalDocs() {
  const es = readLegalFile('content/legal-es.md')
  const en = readLegalFile('content/legal-en.md')

  const today = new Date().toISOString().slice(0, 10)

  return LEGAL_IDS.map((id, i) => ({
    _id: id,
    _type: 'legalPage',
    title: {es: es[i].title, en: en[i].title},
    slug: {_type: 'slug', current: id},
    body: {es: es[i].blocks, en: en[i].blocks},
    lastUpdated: today,
  }))
}

function seedLegal(tx: ReturnType<typeof client.transaction>) {
  const docs = buildLegalDocs()
  docs.forEach((doc) => tx.createOrReplace(doc))
  return docs.length
}

async function seed() {
  if (DRY_RUN) {
    console.log(JSON.stringify(buildLegalDocs(), null, 2))
    console.error('\n--dry-run: nothing was written.')
    return
  }

  const tx = client.transaction()

  tx.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandName: 'B Events',
    tagline: {
      en: 'B Events is a event management company that specializes in creating and managing events for businesses and organizations.',
      es: 'B Events es una empresa de gestión de eventos que se especializa en crear y gestionar eventos para empresas y organizaciones.',
    },
    email: 'events@b-events.es',
    showPhonePublicly: false,
    legalName: 'Barbara Juan Portoles Events SL',
    nif: 'B93941276',
    address: 'Paseo de Sant Gervasio 57 bis, 3º 3ª\n08022 Barcelona',
  })

  services.forEach(([pillar, esTitle, enTitle, esDesc, enDesc], i) => {
    tx.createOrReplace({
      _id: `service-${i}`,
      _type: 'service',
      pillar,
      title: {es: esTitle, en: enTitle},
      description: {es: esDesc, en: enDesc},
      order: i,
    })
  })

  projects.forEach((p, i) => {
    tx.createOrReplace({
      _id: p.id,
      _type: 'project',
      title: {es: p.es, en: p.en},
      slug: {_type: 'slug', current: p.id.replace('project-', '')},
      permissionGranted: false,
      client: p.client,
      anonymousLabel: {es: p.anonEs, en: p.anonEn},
      eventType: {es: p.typeEs, en: p.typeEn},
      city: p.city,
      year: p.year,
      pillar: p.pillar,
      isPlaceholder: true,
      featured: i < 4,
      order: i,
    })
  })

  const legalCount = seedLegal(tx)

  await tx.commit()
  console.log(
    `Seeded: settings, ${services.length} services, ${projects.length} projects, ${legalCount} legal pages`,
  )
  console.log('Images are not seeded — add them in the Studio.')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
