import { forwardRef } from 'react'
import { getTemplate } from './templates'

// A4 at 96dpi. Fixing the pixel size (rather than using relative units) means
// the on-screen preview matches the printed page, and the `scale` prop can
// shrink it to fit a panel without changing the layout.
export const SHEET_WIDTH = 794
export const SHEET_HEIGHT = 1123

/**
 * Renders a resume on a page-sized white sheet.
 *
 * `scale` visually shrinks the sheet via a CSS transform while the wrapper
 * reserves the scaled footprint, so surrounding layout stays correct. The
 * `resume-sheet` class is targeted by the print stylesheet in index.css.
 */
export const ResumeSheet = forwardRef(function ResumeSheet(
  { resume, scale = 1, className = '' },
  ref,
) {
  const template = getTemplate(resume?.template)
  const Template = template.component
  const accent = resume?.accent_color || '#14B8A6'

  return (
    <div
      className={`resume-sheet-wrapper ${className}`}
      style={{
        width: SHEET_WIDTH * scale,
        height: SHEET_HEIGHT * scale,
      }}
    >
      <div
        ref={ref}
        className="resume-sheet overflow-hidden bg-white shadow-lg ring-1 ring-slate-200"
        style={{
          width: SHEET_WIDTH,
          height: SHEET_HEIGHT,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <Template resume={resume || {}} accent={accent} />
      </div>
    </div>
  )
})
