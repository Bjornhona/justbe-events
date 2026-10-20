import {defineType, defineField} from 'sanity'

/** Marca una cifra como provisional mientras siga sembrada por el script. */
const PENDING = 'Pendiente de confirmar.'

// Singleton. Everything that appears in the header, footer and legal notice
// lives here so nothing legally significant is hardcoded in the repo.
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Configuración del sitio',
  type: 'document',
  groups: [
    {name: 'brand', title: 'Marca', default: true},
    {name: 'numbers', title: 'Cifras'},
    {name: 'clients', title: 'Clientes'},
    {name: 'press', title: 'Prensa'},
    {name: 'contact', title: 'Contacto'},
    {name: 'legal', title: 'Datos fiscales'},
    {name: 'meta', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'brandName', title: 'Nombre comercial', type: 'string', group: 'brand', initialValue: 'B Events'}),
    defineField({
      name: 'tagline',
      title: 'Claim',
      type: 'localeString',
      group: 'brand',
      initialValue: {en: 'No matter when, no matter where, just matters who and why'},
    }),
    defineField({name: 'heroImage', title: 'Imagen de cabecera', type: 'image', group: 'brand', options: {hotspot: true}}),
    defineField({
      name: 'heroVideo',
      title: 'Vídeo de cabecera',
      type: 'file',
      group: 'brand',
      description: 'Opcional. Cuando exista, sustituye a la imagen de cabecera.',
      options: {accept: 'video/*'},
    }),

    // --- cifras ---
    // Todas opcionales y todas independientes: la web esconde la que esté
    // vacía y no muestra la sección entera si no hay ninguna. Así se puede
    // publicar una cifra en cuanto esté confirmada, sin esperar a las cuatro.
    //
    // Son recuentos: un decimal o un negativo aquí sería un error de tecleo,
    // y se vería en portada a tamaño de titular.
    //
    // Las cuatro llegan sembradas con cifras redondas de relleno para poder
    // montar la sección. `PENDING` es el aviso de que todavía no son reales:
    // cuando confirmes una, corrige el número y borra esa frase, y así se ve
    // de un vistazo cuáles quedan por revisar.
    defineField({name: 'yearsActive', title: 'Años de experiencia', type: 'number', group: 'numbers', description: PENDING, validation: (Rule) => Rule.integer().min(0)}),
    defineField({name: 'eventsDelivered', title: 'Eventos realizados', type: 'number', group: 'numbers', description: PENDING, validation: (Rule) => Rule.integer().min(0)}),
    defineField({name: 'attendeesTotal', title: 'Asistentes en total', type: 'number', group: 'numbers', description: PENDING, validation: (Rule) => Rule.integer().min(0)}),
    defineField({name: 'countriesCount', title: 'Países', type: 'number', group: 'numbers', description: PENDING, validation: (Rule) => Rule.integer().min(0)}),

    // --- clientes ---
    //
    // Mismo modelo de permiso que en `project`, y por el mismo motivo: el
    // logotipo de una marca es suya, y publicarlo sin autorización escrita es
    // justo lo que esta web no puede hacer todavía.
    //
    // La diferencia con `project` es que aquí el permiso esconde la entrada
    // ENTERA, no solo el nombre. Un proyecto sin permiso sigue siendo
    // publicable en anónimo ("una multinacional de alimentación"); un logotipo
    // en anónimo no significa nada. Por eso la consulta filtra el array entero
    // en vez de vaciar campos sueltos — ver `siteSettingsQuery`.
    defineField({
      name: 'clients',
      title: 'Clientes',
      type: 'array',
      group: 'clients',
      description:
        'Solo se publican los que tengan el permiso activado. El resto puedes dejarlos aquí guardados: no salen en la web.',
      of: [
        {
          type: 'object',
          name: 'clientLogo',
          fields: [
            defineField({
              name: 'name',
              title: 'Nombre de la marca',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'logo',
              title: 'Logotipo',
              type: 'image',
              description:
                'Preferible en PNG o SVG con fondo transparente.',
            }),
            defineField({
              name: 'permissionGranted',
              title: '¿Tenemos permiso por escrito de la marca?',
              type: 'boolean',
              initialValue: false,
              description:
                'Actívalo SOLO cuando tengas el email de la marca autorizando el uso de su logotipo. Mientras esté desactivado, esta marca no aparece en la web.',
            }),
            defineField({
              name: 'order',
              title: 'Orden',
              type: 'number',
              validation: (Rule) => Rule.integer(),
            }),
          ],
          preview: {
            select: {
              title: 'name',
              granted: 'permissionGranted',
              media: 'logo',
            },
            // Same 🔒 / ✅ vocabulary as the project preview, so the permission
            // state reads identically wherever it appears in the Studio.
            prepare: ({title, granted, media}) => ({
              title: title || 'Sin nombre',
              subtitle: granted ? '✅ Publicado' : '🔒 Sin permiso',
              media,
            }),
          },
        },
      ],
    }),

    // --- prensa ---
    defineField({
      name: 'press',
      title: 'Cita de prensa',
      type: 'object',
      group: 'press',
      description:
        'La cita solo aparece en la web si el campo "Cita" tiene texto. Vacíalo para retirar la sección.',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: 'quote',
          title: 'Cita',
          type: 'localeString',
        }),
        defineField({
          name: 'sourceName',
          title: 'Medio',
          type: 'string',
          description: 'Por ejemplo: Forbes España, marzo de 2025.',
        }),
        defineField({
          name: 'sourceUrl',
          title: 'Enlace al artículo',
          type: 'url',
        }),
        defineField({
          name: 'portrait',
          title: 'Retrato',
          type: 'image',
          options: {hotspot: true},
          description: 'Opcional. Sin él la cita ocupa todo el ancho.',
          fields: [
            defineField({
              name: 'alt',
              title: 'Texto alternativo',
              type: 'localeString',
              description:
                'Describe la foto para quien no puede verla. Déjalo vacío si es puramente decorativa.',
            }),
          ],
        }),
      ],
    }),

    defineField({name: 'email', title: 'Email', type: 'string', group: 'contact', initialValue: 'events@b-events.es'}),
    defineField({
      name: 'phone',
      title: 'Teléfono',
      type: 'string',
      group: 'contact',
      description: 'Déjalo vacío si no quieres publicar el número.',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp',
      type: 'url',
      group: 'contact',
      description: 'Formato https://wa.me/34XXXXXXXXX',
    }),
    defineField({
      name: 'showPhonePublicly',
      title: 'Mostrar el teléfono en la web',
      type: 'boolean',
      group: 'contact',
      initialValue: false,
    }),

    defineField({name: 'legalName', title: 'Nombre fiscal', type: 'string', group: 'legal', initialValue: 'Barbara Juan Portoles Events SL'}),
    defineField({name: 'nif', title: 'NIF', type: 'string', group: 'legal', initialValue: 'B93941276'}),
    defineField({
      name: 'address',
      title: 'Dirección fiscal',
      type: 'text',
      rows: 3,
      group: 'legal',
      initialValue: 'Paseo de Sant Gervasio 57 bis, 3º 3ª\n08022 Barcelona',
    }),

    defineField({name: 'defaultSeo', type: 'seo', group: 'meta'}),
  ],
  preview: {prepare: () => ({title: 'Configuración del sitio'})},
})
