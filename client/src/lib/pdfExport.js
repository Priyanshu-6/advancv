/**
 * PDF export via the browser's own print pipeline.
 *
 * Rather than pulling in html2pdf/jsPDF (which rasterise the page and produce
 * large files with unselectable text), we open a print window containing just
 * the resume sheet plus the page's stylesheets. The user picks "Save as PDF"
 * in the print dialog. Text stays selectable, fonts stay crisp, and there is
 * no extra dependency.
 */

const PRINT_STYLES = `
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .resume-sheet {
    width: 210mm !important;
    min-height: 297mm !important;
    height: auto !important;
    box-shadow: none !important;
    outline: none !important;
    transform: none !important;
    overflow: visible !important;
  }
  /* Avoid orphaning a heading at the foot of a page. */
  h1, h2, h3 { break-after: avoid; }
  section, li { break-inside: avoid; }
`

/** Copies the host document's stylesheets so Tailwind classes still apply. */
const collectStyles = () =>
  Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((node) => node.outerHTML)
    .join('\n')

/**
 * Opens a print window for a resume sheet element.
 *
 * @param {HTMLElement} element - the `.resume-sheet` node to print
 * @param {string} filename - suggested document title (browsers use it as the
 *   default PDF filename)
 * @returns {boolean} false if the popup was blocked
 */
export const printResume = (element, filename = 'resume') => {
  if (!element) return false

  const frame = document.createElement('iframe')
  // Off-screen rather than display:none — some browsers won't print a
  // display:none frame.
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.right = '100%'
  frame.style.bottom = '100%'
  frame.style.width = '210mm'
  frame.style.height = '297mm'
  frame.style.border = '0'

  document.body.appendChild(frame)

  const doc = frame.contentDocument
  if (!doc) {
    frame.remove()
    return false
  }

  doc.open()
  doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(filename)}</title>
    ${collectStyles()}
    <style>${PRINT_STYLES}</style>
  </head>
  <body>${element.outerHTML}</body>
</html>`)
  doc.close()

  const triggerPrint = () => {
    try {
      frame.contentWindow.focus()
      frame.contentWindow.print()
    } catch (error) {
      console.error('[pdf] print failed:', error)
    }
    // Give the print dialog time to take its snapshot before teardown.
    setTimeout(() => frame.remove(), 1000)
  }

  // Wait for fonts and images in the frame before printing, so the PDF isn't
  // missing the profile photo or web font.
  const win = frame.contentWindow
  const ready = win.document.fonts?.ready ?? Promise.resolve()

  Promise.resolve(ready)
    .then(() => waitForImages(win.document))
    .then(triggerPrint)
    .catch(triggerPrint)

  return true
}

const waitForImages = (doc) => {
  const images = Array.from(doc.images || [])
  if (!images.length) return Promise.resolve()

  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true })
            img.addEventListener('error', resolve, { once: true })
            // Never block the print on a hanging image.
            setTimeout(resolve, 3000)
          }),
    ),
  )
}

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  )

/** Builds a filesystem-friendly filename from the resume. */
export const buildFilename = (resume) => {
  const name = resume?.personal_info?.full_name || resume?.title || 'resume'
  return (
    String(name)
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'resume'
  )
}
