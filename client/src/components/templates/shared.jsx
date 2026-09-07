import { Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react'

/**
 * Building blocks shared by the resume templates. Keeping the contact row,
 * section headings, and bullet lists here means all templates stay consistent
 * in behaviour (empty-value handling, link safety) while differing visually.
 */

/** Only render links we can trust to be http(s). */
const safeHref = (value, prefix = '') => {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (prefix) return `${prefix}${raw}`
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

/** Strips the protocol for a cleaner printed label. */
const displayUrl = (value) =>
  String(value || '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')

export const ContactRow = ({ info = {}, accent, compact = false, stacked = false }) => {
  const items = [
    info.email && {
      icon: Mail,
      label: info.email,
      href: safeHref(info.email, 'mailto:'),
    },
    info.phone && {
      icon: Phone,
      label: info.phone,
      href: safeHref(info.phone.replace(/\s+/g, ''), 'tel:'),
    },
    info.location && { icon: MapPin, label: info.location },
    info.linkedin && {
      icon: Linkedin,
      label: displayUrl(info.linkedin),
      href: safeHref(info.linkedin),
    },
    info.website && {
      icon: Globe,
      label: displayUrl(info.website),
      href: safeHref(info.website),
    },
  ].filter(Boolean)

  if (!items.length) return null

  return (
    <ul
      className={`flex ${stacked ? 'flex-col gap-1.5' : 'flex-wrap items-center gap-x-4 gap-y-1'} ${compact ? 'text-[10px]' : 'text-[11px]'} text-slate-600`}
    >
      {items.map(({ icon: Icon, label, href }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Icon
            className="h-3 w-3 shrink-0"
            style={{ color: accent }}
            aria-hidden="true"
          />
          {href ? (
            <a href={href} target="_blank" rel="noreferrer noopener" className="hover:underline">
              {label}
            </a>
          ) : (
            <span>{label}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Section heading with an accent rule beneath it. */
export const SectionTitle = ({ children, accent, variant = 'rule' }) => {
  if (variant === 'bar') {
    return (
      <h2
        className="mb-2 rounded px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
        style={{ backgroundColor: accent }}
      >
        {children}
      </h2>
    )
  }

  if (variant === 'plain') {
    return (
      <h2
        className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: accent }}
      >
        {children}
      </h2>
    )
  }

  return (
    <h2
      className="mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-800"
      style={{ borderColor: accent }}
    >
      {children}
    </h2>
  )
}

/** Bullet list used for experience and project descriptions. */
export const BulletList = ({ items, accent, compact = false }) => {
  if (!items?.length) return null
  return (
    <ul className={`mt-1 space-y-0.5 ${compact ? 'text-[10.5px]' : 'text-[11px]'} leading-relaxed text-slate-700`}>
      {items.map((item, index) => (
        <li key={index} className="flex gap-1.5">
          <span
            aria-hidden="true"
            className="mt-[6px] h-1 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** Skill chips. `outline` keeps ink use low for printing. */
export const SkillChips = ({ skills, accent, outline = false }) => {
  if (!skills?.length) return null
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <li
          key={skill}
          className="rounded px-2 py-0.5 text-[10px] font-medium"
          style={
            outline
              ? { border: `1px solid ${accent}`, color: accent }
              : { backgroundColor: `${accent}1a`, color: accent }
          }
        >
          {skill}
        </li>
      ))}
    </ul>
  )
}

/** Profile photo with a graceful fallback to initials. */
export const ProfileImage = ({ src, name, accent, size = 88, rounded = 'full' }) => {
  const initials = String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const shape = rounded === 'full' ? 'rounded-full' : 'rounded-lg'

  if (!src) {
    if (!initials) return null
    return (
      <div
        className={`flex shrink-0 items-center justify-center ${shape} text-lg font-semibold text-white`}
        style={{ width: size, height: size, backgroundColor: accent }}
        aria-hidden="true"
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name ? `${name}'s profile photo` : 'Profile photo'}
      className={`shrink-0 object-cover ${shape}`}
      style={{ width: size, height: size, border: `2px solid ${accent}` }}
    />
  )
}
