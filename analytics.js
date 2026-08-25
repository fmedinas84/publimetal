(() => {
  const measurementId = 'G-GWD3QQQ4LF'

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('config', measurementId)

  if (!document.querySelector(`script[data-ga4-id="${measurementId}"]`)) {
    const googleTag = document.createElement('script')
    googleTag.async = true
    googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    googleTag.dataset.ga4Id = measurementId
    document.head.append(googleTag)
  }

  window.trackPublimetalEvent = (eventName, parameters = {}) => {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', eventName, parameters)
  }

  function getCtaLocation(link) {
    if (link.closest('header')) return 'header'
    if (link.closest('.hero')) return 'hero'
    if (link.closest('.history-hero')) return 'trajectory_hero'
    if (link.closest('.history-close')) return 'trajectory_close'
    if (link.closest('footer')) return 'footer'

    const section = link.closest('section')
    return section?.id || 'page_content'
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]')
    if (!link) return

    const href = link.getAttribute('href') || ''

    if (href.startsWith('mailto:')) {
      window.trackPublimetalEvent('contact_email', {
        link_location: getCtaLocation(link),
      })
      return
    }

    if (href.startsWith('tel:')) {
      window.trackPublimetalEvent('contact_phone', {
        link_location: getCtaLocation(link),
      })
      return
    }

    if (/wa\.me|whatsapp\.com/i.test(href)) {
      window.trackPublimetalEvent('contact_whatsapp', {
        link_location: getCtaLocation(link),
      })
      return
    }

    if (href.includes('#contacto')) {
      window.trackPublimetalEvent('contact_cta_click', {
        cta_text: link.textContent.trim(),
        cta_location: getCtaLocation(link),
      })
    }
  })
})()
