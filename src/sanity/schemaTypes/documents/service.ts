import {defineType, defineField} from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Servicio',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Nombre del servicio',
      type: 'localeString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'pillar',
      title: 'Pilar',
      type: 'string',
      options: {
        list: [
          {title: 'Imagine · Imaginamos', value: 'imagine'},
          {title: 'Build · Construimos', value: 'build'},
          {title: 'Live · Vivimos', value: 'live'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'localeText',
      description: 'Dos o tres frases. Máximo 400 caracteres.',
    }),
    defineField({name: 'order', title: 'Orden dentro del pilar', type: 'number'}),
  ],
  orderings: [{title: 'Pilar y orden', name: 'pillarOrder', by: [{field: 'pillar', direction: 'asc'}, {field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title.es', pillar: 'pillar'},
    prepare: ({title, pillar}) => ({title, subtitle: pillar}),
  },
})
