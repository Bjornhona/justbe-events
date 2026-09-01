import {defineType, defineField} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Título para buscadores',
      type: 'localeString',
      description: 'Máximo ~60 caracteres. Si se deja vacío se usa el título de la página.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Descripción para buscadores',
      type: 'localeText',
      description: 'Máximo ~155 caracteres.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Imagen para compartir',
      type: 'image',
      description: '1200 × 630 px.',
    }),
  ],
})
