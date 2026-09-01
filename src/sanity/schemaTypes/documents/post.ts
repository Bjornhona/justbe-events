import {defineType, defineField} from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Noticia',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Titular', type: 'localeString', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      options: {source: 'title.es', maxLength: 80},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Fecha de publicación',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'excerpt', title: 'Entradilla', type: 'localeText', description: 'Una o dos frases para el listado.'}),
    defineField({
      name: 'coverImage',
      title: 'Imagen de portada',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'localeString', title: 'Texto alternativo'}],
    }),
    defineField({name: 'body', title: 'Contenido', type: 'localeBlock'}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  orderings: [{title: 'Más reciente', name: 'dateDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {
    select: {title: 'title.es', date: 'publishedAt', media: 'coverImage'},
    prepare: ({title, date, media}) => ({
      title,
      subtitle: date ? new Date(date).toLocaleDateString('es-ES') : 'Sin fecha',
      media,
    }),
  },
})
