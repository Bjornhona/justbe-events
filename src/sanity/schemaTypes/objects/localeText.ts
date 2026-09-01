import {defineType, defineField} from 'sanity'
import {LANGUAGES} from './localeString'

export const localeText = defineType({
  name: 'localeText',
  title: 'Texto largo',
  type: 'object',
  fields: LANGUAGES.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'text',
      rows: 4,
    }),
  ),
})
