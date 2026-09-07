import { MinimalTemplate } from './MinimalTemplate'
import { MinimalImageTemplate } from './MinimalImageTemplate'
import { ClassicTemplate } from './ClassicTemplate'
import { ModernTemplate } from './ModernTemplate'
import { CompactTemplate } from './CompactTemplate'

/**
 * Template registry. `id` values must stay in sync with TEMPLATE_IDS in
 * server/src/models/Resume.js, which validates the stored value.
 */
export const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Single column, centred header. Safest for ATS parsing.',
    component: MinimalTemplate,
    hasPhoto: false,
  },
  {
    id: 'minimal-image',
    name: 'Minimal + Photo',
    description: 'Minimal layout with a profile photo in the header.',
    component: MinimalImageTemplate,
    hasPhoto: true,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Serif type and an accent header band. Formal industries.',
    component: ClassicTemplate,
    hasPhoto: false,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Two columns with a tinted sidebar for skills and contact.',
    component: ModernTemplate,
    hasPhoto: true,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense layout that fits a longer history on one page.',
    component: CompactTemplate,
    hasPhoto: false,
  },
]

const FALLBACK = TEMPLATES[0]

export const getTemplate = (id) =>
  TEMPLATES.find((template) => template.id === id) || FALLBACK

/** Accent presets offered in the builder's colour picker. */
export const ACCENT_COLORS = [
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Sky', value: '#0284C7' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Slate', value: '#475569' },
]
