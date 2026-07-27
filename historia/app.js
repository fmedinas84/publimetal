import {buildProjectImageUrl, fetchPublishedProjects} from './sanity-client.js'

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

const categorySlugs = new Map()
const categoryLabels = {
  'via-publica': 'Vía pública',
  metro: 'Metro',
  aeropuerto: 'Aeropuerto',
  'centro-comercial': 'Centro comercial',
  estadio: 'Estadio',
  movil: 'Móvil',
  otro: 'Otro',
}
const decadeOrder = ['2020-actualidad', '2010-2019', '2000-2009', '1990-1999', '1980-1989', 'sin-fecha']
const decadeLabels = {
  '2020-actualidad': '2020 — actualidad',
  '2010-2019': '2010 — 2019',
  '2000-2009': '2000 — 2009',
  '1990-1999': '1990 — 1999',
  '1980-1989': '1980 — 1989',
  'sin-fecha': 'Fecha por documentar',
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function getDecade(project) {
  if (!Number.isInteger(project.anio)) return 'sin-fecha'
  if (project.anio >= 2020) return '2020-actualidad'
  const start = Math.floor(project.anio / 10) * 10
  return `${start}-${start + 9}`
}

function mapSanityProject(project) {
  const category = categoryLabels[project.category] || project.category || categoryLabels.otro

  return {
    id: project._id,
    titulo: project.title,
    anio: Number.isInteger(project.year) ? project.year : null,
    cliente: project.client || '',
    ubicacion: project.location || '',
    categoria: category,
    imagen: buildProjectImageUrl(project.mainImage),
    imagenAlt: project.mainImage?.alt || '',
    descripcion: project.shortDescription || '',
  }
}

function createProjectCard(project) {
  const article = document.createElement('article')
  article.className = 'history-card'

  const media = document.createElement('div')
  media.className = 'history-card-media'

  if (project.imagen) {
    const image = document.createElement('img')
    image.src = project.imagen
    image.alt = project.imagenAlt || `${project.titulo}${project.ubicacion ? `, ${project.ubicacion}` : ''}`
    image.loading = 'lazy'
    image.decoding = 'async'
    media.append(image)
  }

  const category = document.createElement('span')
  category.className = 'history-card-category mono'
  category.textContent = project.categoria
  media.append(category)

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
    details.append(createDetail('Cliente', project.cliente))
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
  categorySlugs.clear()

  const categories = [...new Set(projects.map((project) => project.categoria).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, 'es'))

  categories.forEach((category) => {
    const slug = slugify(category)
    categorySlugs.set(category, slug)
    const option = document.createElement('option')
    option.value = slug
    option.textContent = category
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
      categoryFilter.value === 'all' || categorySlugs.get(project.categoria) === categoryFilter.value
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
  catalogStatus.textContent = `${filteredProjects.length} ${filteredProjects.length === 1 ? 'proyecto' : 'proyectos'}`

  if (!projects.length) {
    setEmptyState({
      title: 'Todavía no hay proyectos publicados.',
      description: 'Los proyectos aparecerán aquí después de publicarlos en Sanity.',
    })
    return
  }

  if (!filteredProjects.length) {
    setEmptyState({
      title: 'No hay proyectos documentados con estos filtros.',
      description: 'Prueba otra década o categoría para continuar explorando.',
      actionLabel: 'Ver todos los proyectos',
    })
    return
  }

  const groupedProjects = filteredProjects.reduce((groups, project) => {
    const decade = getDecade(project)
    if (!groups.has(decade)) groups.set(decade, [])
    groups.get(decade).push(project)
    return groups
  }, new Map())

  const orderedDecades = decadeOrder
    .filter((decade) => groupedProjects.has(decade))
    .sort((first, second) => {
      if (first === 'sin-fecha') return 1
      if (second === 'sin-fecha') return -1
      const direction = sortOrder.value === 'asc' ? -1 : 1
      return (decadeOrder.indexOf(first) - decadeOrder.indexOf(second)) * direction
    })

  orderedDecades.forEach((decade) => {
    const section = document.createElement('section')
    section.className = 'decade-group'
    section.setAttribute('aria-labelledby', `decade-${decade}`)

    const header = document.createElement('div')
    header.className = 'decade-heading'

    const title = document.createElement('h3')
    title.id = `decade-${decade}`
    title.textContent = decadeLabels[decade] || decade

    const count = document.createElement('span')
    const total = groupedProjects.get(decade).length
    count.className = 'mono'
    count.textContent = `${total} ${total === 1 ? 'proyecto' : 'proyectos'}`

    const grid = document.createElement('div')
    grid.className = 'history-grid'
    groupedProjects.get(decade).forEach((project) => grid.append(createProjectCard(project)))

    header.append(title, count)
    section.append(header, grid)
    catalogGroups.append(section)
  })
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
  catalogStatus.textContent = 'Cargando proyectos…'
  setEmptyState({
    title: 'Cargando proyectos…',
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
    catalogStatus.textContent = 'No fue posible cargar los proyectos'
    setEmptyState({
      title: 'No pudimos cargar los proyectos.',
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

loadProjects()
