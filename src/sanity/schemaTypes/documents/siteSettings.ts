import {defineType, defineField} from 'sanity'

// Singleton. Everything that appears in the header, footer and legal notice
// lives here so nothing legally significant is hardcoded in the repo.
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Configuración del sitio',
  type: 'document',
  groups: [
    {name: 'brand', title: 'Marca', default: true},
    {name: 'contact', title: 'Contacto'},
    {name: 'legal', title: 'Datos fiscales'},
    {name: 'meta', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'brandName', title: 'Nombre comercial', type: 'string', group: 'brand', initialValue: 'Just Be Events'}),
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

    defineField({name: 'email', title: 'Email', type: 'string', group: 'contact', initialValue: 'info@justbe-events.com'}),
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
