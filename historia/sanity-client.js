import {createClient} from 'https://esm.sh/@sanity/client@7.25.0'
import {createImageUrlBuilder} from 'https://esm.sh/@sanity/image-url@2.1.1'

export const sanityConfig = Object.freeze({
  projectId: 't3wmz9p4',
  dataset: 'production',
  apiVersion: '2026-03-01',
  useCdn: true,
  perspective: 'published',
})

export const sanityClient = createClient(sanityConfig)

export const projectsQuery = `
  *[_type == "project"]
    | order(year desc, title asc) {
      _id,
      title,
      client,
      category,
      location,
      year,
      shortDescription,
      mainImage {
        asset,
        crop,
        hotspot,
        alt
      },
      gallery[] {
        asset,
        crop,
        hotspot,
        alt,
        caption
      }
    }
`

const imageBuilder = createImageUrlBuilder(sanityClient)

export function buildProjectImageUrl(source) {
  if (!source?.asset) return ''

  return imageBuilder
    .image(source)
    .width(900)
    .height(675)
    .fit('crop')
    .auto('format')
    .quality(85)
    .url()
}

export function buildProjectLightboxImageUrl(source) {
  if (!source?.asset) return ''

  return imageBuilder
    .image(source)
    .width(1800)
    .fit('max')
    .auto('format')
    .quality(90)
    .url()
}

export function fetchPublishedProjects() {
  return sanityClient.fetch(projectsQuery)
}
