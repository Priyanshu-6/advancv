import { BulletList, ContactRow, SectionTitle } from './shared'
import { formatDateRange, formatMonth, toBullets } from '../../lib/resumeUtils'

/**
 * Classic: serif type, a solid accent header band, and traditional section
 * ordering. Suits conservative industries.
 */
export const ClassicTemplate = ({ resume, accent }) => {
  const info = resume.personal_info || {}

  return (
    <article className="flex flex-col text-slate-800" style={{ fontFamily: 'Georgia, Cambria, serif' }}>
      <header
        className="px-10 py-7 text-center text-white"
        style={{ backgroundColor: accent }}
      >
        <h1 className="text-[27px] font-bold uppercase leading-tight tracking-[0.06em]">
          {info.full_name || 'Your Name'}
        </h1>
        {info.profession && (
          <p className="mt-1 text-[12px] uppercase tracking-[0.24em] opacity-90">
            {info.profession}
          </p>
        )}
      </header>

      <div className="flex justify-center border-b border-slate-200 px-10 py-3">
        <ContactRow info={info} accent={accent} />
      </div>

      <div className="flex flex-col gap-4 px-10 py-6">
        {resume.professional_summary && (
          <section>
            <SectionTitle accent={accent}>Professional Summary</SectionTitle>
            <p className="text-[11.5px] leading-relaxed text-slate-700">
              {resume.professional_summary}
            </p>
          </section>
        )}

        {resume.experience?.length > 0 && (
          <section>
            <SectionTitle accent={accent}>Professional Experience</SectionTitle>
            <div className="space-y-3">
              {resume.experience.map((job, index) => (
                <div key={job._id || index}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[12.5px] font-bold text-slate-900">
                      {job.company || 'Company'}
                    </h3>
                    <span className="shrink-0 text-[10.5px] italic tabular-nums text-slate-600">
                      {formatDateRange(job.start_date, job.end_date, job.is_current)}
                    </span>
                  </div>
                  {job.position && (
                    <p className="text-[11.5px] italic text-slate-700">{job.position}</p>
                  )}
                  <BulletList items={toBullets(job.description)} accent={accent} />
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.education?.length > 0 && (
          <section>
            <SectionTitle accent={accent}>Education</SectionTitle>
            <div className="space-y-2">
              {resume.education.map((school, index) => (
                <div
                  key={school._id || index}
                  className="flex items-baseline justify-between gap-3"
                >
                  <div>
                    <p className="text-[11.5px] font-bold text-slate-900">
                      {school.institution || 'Institution'}
                    </p>
                    <p className="text-[11px] italic text-slate-700">
                      {school.degree}
                      {school.field ? `, ${school.field}` : ''}
                      {school.gpa ? ` · GPA ${school.gpa}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10.5px] italic tabular-nums text-slate-600">
                    {formatMonth(school.graduation_date)}
                  </span>
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
                  <p className="text-[11.5px] font-bold text-slate-900">
                    {project.name || 'Project'}
                    {project.type && (
                      <span className="font-normal italic text-slate-600">
                        {' '}— {project.type}
                      </span>
                    )}
                  </p>
                  <BulletList items={toBullets(project.description)} accent={accent} />
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.skills?.length > 0 && (
          <section>
            <SectionTitle accent={accent}>Skills</SectionTitle>
            {/* Comma-separated rather than chips, to match the classic feel. */}
            <p className="text-[11.5px] leading-relaxed text-slate-700">
              {resume.skills.join(' · ')}
            </p>
          </section>
        )}
      </div>
    </article>
  )
}
