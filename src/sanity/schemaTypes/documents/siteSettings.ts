import {defineType, defineField} from 'sanity'

// Singleton. Everything that appears in the header, footer and legal notice
// lives here so nothing legally significant is hardcoded in the repo.
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Configuración del sitio',
  type: 'document',
  groups: [
    {name: 'brand', title: 'Marca', default: true},
    {name: 'numbers', title: 'Cifras'},
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
    defineField({name: 'yearsActive', title: 'Años de experiencia', type: 'number', group: 'numbers', validation: (Rule) => Rule.integer().min(0)}),
    defineField({name: 'eventsDelivered', title: 'Eventos realizados', type: 'number', group: 'numbers', validation: (Rule) => Rule.integer().min(0)}),
    defineField({name: 'attendeesTotal', title: 'Asistentes en total', type: 'number', group: 'numbers', validation: (Rule) => Rule.integer().min(0)}),
    defineField({name: 'countriesCount', title: 'Países', type: 'number', group: 'numbers', validation: (Rule) => Rule.integer().min(0)}),

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

    defineField({name: 'email', title: 'Email', type: 'string', group: 'contact', initialValue: 'info@b-events.es'}),
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
