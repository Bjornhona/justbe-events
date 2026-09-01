import {defineType, defineField} from 'sanity'

// Aviso legal, política de privacidad, política de cookies.
// Content is drafted by Åsa; kept in Sanity so it can be corrected
// without a deploy if the fiscal data ever changes.
export const legalPage = defineType({
  name: 'legalPage',
  title: 'Página legal',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Título', type: 'localeString', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      options: {source: 'title.es'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'body', title: 'Contenido', type: 'localeBlock'}),
    defineField({
      name: 'lastUpdated',
      title: 'Última actualización',
      type: 'date',
      initialValue: () => new Date().toISOString().slice(0, 10),
    }),
  ],
  preview: {select: {title: 'title.es', subtitle: 'lastUpdated'}},
})
