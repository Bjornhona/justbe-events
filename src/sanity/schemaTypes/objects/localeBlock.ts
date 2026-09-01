import {defineType, defineField} from 'sanity'
import {LANGUAGES} from './localeString'

// Rich text, used ONLY for blog posts and legal pages.
// Project pages deliberately use plain fields so Barbara cannot break the layout.
export const localeBlock = defineType({
  name: 'localeBlock',
  title: 'Contenido',
  type: 'object',
  fields: LANGUAGES.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Titular', value: 'h2'},
            {title: 'Subtitular', value: 'h3'},
            {title: 'Cita', value: 'blockquote'},
          ],
          lists: [{title: 'Lista', value: 'bullet'}],
          marks: {
            decorators: [
              {title: 'Negrita', value: 'strong'},
              {title: 'Cursiva', value: 'em'},
            ],
          },
        },
        {
          type: 'image',
          options: {hotspot: true},
          fields: [{name: 'alt', type: 'localeString', title: 'Texto alternativo'}],
        },
      ],
    }),
  ),
})
