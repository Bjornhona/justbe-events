import {defineType, defineField} from 'sanity'

/**
 * The permission model is the important part of this schema.
 *
 * `permissionGranted` is false by default. While it is false the site renders
 * `anonymousLabel` ("una multinacional de alimentación") instead of `client`,
 * and hides the client logo. When the written permission email arrives from the
 * brand, Barbara flips the toggle — no deploy, no developer.
 *
 * This is what keeps brand clearance off the critical path.
 */
export const project = defineType({
  name: 'project',
  title: 'Proyecto',
  type: 'document',
  groups: [
    {name: 'identity', title: 'Cliente y permisos', default: true},
    {name: 'content', title: 'Contenido'},
    {name: 'media', title: 'Imágenes'},
    {name: 'meta', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Título del proyecto',
      type: 'localeString',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      group: 'identity',
      options: {source: 'title.es', maxLength: 72},
      validation: (Rule) => Rule.required(),
    }),

    // --- permission model ---
    defineField({
      name: 'permissionGranted',
      title: '¿Tenemos permiso por escrito de la marca?',
      type: 'boolean',
      group: 'identity',
      initialValue: false,
      description:
        'Actívalo SOLO cuando tengas el email de la marca autorizando el uso de su nombre. Mientras esté desactivado la web muestra la descripción anónima.',
    }),
    defineField({
      name: 'client',
      title: 'Nombre real del cliente',
      type: 'string',
      group: 'identity',
      description: 'Solo se publica si el permiso está activado.',
    }),
    defineField({
      name: 'anonymousLabel',
      title: 'Descripción anónima',
      type: 'localeString',
      group: 'identity',
      description: 'Ej. "una multinacional de alimentación". Se usa cuando no hay permiso.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'clientLogo',
      title: 'Logotipo del cliente',
      type: 'image',
      group: 'identity',
      description: 'Solo se publica si el permiso está activado.',
    }),

    // --- facts ---
    defineField({
      name: 'eventType',
      title: 'Tipo de evento',
      type: 'localeString',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'city', title: 'Ciudad', type: 'string', group: 'content'}),
    defineField({
      name: 'year',
      title: 'Año',
      type: 'number',
      group: 'content',
      validation: (Rule) => Rule.min(2000).max(2030).integer(),
    }),
    defineField({
      name: 'attendees',
      title: 'Nº de asistentes',
      type: 'number',
      group: 'content',
      description: 'Opcional. Da mucha credibilidad cuando la cifra es grande.',
    }),
    defineField({
      name: 'pillar',
      title: 'Pilar principal',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Imagine', value: 'imagine'},
          {title: 'Build', value: 'build'},
          {title: 'Live', value: 'live'},
        ],
        layout: 'radio',
      },
    }),

    // --- narrative: fixed fields, not free rich text ---
    defineField({
      name: 'challenge',
      title: 'El reto',
      type: 'localeText',
      group: 'content',
      description: 'Qué pedía el cliente. Máximo 300 caracteres.',
      validation: (Rule) => Rule.custom((v?: {es?: string; en?: string}) => {
        if (v?.es && v.es.length > 300) return 'Máximo 300 caracteres en español'
        if (v?.en && v.en.length > 300) return 'Máximo 300 caracteres en inglés'
        return true
      }),
    }),
    defineField({
      name: 'whatWeDid',
      title: 'Qué hicimos',
      type: 'localeText',
      group: 'content',
      description: 'Máximo 600 caracteres.',
      validation: (Rule) => Rule.custom((v?: {es?: string; en?: string}) => {
        if (v?.es && v.es.length > 600) return 'Máximo 600 caracteres en español'
        if (v?.en && v.en.length > 600) return 'Máximo 600 caracteres en inglés'
        return true
      }),
    }),
    defineField({
      name: 'result',
      title: 'El resultado',
      type: 'localeText',
      group: 'content',
      description: 'Máximo 300 caracteres.',
      validation: (Rule) => Rule.custom((v?: {es?: string; en?: string}) => {
        if (v?.es && v.es.length > 300) return 'Máximo 300 caracteres en español'
        if (v?.en && v.en.length > 300) return 'Máximo 300 caracteres en inglés'
        return true
      }),
    }),

    // --- media ---
    defineField({
      name: 'heroImage',
      title: 'Imagen principal',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'localeString', title: 'Texto alternativo'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Galería',
      type: 'array',
      group: 'media',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [{name: 'alt', type: 'localeString', title: 'Texto alternativo'}],
        },
      ],
      validation: (Rule) => Rule.max(6),
      description: 'Máximo 6 imágenes.',
    }),
    defineField({
      name: 'isPlaceholder',
      title: 'Imágenes provisionales',
      type: 'boolean',
      group: 'media',
      initialValue: true,
      description: 'Marcado mientras las imágenes sean genéricas y no fotos reales del evento.',
    }),

    defineField({
      name: 'featured',
      title: 'Destacado en la home',
      type: 'boolean',
      group: 'content',
      initialValue: false,
    }),
    defineField({name: 'order', title: 'Orden', type: 'number', group: 'content'}),
    defineField({name: 'seo', type: 'seo', group: 'meta'}),
  ],
  orderings: [
    {title: 'Orden manual', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
    {title: 'Año, más reciente', name: 'yearDesc', by: [{field: 'year', direction: 'desc'}]},
  ],
  preview: {
    select: {
      title: 'title.es',
      client: 'client',
      anon: 'anonymousLabel.es',
      granted: 'permissionGranted',
      year: 'year',
      media: 'heroImage',
    },
    prepare({title, client, anon, granted, year, media}) {
      return {
        title: title || 'Sin título',
        subtitle: `${granted ? `✅ ${client ?? ''}` : `🔒 ${anon ?? 'anónimo'}`}${year ? ` · ${year}` : ''}`,
        media,
      }
    },
  },
})
