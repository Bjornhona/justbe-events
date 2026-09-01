import {defineType, defineField} from 'sanity'

export const LANGUAGES = [
  {id: 'es', title: 'Español', isDefault: true},
  {id: 'en', title: 'English'},
] as const

export const localeString = defineType({
  name: 'localeString',
  title: 'Texto corto',
  type: 'object',
  fields: LANGUAGES.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'string',
    }),
  ),
})
