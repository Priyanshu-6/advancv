import {
  BulletList,
  ContactRow,
  ProfileImage,
  SectionTitle,
  SkillChips,
} from './shared'
import { formatDateRange, formatMonth, toBullets } from '../../lib/resumeUtils'

/**
 * Modern: two-column layout with a tinted sidebar for contact, skills, and
 * education, leaving the main column for narrative content.
 */
export const ModernTemplate = ({ resume, accent }) => {
  const info = resume.personal_info || {}

  return (
    <article className="flex min-h-full text-slate-800">
      {/* Sidebar */}
      <aside
        className="flex w-[34%] shrink-0 flex-col gap-5 px-6 py-8"
        style={{ backgroundColor: `${accent}12` }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <ProfileImage
            src={info.image}
            name={info.full_name}
            accent={accent}
            size={92}
          />
          <div>
            <h1 className="text-[19px] font-bold leading-tight text-slate-900">
              {info.full_name || 'Your Name'}
            </h1>
            {info.profession && (
              <p
                className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: accent }}
              >
                {info.profession}
              </p>
            )}
          </div>
        </div>

        <section>
          <SectionTitle accent={accent} variant="plain">
            Contact
          </SectionTitle>
          <ContactRow info={info} accent={accent} stacked compact />
        </section>

        {resume.skills?.length > 0 && (
          <section>
            <SectionTitle accent={accent} variant="plain">
              Skills
            </SectionTitle>
            <SkillChips skills={resume.skills} accent={accent} outline />
          </section>
        )}

        {resume.education?.length > 0 && (
          <section>
            <SectionTitle accent={accent} variant="plain">
              Education
            </SectionTitle>
            <div className="space-y-2">
              {resume.education.map((school, index) => (
                <div key={school._id || index} className="text-[10.5px] leading-snug">
                  <p className="font-semibold text-slate-900">
                    {school.degree || 'Degree'}
                    {school.field ? `, ${school.field}` : ''}
                  </p>
                  {school.institution && (
                    <p className="text-slate-600">{school.institution}</p>
                  )}
                  <p className="text-slate-500">
                    {formatMonth(school.graduation_date)}
                    {school.gpa ? ` · GPA ${school.gpa}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col gap-5 px-7 py-8">
        {resume.professional_summary && (
          <section>
            <SectionTitle accent={accent}>Profile</SectionTitle>
            <p className="text-[11px] leading-relaxed text-slate-700">
              {resume.professional_summary}
            </p>
          </section>
        )}

        {resume.experience?.length > 0 && (
          <section>
            <SectionTitle accent={accent}>Experience</SectionTitle>
            <div className="space-y-3.5">
              {resume.experience.map((job, index) => (
                <div
                  key={job._id || index}
                  className="border-l-2 pl-3"
                  style={{ borderColor: `${accent}55` }}
                >
                  <h3 className="text-[12px] font-semibold text-slate-900">
                    {job.position || 'Position'}
                  </h3>
                  <p className="flex flex-wrap items-baseline gap-x-2 text-[10.5px]">
                    {job.company && (
                      <span className="font-medium" style={{ color: accent }}>
                        {job.company}
                      </span>
                    )}
                    <span className="tabular-nums text-slate-500">
                      {formatDateRange(job.start_date, job.end_date, job.is_current)}
                    </span>
                  </p>
                  <BulletList items={toBullets(job.description)} accent={accent} />
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.project?.length > 0 && (
          <section>
            <SectionTitle accent={accent}>Projects</SectionTitle>
            <div className="space-y-3">
              {resume.project.map((project, index) => (
                <div key={project._id || index}>
                  <h3 className="text-[12px] font-semibold text-slate-900">
                    {project.name || 'Project'}
                  </h3>
                  {project.type && (
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">
                      {project.type}
                    </p>
                  )}
                  <BulletList items={toBullets(project.description)} accent={accent} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
