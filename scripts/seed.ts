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

import {createClient} from '@sanity/client'

const required = ['NEXT_PUBLIC_SANITY_PROJECT_ID', 'SANITY_API_WRITE_TOKEN']
for (const k of required) {
  if (!process.env[k]) throw new Error(`Missing ${k} — check .env.local`)
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'development',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-09-01',
  token: process.env.SANITY_API_WRITE_TOKEN!, // local only — never in Vercel
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

async function seed() {
  const tx = client.transaction()

  tx.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandName: 'B Vents',
    tagline: {
      en: 'B Vents is a event management company that specializes in creating and managing events for businesses and organizations.',
      es: 'B Vents es una empresa de gestión de eventos que se especializa en crear y gestionar eventos para empresas y organizaciones.',
    },
    email: 'info@b-vents.com',
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

  await tx.commit()
  console.log(`Seeded: settings, ${services.length} services, ${projects.length} projects`)
  console.log('Images are not seeded — add them in the Studio.')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
