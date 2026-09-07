import {
  BulletList,
  ContactRow,
  SectionTitle,
  SkillChips,
} from './shared'
import { formatDateRange, formatMonth, toBullets } from '../../lib/resumeUtils'

/**
 * Minimal: single column, centred header, generous whitespace. The safest
 * choice for ATS parsing since there are no columns or graphics.
 */
export const MinimalTemplate = ({ resume, accent }) => {
  const info = resume.personal_info || {}

  return (
    <article className="flex flex-col gap-4 px-10 py-9 text-slate-800">
      <header className="text-center">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-slate-900">
          {info.full_name || 'Your Name'}
        </h1>
        {info.profession && (
          <p
            className="mt-0.5 text-[12px] font-medium uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            {info.profession}
          </p>
        )}
        <div className="mt-2.5 flex justify-center">
          <ContactRow info={info} accent={accent} />
        </div>
      </header>

      {resume.professional_summary && (
        <section>
          <SectionTitle accent={accent}>Summary</SectionTitle>
          <p className="text-[11px] leading-relaxed text-slate-700">
            {resume.professional_summary}
          </p>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section>
          <SectionTitle accent={accent}>Experience</SectionTitle>
          <div className="space-y-3">
            {resume.experience.map((job, index) => (
              <div key={job._id || index}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[12px] font-semibold text-slate-900">
                    {job.position || 'Position'}
                    {job.company && (
                      <span className="font-normal text-slate-600">
                        {' '}· {job.company}
                      </span>
                    )}
                  </h3>
                  <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                    {formatDateRange(job.start_date, job.end_date, job.is_current)}
                  </span>
                </div>
                <BulletList items={toBullets(job.description)} accent={accent} />
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.project?.length > 0 && (
        <section>
          <SectionTitle accent={accent}>Projects</SectionTitle>
          <div className="space-y-2.5">
            {resume.project.map((project, index) => (
              <div key={project._id || index}>
                <h3 className="text-[12px] font-semibold text-slate-900">
                  {project.name || 'Project'}
                  {project.type && (
                    <span className="font-normal text-slate-600"> · {project.type}</span>
                  )}
                </h3>
                <BulletList items={toBullets(project.description)} accent={accent} />
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section>
          <SectionTitle accent={accent}>Skills</SectionTitle>
          <SkillChips skills={resume.skills} accent={accent} />
        </section>
      )}

      {resume.education?.length > 0 && (
        <section>
          <SectionTitle accent={accent}>Education</SectionTitle>
          <div className="space-y-1.5">
            {resume.education.map((school, index) => (
              <div
                key={school._id || index}
                className="flex items-baseline justify-between gap-3"
              >
                <p className="text-[11px] text-slate-800">
                  <span className="font-semibold">
                    {school.degree || 'Degree'}
                    {school.field ? `, ${school.field}` : ''}
                  </span>
                  {school.institution && (
                    <span className="text-slate-600"> — {school.institution}</span>
                  )}
                  {school.gpa && (
                    <span className="text-slate-500"> (GPA {school.gpa})</span>
                  )}
                </p>
                <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                  {formatMonth(school.graduation_date)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
