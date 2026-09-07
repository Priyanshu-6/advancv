import { BulletList, ContactRow, SectionTitle } from './shared'
import { formatDateRange, formatMonth, toBullets } from '../../lib/resumeUtils'

/**
 * Compact: tighter type and spacing, with skills and education on one row.
 * Aimed at fitting a dense history onto a single page.
 */
export const CompactTemplate = ({ resume, accent }) => {
  const info = resume.personal_info || {}

  return (
    <article className="flex flex-col gap-3 px-9 py-7 text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b-2 pb-2" style={{ borderColor: accent }}>
        <div>
          <h1 className="text-[22px] font-bold leading-none tracking-tight text-slate-900">
            {info.full_name || 'Your Name'}
          </h1>
          {info.profession && (
            <p className="mt-1 text-[11px] font-semibold" style={{ color: accent }}>
              {info.profession}
            </p>
          )}
        </div>
        <ContactRow info={info} accent={accent} compact />
      </header>

      {resume.professional_summary && (
        <p className="text-[10.5px] leading-snug text-slate-700">
          {resume.professional_summary}
        </p>
      )}

      {resume.experience?.length > 0 && (
        <section>
          <SectionTitle accent={accent} variant="bar">
            Experience
          </SectionTitle>
          <div className="space-y-2">
            {resume.experience.map((job, index) => (
              <div key={job._id || index}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[11.5px] font-semibold text-slate-900">
                    {job.position || 'Position'}
                    {job.company && (
                      <span className="font-normal text-slate-600"> · {job.company}</span>
                    )}
                  </h3>
                  <span className="shrink-0 text-[9.5px] tabular-nums text-slate-500">
                    {formatDateRange(job.start_date, job.end_date, job.is_current)}
                  </span>
                </div>
                <BulletList items={toBullets(job.description)} accent={accent} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.project?.length > 0 && (
        <section>
          <SectionTitle accent={accent} variant="bar">
            Projects
          </SectionTitle>
          <div className="space-y-1.5">
            {resume.project.map((project, index) => (
              <div key={project._id || index}>
                <h3 className="text-[11px] font-semibold text-slate-900">
                  {project.name || 'Project'}
                  {project.type && (
                    <span className="font-normal text-slate-600"> · {project.type}</span>
                  )}
                </h3>
                <BulletList items={toBullets(project.description)} accent={accent} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills and education share a row to save vertical space. */}
      <div className="grid grid-cols-2 gap-5">
        {resume.skills?.length > 0 && (
          <section>
            <SectionTitle accent={accent} variant="bar">
              Skills
            </SectionTitle>
            <p className="text-[10.5px] leading-snug text-slate-700">
              {resume.skills.join(' · ')}
            </p>
          </section>
        )}

        {resume.education?.length > 0 && (
          <section>
            <SectionTitle accent={accent} variant="bar">
              Education
            </SectionTitle>
            <div className="space-y-1">
              {resume.education.map((school, index) => (
                <div key={school._id || index} className="text-[10.5px] leading-snug">
                  <p className="font-semibold text-slate-900">
                    {school.degree || 'Degree'}
                    {school.field ? `, ${school.field}` : ''}
                  </p>
                  <p className="text-slate-600">
                    {school.institution}
                    {school.graduation_date
                      ? ` · ${formatMonth(school.graduation_date)}`
                      : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
