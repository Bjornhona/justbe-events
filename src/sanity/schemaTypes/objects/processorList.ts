import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * The table of data processors in the privacy policy — who we send personal
 * data to, and what for.
 *
 * WHY THIS EXISTS AS A CUSTOM TYPE. Portable Text has no table. The source
 * document (`content/legal-es.md`) holds this as a two-column markdown table,
 * and the two halves of each row have to stay associated: "HubSpot, Inc." is
 * meaningless without the purpose beside it, and RGPD art. 13.1(e) is why the
 * pairing is in the policy at all. Flattening it into bullet points would keep
 * the words and lose the structure.
 *
 * Rendered as a definition list by `src/components/PortableText.tsx`.
 *
 * Plain strings, not `localeString`: this object is inserted inside one
 * language's array of `localeBlock`, so the language has already been chosen by
 * the field it sits in. Each language holds its own copy of the rows.
 */
export const processorList = defineType({
  name: 'processorList',
  title: 'Lista de encargados del tratamiento',
  type: 'object',
  fields: [
    defineField({
      name: 'rows',
      title: 'Proveedores',
      type: 'array',
      validation: (Rule) => Rule.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'processorRow',
          fields: [
            defineField({
              name: 'provider',
              title: 'Proveedor',
              type: 'string',
              description: 'Razón social completa, p. ej. "HubSpot, Inc."',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'purpose',
              title: 'Finalidad',
              type: 'text',
              rows: 2,
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {select: {title: 'provider', subtitle: 'purpose'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {rows: 'rows'},
    prepare: ({rows}: {rows?: unknown[]}) => ({
      title: 'Encargados del tratamiento',
      subtitle: `${rows?.length ?? 0} proveedor(es)`,
    }),
  },
})
