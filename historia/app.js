import {
  buildProjectImageUrl,
  buildProjectLightboxImageUrl,
  fetchPublishedProjects,
} from './sanity-client.js?v=20260727-3'

let projects = []
let emptyActionMode = 'reset'

const decadeFilter = document.getElementById('decadeFilter')
const yearFilter = document.getElementById('yearFilter')
const categoryFilter = document.getElementById('categoryFilter')
const sortOrder = document.getElementById('sortOrder')
const resetFilters = document.getElementById('resetFilters')
const catalogGroups = document.getElementById('catalogGroups')
const catalogStatus = document.getElementById('catalogStatus')
const emptyState = document.getElementById('emptyState')
const emptyTitle = document.getElementById('emptyTitle')
const emptyDescription = document.getElementById('emptyDescription')
const emptyAction = document.getElementById('emptyAction')
const menuButton = document.getElementById('menuButton')
const navLinks = document.getElementById('navLinks')
const lightbox = document.getElementById('trajectoryLightbox')
const lightboxImage = lightbox.querySelector('.trajectory-lightbox-image')
const lightboxTitle = document.getElementById('trajectoryLightboxTitle')
const lightboxCount = lightbox.querySelector('.trajectory-lightbox-count')
const closeLightboxButton = lightbox.querySelector('.trajectory-lightbox-close')
const previousImageButton = lightbox.querySelector('.trajectory-lightbox-prev')
const nextImageButton = lightbox.querySelector('.trajectory-lightbox-next')
const videoModal = document.getElementById('trajectoryVideoModal')
const videoDialog = videoModal.querySelector('.trajectory-video-dialog')
const videoTitle = document.getElementById('trajectoryVideoTitle')
const videoFrameWrap = videoModal.querySelector('.trajectory-video-frame')
const videoFrame = document.getElementById('trajectoryVideoFrame')
const closeVideoButton = videoModal.querySelector('.trajectory-video-close')

let lightboxImages = []
let activeImageIndex = 0
let lastFocusedElement = null
let lastVideoTrigger = null

const categoryLabels = {
  'publicidad-estatica': 'Publicidad estática',
  'soportes-digitales': 'Soportes digitales',
  'proyectos-especiales': 'Proyectos especiales',
}

function getYouTubeVideo(value) {
  if (!value) return null

  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    let id = ''
    let orientation = 'landscape'

    if (!['http:', 'https:'].includes(url.protocol)) return null

    if (hostname === 'youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0] || ''
    } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        id = url.searchParams.get('v') || ''
      } else if (url.pathname.startsWith('/shorts/')) {
        id = url.pathname.split('/')[2] || ''
        orientation = 'portrait'
      }
    }

    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null

    return {
      id,
      orientation,
      thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
      thumbnailFallback: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    }
  } catch {
    return null
  }
}

function getDecade(project) {
  if (!Number.isInteger(project.anio)) return 'sin-fecha'
  if (project.anio >= 2020) return '2020-actualidad'
  const start = Math.floor(project.anio / 10) * 10
  return `${start}-${start + 9}`
}

function mapSanityProject(project) {
  const category = categoryLabels[project.category] || ''
  const imageSources = [project.mainImage, ...(project.gallery || [])].filter((image) => image?.asset)
  const uniqueImageSources = imageSources.filter(
    (image, index, images) => {
      const assetReference = image.asset?._ref
      return (
        !assetReference ||
        images.findIndex((candidate) => candidate.asset?._ref === assetReference) === index
      )
    },
  )
  const images = uniqueImageSources.map((image) => ({
    src: buildProjectLightboxImageUrl(image),
    alt: image.alt || '',
  }))

  return {
    id: project._id,
    titulo: project.title,
    anio: Number.isInteger(project.year) ? project.year : null,
    cliente: project.client || '',
    ubicacion: project.location || '',
    categoria: category,
    categoriaValor: category ? project.category : '',
    imagen: buildProjectImageUrl(project.mainImage),
    imagenAlt: project.mainImage?.alt || '',
    imagenes: images,
    video: getYouTubeVideo(project.youtubeUrl),
    descripcion: project.shortDescription || '',
  }
}

function trackProjectView(project) {
  const parameters = {
    project_name: project.titulo,
  }

  if (Number.isInteger(project.anio)) parameters.project_year = project.anio
  if (project.categoria) parameters.project_category = project.categoria

  window.trackPublimetalEvent?.('view_project', parameters)
}

function createProjectCard(project) {
  const article = document.createElement('article')
  article.className = 'history-card'

  const media = document.createElement('div')
  media.className = 'history-card-media'

  if (project.video) {
    const videoButton = document.createElement('button')
    videoButton.className = 'history-card-video-button'
    videoButton.type = 'button'
    videoButton.setAttribute('aria-label', `Ver video de ${project.titulo}`)

    const thumbnail = document.createElement('img')
    thumbnail.src = project.video.thumbnail
    thumbnail.alt = `Miniatura del video de ${project.titulo}`
    thumbnail.loading = 'lazy'
    thumbnail.decoding = 'async'
    thumbnail.referrerPolicy = 'strict-origin-when-cross-origin'
    thumbnail.addEventListener('error', () => {
      if (thumbnail.src !== project.video.thumbnailFallback) {
        thumbnail.src = project.video.thumbnailFallback
      } else if (project.imagen && thumbnail.src !== project.imagen) {
        thumbnail.src = project.imagen
      }
    })

    const playIndicator = document.createElement('span')
    playIndicator.className = 'history-card-play'
    playIndicator.setAttribute('aria-hidden', 'true')
    playIndicator.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="m9 7 8 5-8 5V7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'

    videoButton.append(thumbnail, playIndicator)
    videoButton.addEventListener('click', () => openVideoModal(project))
    media.append(videoButton)

    if (project.imagenes.length) {
      const galleryButton = document.createElement('button')
      galleryButton.className = 'history-card-gallery-button'
      galleryButton.type = 'button'
      galleryButton.setAttribute(
        'aria-label',
        project.imagenes.length > 1
          ? `Abrir galería de ${project.imagenes.length} imágenes de ${project.titulo}`
          : `Ampliar imagen de ${project.titulo}`,
      )
      galleryButton.innerHTML =
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="m7 16 3.2-3.2 2.4 2.4 1.8-1.8L18 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="15.5" cy="9.5" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>'
      galleryButton.addEventListener('click', () => openLightbox(project))
      media.append(galleryButton)
    }
  } else if (project.imagen) {
    const imageButton = document.createElement('button')
    imageButton.className = 'history-card-image-button'
    imageButton.type = 'button'
    imageButton.setAttribute(
      'aria-label',
      project.imagenes.length > 1
        ? `Abrir galería de ${project.imagenes.length} imágenes de ${project.titulo}`
        : `Ampliar imagen de ${project.titulo}`,
    )

    const image = document.createElement('img')
    image.src = project.imagen
    image.alt = project.imagenAlt || `${project.titulo}${project.ubicacion ? `, ${project.ubicacion}` : ''}`
    image.loading = 'lazy'
    image.decoding = 'async'

    const expandIndicator = document.createElement('span')
    expandIndicator.className = 'history-card-expand'
    expandIndicator.setAttribute('aria-hidden', 'true')
    expandIndicator.innerHTML =
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'

    imageButton.append(image, expandIndicator)
    imageButton.addEventListener('click', () => openLightbox(project))
    media.append(imageButton)
  }

  if (project.categoria) {
    const category = document.createElement('span')
    category.className = 'history-card-category mono'
    category.textContent = project.categoria
    media.append(category)
  }

  const body = document.createElement('div')
  body.className = 'history-card-body'

  const meta = document.createElement('div')
  meta.className = 'history-card-meta mono'

  const year = document.createElement('span')
  year.textContent = Number.isInteger(project.anio) ? project.anio : 'Año por documentar'
  meta.append(year)

  const title = document.createElement('h3')
  title.textContent = project.titulo

  const details = document.createElement('dl')
  details.className = 'history-card-details'

  if (project.cliente) {
    details.append(createDetail('Solicitado por', project.cliente))
  }

  if (project.ubicacion) {
    details.append(createDetail('Ubicación', project.ubicacion))
  }

  body.append(meta, title)
  if (details.children.length) body.append(details)

  if (project.descripcion) {
    const description = document.createElement('p')
    description.textContent = project.descripcion
    body.append(description)
  }

  article.append(media, body)
  return article
}

function createDetail(label, value) {
  const wrapper = document.createElement('div')
  const term = document.createElement('dt')
  const detail = document.createElement('dd')
  term.textContent = label
  detail.textContent = value
  wrapper.append(term, detail)
  return wrapper
}

function populateCategories() {
  while (categoryFilter.options.length > 1) categoryFilter.remove(1)

  Object.entries(categoryLabels).forEach(([value, label]) => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = label
    categoryFilter.append(option)
  })
}

function populateYears() {
  while (yearFilter.options.length > 1) yearFilter.remove(1)
  yearFilter.options[0].textContent = 'Todos los años'
  yearFilter.disabled = false

  const years = [...new Set(projects.map((project) => project.anio).filter(Number.isInteger))]
    .sort((first, second) => second - first)

  if (!years.length) {
    yearFilter.options[0].textContent = 'Años por documentar'
    yearFilter.disabled = true
    return
  }

  years.forEach((year) => {
    const option = document.createElement('option')
    option.value = String(year)
    option.textContent = String(year)
    yearFilter.append(option)
  })
}

function getFilteredProjects() {
  const filtered = projects.filter((project) => {
    const matchesDecade = decadeFilter.value === 'all' || getDecade(project) === decadeFilter.value
    const matchesYear = yearFilter.value === 'all' || String(project.anio) === yearFilter.value
    const matchesCategory =
      categoryFilter.value === 'all' || project.categoriaValor === categoryFilter.value
    return matchesDecade && matchesYear && matchesCategory
  })

  return filtered.sort((first, second) => {
    const firstYear = Number.isInteger(first.anio) ? first.anio : null
    const secondYear = Number.isInteger(second.anio) ? second.anio : null

    if (firstYear === null && secondYear !== null) return 1
    if (firstYear !== null && secondYear === null) return -1
    if (firstYear !== secondYear) {
      return sortOrder.value === 'asc' ? firstYear - secondYear : secondYear - firstYear
    }
    return first.titulo.localeCompare(second.titulo, 'es')
  })
}

function getCatalogStatusText(count) {
  const total = `${count} ${count === 1 ? 'proyecto' : 'proyectos'}`
  const contexts = []

  if (categoryFilter.value !== 'all') {
    contexts.push(categoryFilter.options[categoryFilter.selectedIndex].textContent)
  }

  if (yearFilter.value !== 'all') {
    contexts.push(yearFilter.options[yearFilter.selectedIndex].textContent)
  } else if (decadeFilter.value !== 'all') {
    contexts.push(decadeFilter.options[decadeFilter.selectedIndex].textContent)
  }

  return contexts.length ? `${total} en ${contexts.join(' · ')}` : total
}

function updateFilterStates() {
  ;[decadeFilter, yearFilter, categoryFilter].forEach((control) => {
    control.closest('.filter-field').classList.toggle('is-active', control.value !== 'all')
  })
  sortOrder.closest('.filter-field').classList.toggle('is-active', sortOrder.value !== 'desc')
}

function setEmptyState({title, description, actionLabel = '', actionMode = 'reset'}) {
  emptyTitle.textContent = title
  emptyDescription.textContent = description
  emptyAction.textContent = actionLabel
  emptyAction.hidden = !actionLabel
  emptyActionMode = actionMode
  emptyState.hidden = false
}

function renderCatalog() {
  const filteredProjects = getFilteredProjects()
  catalogGroups.replaceChildren()
  emptyState.hidden = true
  catalogStatus.textContent = getCatalogStatusText(filteredProjects.length)
  updateFilterStates()

  if (!projects.length) {
    setEmptyState({
      title: 'Todavía no hay casos publicados.',
      description: 'Las nuevas obras aparecerán aquí después de publicarlas en Sanity.',
    })
    return
  }

  if (!filteredProjects.length) {
    setEmptyState({
      title: 'No hay resultados para estos filtros.',
      description: 'Prueba otra década o categoría para continuar explorando.',
      actionLabel: 'Ver catálogo completo',
    })
    return
  }

  const grid = document.createElement('div')
  grid.className = 'history-grid'
  filteredProjects.forEach((project) => grid.append(createProjectCard(project)))
  catalogGroups.append(grid)
}

function updateLightboxImage() {
  const image = lightboxImages[activeImageIndex]
  const imageCount = lightboxImages.length

  lightboxImage.src = image.src
  lightboxImage.alt = image.alt
  lightboxCount.textContent = imageCount > 1 ? `${activeImageIndex + 1} de ${imageCount}` : ''
  previousImageButton.hidden = imageCount < 2
  nextImageButton.hidden = imageCount < 2
}

function openLightbox(project) {
  if (!project.imagenes.length) return

  trackProjectView(project)
  lightboxImages = project.imagenes.map((image, index) => ({
    ...image,
    alt: image.alt || `${project.titulo} — imagen ${index + 1}`,
  }))
  activeImageIndex = 0
  lastFocusedElement = document.activeElement
  lightboxTitle.textContent = project.titulo
  updateLightboxImage()
  lightbox.classList.add('open')
  lightbox.setAttribute('aria-hidden', 'false')
  document.body.classList.add('lightbox-open')
  closeLightboxButton.focus()
}

function closeLightbox() {
  lightbox.classList.remove('open')
  lightbox.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('lightbox-open')
  lightboxImage.removeAttribute('src')
  lightboxImages = []
  lastFocusedElement?.focus()
}

function showAdjacentImage(direction) {
  activeImageIndex = (activeImageIndex + direction + lightboxImages.length) % lightboxImages.length
  updateLightboxImage()
}

function trapModalFocus(event, container) {
  if (event.key !== 'Tab') return

  const focusableElements = [
    ...container.querySelectorAll('button:not([hidden]), iframe, [tabindex]:not([tabindex="-1"])'),
  ].filter((element) => !element.disabled)
  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

function openVideoModal(project) {
  if (!project.video) return

  trackProjectView(project)
  const origin = encodeURIComponent(window.location.origin)
  lastVideoTrigger = document.activeElement
  videoTitle.textContent = project.titulo
  videoFrameWrap.classList.toggle('portrait', project.video.orientation === 'portrait')
  videoFrame.src = `https://www.youtube-nocookie.com/embed/${project.video.id}?rel=0&playsinline=1&origin=${origin}`
  videoFrame.title = `Video de ${project.titulo}`
  videoModal.classList.add('open')
  videoModal.setAttribute('aria-hidden', 'false')
  document.body.classList.add('lightbox-open')
  closeVideoButton.focus()
}

function closeVideoModal() {
  videoModal.classList.remove('open')
  videoModal.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('lightbox-open')
  videoFrame.removeAttribute('src')
  lastVideoTrigger?.focus()
}

function clearFilters() {
  decadeFilter.value = 'all'
  yearFilter.value = 'all'
  categoryFilter.value = 'all'
  sortOrder.value = 'desc'
  renderCatalog()
}

async function loadProjects() {
  catalogGroups.replaceChildren()
  catalogStatus.textContent = 'Cargando catálogo…'
  setEmptyState({
    title: 'Cargando catálogo…',
    description: 'Consultando el catálogo publicado en Sanity.',
  })

  try {
    const sanityProjects = await fetchPublishedProjects()
    projects = sanityProjects.map(mapSanityProject)
    populateCategories()
    populateYears()
    clearFilters()
  } catch (error) {
    console.error('Error al cargar proyectos desde Sanity:', error)
    projects = []
    catalogStatus.textContent = 'No fue posible cargar el catálogo'
    setEmptyState({
      title: 'No pudimos cargar el catálogo.',
      description: 'Revisa tu conexión e intenta nuevamente.',
      actionLabel: 'Reintentar',
      actionMode: 'retry',
    })
  }
}

;[decadeFilter, yearFilter, categoryFilter, sortOrder].forEach((control) => {
  control.addEventListener('change', renderCatalog)
})

resetFilters.addEventListener('click', clearFilters)
emptyAction.addEventListener('click', () => {
  if (emptyActionMode === 'retry') {
    loadProjects()
    return
  }
  clearFilters()
})

closeLightboxButton.addEventListener('click', closeLightbox)
previousImageButton.addEventListener('click', () => showAdjacentImage(-1))
nextImageButton.addEventListener('click', () => showAdjacentImage(1))
lightbox.addEventListener('click', (event) => {
  if (
    !event.target.closest('.trajectory-lightbox-figure') &&
    !event.target.closest('.trajectory-lightbox-close') &&
    !event.target.closest('.trajectory-lightbox-nav')
  ) {
    closeLightbox()
  }
})

closeVideoButton.addEventListener('click', closeVideoModal)
videoModal.addEventListener('click', (event) => {
  if (event.target === videoModal || !videoDialog.contains(event.target)) closeVideoModal()
})

document.addEventListener('keydown', (event) => {
  if (lightbox.classList.contains('open')) {
    if (event.key === 'Escape') closeLightbox()
    if (event.key === 'ArrowLeft' && !previousImageButton.hidden) showAdjacentImage(-1)
    if (event.key === 'ArrowRight' && !nextImageButton.hidden) showAdjacentImage(1)
    trapModalFocus(event, lightbox)
    return
  }

  if (videoModal.classList.contains('open')) {
    if (event.key === 'Escape') closeVideoModal()
    trapModalFocus(event, videoModal)
  }
})

menuButton.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open')
  menuButton.setAttribute('aria-expanded', String(isOpen))
  menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú')
})

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open')
    menuButton.setAttribute('aria-expanded', 'false')
    menuButton.setAttribute('aria-label', 'Abrir menú')
  })
})

document.getElementById('currentYear').textContent = new Date().getFullYear()

if (window.location.protocol === 'file:') {
  console.warn('Los videos de YouTube deben probarse mediante http:// o https://.')
}

loadProjects()
