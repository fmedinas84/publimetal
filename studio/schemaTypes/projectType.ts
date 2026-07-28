import {defineArrayMember, defineField, defineType} from 'sanity'

const currentYear = new Date().getFullYear()
const projectCategories = [
  {title: 'Publicidad estática', value: 'publicidad-estatica'},
  {title: 'Soportes digitales', value: 'soportes-digitales'},
  {title: 'Proyectos especiales', value: 'proyectos-especiales'},
]
const projectCategoryValues = new Set(projectCategories.map(({value}) => value))

function isValidYouTubeUrl(value: string) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    let videoId = ''

    if (!['http:', 'https:'].includes(url.protocol)) return false

    if (hostname === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || ''
    } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || ''
      } else if (url.pathname.startsWith('/shorts/')) {
        videoId = url.pathname.split('/')[2] || ''
      }
    }

    return /^[A-Za-z0-9_-]{11}$/.test(videoId)
  } catch {
    return false
  }
}

export const projectType = defineType({
  name: 'project',
  title: 'Proyectos',
  type: 'document',
  groups: [
    {name: 'content', title: 'Información principal', default: true},
    {name: 'classification', title: 'Clasificación'},
    {name: 'images', title: 'Contenido multimedia'},
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
      title: 'Solicitado por',
      type: 'string',
      group: 'content',
      description: 'Empresa u organización que solicitó el trabajo.',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      group: 'classification',
      description: 'Selecciona una de las tres categorías disponibles.',
      options: {
        list: projectCategories,
        layout: 'dropdown',
      },
      validation: (rule) =>
        rule.required().custom((value) =>
          !value || projectCategoryValues.has(value)
            ? true
            : 'Selecciona Publicidad estática, Soportes digitales o Proyectos especiales.',
        ),
    }),
    defineField({
      name: 'location',
      title: 'Ubicación',
      type: 'string',
      group: 'classification',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: 'year',
      title: 'Año',
      type: 'number',
      group: 'classification',
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
      name: 'youtubeUrl',
      title: 'Video de YouTube',
      type: 'url',
      group: 'images',
      description:
        'Opcional. Pega la URL completa del video de YouTube. Se mostrará una miniatura en Trayectoria.',
      validation: (rule) =>
        rule.custom((value) =>
          !value || isValidYouTubeUrl(value)
            ? true
            : 'Ingresa una URL válida de YouTube, youtu.be o YouTube Shorts.',
        ),
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

