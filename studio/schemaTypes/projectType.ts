import {defineArrayMember, defineField, defineType} from 'sanity'

const currentYear = new Date().getFullYear()

export const projectType = defineType({
  name: 'project',
  title: 'Proyecto',
  type: 'document',
  groups: [
    {name: 'content', title: 'Contenido', default: true},
    {name: 'images', title: 'Imágenes'},
    {name: 'publication', title: 'Publicación'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'client',
      title: 'Cliente',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Vía pública', value: 'via-publica'},
          {title: 'Metro', value: 'metro'},
          {title: 'Aeropuerto', value: 'aeropuerto'},
          {title: 'Centro comercial', value: 'centro-comercial'},
          {title: 'Estadio', value: 'estadio'},
          {title: 'Móvil', value: 'movil'},
          {title: 'Otro', value: 'otro'},
        ],
        layout: 'dropdown',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Ubicación',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: 'year',
      title: 'Año',
      type: 'number',
      group: 'content',
      validation: (rule) =>
        rule.integer().min(1900).max(currentYear + 1).warning('Revisa el año del proyecto.'),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Descripción corta',
      type: 'text',
      rows: 3,
      group: 'content',
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: 'fullDescription',
      title: 'Descripción completa',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'mainImage',
      title: 'Imagen principal',
      type: 'image',
      group: 'images',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
          description: 'Describe brevemente lo que muestra la imagen.',
          validation: (rule) => rule.required().max(160),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Galería de imágenes',
      type: 'array',
      group: 'images',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Texto alternativo',
              type: 'string',
              validation: (rule) => rule.required().max(160),
            }),
            defineField({
              name: 'caption',
              title: 'Pie de imagen',
              type: 'string',
              validation: (rule) => rule.max(160),
            }),
          ],
        }),
      ],
      options: {layout: 'grid'},
    }),
    defineField({
      name: 'featured',
      title: 'Proyecto destacado',
      type: 'boolean',
      group: 'publication',
      initialValue: false,
    }),
    defineField({
      name: 'published',
      title: 'Publicado',
      type: 'boolean',
      group: 'publication',
      description: 'Permite preparar un proyecto antes de mostrarlo en el sitio.',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Orden de aparición',
      type: 'number',
      group: 'publication',
      description: 'Los números menores aparecerán primero.',
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  orderings: [
    {
      title: 'Orden de aparición',
      name: 'appearanceOrder',
      by: [
        {field: 'order', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
    {
      title: 'Más recientes',
      name: 'yearDesc',
      by: [{field: 'year', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      client: 'client',
      location: 'location',
      media: 'mainImage',
      published: 'published',
    },
    prepare({title, client, location, media, published}) {
      const details = [client, location].filter(Boolean).join(' · ')
      return {
        title: `${published ? '' : 'Borrador · '}${title}`,
        subtitle: details,
        media,
      }
    },
  },
})

