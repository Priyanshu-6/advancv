import { useState } from 'react'
import {
  Briefcase,
  FolderGit2,
  GraduationCap,
  Palette,
  User,
  Wrench,
} from 'lucide-react'
import { api } from '../../lib/api'
import {
  createEmptyEducation,
  createEmptyExperience,
  createEmptyProject,
} from '../../lib/resumeUtils'
import { ACCENT_COLORS, TEMPLATES } from '../templates'
import { CheckboxField, TextArea, TextField } from '../ui/Field'
import { AddButton, EntryCard, SectionCard } from './SectionCard'
import { AiButton, AiSuggestionPopover } from './AiSuggestionPopover'
import { SkillsEditor } from './SkillsEditor'

/**
 * The left-hand editor. Fully controlled: every change calls back into the
 * builder via `onChange`, which keeps a single source of truth for the resume
 * and lets the preview and autosave react to the same state.
 */
export const ResumeForm = ({ resume, onChange, aiEnabled }) => {
  const [openSections, setOpenSections] = useState({
    personal: true,
    summary: true,
    experience: true,
    skills: false,
    education: false,
    projects: false,
    design: false,
  })

  // AI state, keyed so several suggestion popovers can coexist.
  const [ai, setAi] = useState({ key: null, loading: false, error: null, options: [] })

  const toggle = (key) =>
    setOpenSections((current) => ({ ...current, [key]: !current[key] }))

  /* ------------------------------------------------------------ mutators */

  const setField = (field, value) => onChange({ ...resume, [field]: value })

  const setPersonal = (field, value) =>
    onChange({
      ...resume,
      personal_info: { ...(resume.personal_info || {}), [field]: value },
    })

  const updateItem = (section, index, field, value) => {
    const items = [...(resume[section] || [])]
    items[index] = { ...items[index], [field]: value }
    onChange({ ...resume, [section]: items })
  }

  const addItem = (section, factory) =>
    onChange({ ...resume, [section]: [...(resume[section] || []), factory()] })

  const removeItem = (section, index) =>
    onChange({
      ...resume,
      [section]: (resume[section] || []).filter((_, i) => i !== index),
    })

  const moveItem = (section, index, direction) => {
    const items = [...(resume[section] || [])]
    const target = index + direction
    if (target < 0 || target >= items.length) return
    ;[items[index], items[target]] = [items[target], items[index]]
    onChange({ ...resume, [section]: items })
  }

  /* ------------------------------------------------------------------ AI */

  const runAi = async (key, request) => {
    setAi({ key, loading: true, error: null, options: [] })
    try {
      const options = await request()
      setAi({ key, loading: false, error: null, options })
    } catch (error) {
      setAi({ key, loading: false, error: error.message, options: [] })
    }
  }

  const generateSummary = () =>
    runAi('summary', async () => {
      const result = await api.aiSummary({ resume })
      return result.options || []
    })

  const improveEntry = (section, index) => {
    const entry = resume[section][index]
    const context =
      section === 'experience'
        ? `${entry.position || ''} at ${entry.company || ''}`
        : entry.type || ''

    return runAi(`${section}-${index}`, async () => {
      const result = await api.aiImprove({
        text: entry.description,
        context,
        kind: section === 'project' ? 'project' : 'experience',
        jobDescription: resume.target_job_description,
      })
      return result.bullets || []
    })
  }

  const closeAi = () => setAi({ key: null, loading: false, error: null, options: [] })

  /* --------------------------------------------------------------- render */

  const info = resume.personal_info || {}

  return (
    <div className="space-y-3">
      {/* ------------------------------------------------------- personal */}
      <SectionCard
        title="Personal details"
        icon={User}
        open={openSections.personal}
        onToggle={() => toggle('personal')}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Full name"
            value={info.full_name || ''}
            onChange={(e) => setPersonal('full_name', e.target.value)}
            placeholder="Alex Smith"
            maxLength={80}
          />
          <TextField
            label="Profession"
            value={info.profession || ''}
            onChange={(e) => setPersonal('profession', e.target.value)}
            placeholder="Full Stack Developer"
            maxLength={80}
          />
          <TextField
            label="Email"
            type="email"
            value={info.email || ''}
            onChange={(e) => setPersonal('email', e.target.value)}
            placeholder="alex@example.com"
          />
          <TextField
            label="Phone"
            type="tel"
            value={info.phone || ''}
            onChange={(e) => setPersonal('phone', e.target.value)}
            placeholder="+1 555 0100"
          />
          <TextField
            label="Location"
            value={info.location || ''}
            onChange={(e) => setPersonal('location', e.target.value)}
            placeholder="New York, USA"
          />
          <TextField
            label="LinkedIn"
            value={info.linkedin || ''}
            onChange={(e) => setPersonal('linkedin', e.target.value)}
            placeholder="linkedin.com/in/alexsmith"
          />
          <TextField
            className="sm:col-span-2"
            label="Website"
            value={info.website || ''}
            onChange={(e) => setPersonal('website', e.target.value)}
            placeholder="alexsmith.dev"
          />
          <TextField
            className="sm:col-span-2"
            label="Photo URL"
            value={info.image || ''}
            onChange={(e) => setPersonal('image', e.target.value)}
            placeholder="https://…"
            hint="Only shown on templates that support a photo."
          />
        </div>
      </SectionCard>

      {/* -------------------------------------------------------- summary */}
      <SectionCard
        title="Professional summary"
        icon={User}
        open={openSections.summary}
        onToggle={() => toggle('summary')}
      >
        <TextArea
          label="Summary"
          rows={5}
          value={resume.professional_summary || ''}
          onChange={(e) => setField('professional_summary', e.target.value)}
          placeholder="Two or three sentences on who you are and what you are strongest at."
          maxLength={1200}
          action={
            <AiButton
              onClick={generateSummary}
              loading={ai.key === 'summary' && ai.loading}
              disabled={!aiEnabled}
              label="Write for me"
            />
          }
        />

        <AiSuggestionPopover
          open={ai.key === 'summary'}
          loading={ai.loading}
          error={ai.error}
          title="Summary options"
          options={ai.options}
          onApply={(option) => {
            setField('professional_summary', option)
            closeAi()
          }}
          onClose={closeAi}
        />
      </SectionCard>

      {/* ----------------------------------------------------- experience */}
      <SectionCard
        title="Experience"
        icon={Briefcase}
        count={resume.experience?.length}
        open={openSections.experience}
        onToggle={() => toggle('experience')}
        action={
          <AddButton
            label="Add a role"
            onClick={() => addItem('experience', createEmptyExperience)}
          />
        }
      >
        {(resume.experience || []).map((job, index) => (
          <EntryCard
            key={job._id || index}
            title={job.position || 'New role'}
            subtitle={job.company}
            canMoveUp={index > 0}
            canMoveDown={index < resume.experience.length - 1}
            onMoveUp={() => moveItem('experience', index, -1)}
            onMoveDown={() => moveItem('experience', index, 1)}
            onRemove={() => removeItem('experience', index)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Position"
                value={job.position || ''}
                onChange={(e) => updateItem('experience', index, 'position', e.target.value)}
                placeholder="Senior Engineer"
              />
              <TextField
                label="Company"
                value={job.company || ''}
                onChange={(e) => updateItem('experience', index, 'company', e.target.value)}
                placeholder="Example Technologies"
              />
              <TextField
                label="Start"
                type="month"
                value={job.start_date || ''}
                onChange={(e) => updateItem('experience', index, 'start_date', e.target.value)}
              />
              <TextField
                label="End"
                type="month"
                value={job.is_current ? '' : job.end_date || ''}
                disabled={job.is_current}
                onChange={(e) => updateItem('experience', index, 'end_date', e.target.value)}
                hint={job.is_current ? 'Showing as "Present"' : undefined}
              />
            </div>

            <CheckboxField
              label="I currently work here"
              checked={Boolean(job.is_current)}
              onChange={(e) => {
                const isCurrent = e.target.checked
                const items = [...resume.experience]
                // Clearing end_date keeps the stored data consistent with the
                // "Present" label the templates render.
                items[index] = {
                  ...items[index],
                  is_current: isCurrent,
                  end_date: isCurrent ? '' : items[index].end_date,
                }
                onChange({ ...resume, experience: items })
              }}
            />

            <TextArea
              label="What you did"
              rows={4}
              value={job.description || ''}
              onChange={(e) => updateItem('experience', index, 'description', e.target.value)}
              placeholder="One achievement per line. Rough notes are fine — AI can tidy them up."
              hint="Each line becomes a bullet point."
              action={
                <AiButton
                  onClick={() => improveEntry('experience', index)}
                  loading={ai.key === `experience-${index}` && ai.loading}
                  disabled={!aiEnabled || !job.description?.trim()}
                  label="Improve"
                />
              }
            />

            <AiSuggestionPopover
              open={ai.key === `experience-${index}`}
              loading={ai.loading}
              error={ai.error}
              title="Rewritten bullets"
              options={ai.options}
              multi
              applyLabel="Use"
              onApply={(option, optionIndex) => {
                if (optionIndex === -1) {
                  // "Use all" replaces the description outright.
                  updateItem('experience', index, 'description', option)
                } else {
                  const existing = job.description?.trim()
                  updateItem(
                    'experience',
                    index,
                    'description',
                    existing ? `${existing}\n${option}` : option,
                  )
                }
              }}
              onClose={closeAi}
            />
          </EntryCard>
        ))}

        {!resume.experience?.length && (
          <p className="py-2 text-center text-xs text-slate-500">
            No roles yet. Add your most recent position first.
          </p>
        )}
      </SectionCard>

      {/* --------------------------------------------------------- skills */}
      <SectionCard
        title="Skills"
        icon={Wrench}
        count={resume.skills?.length}
        open={openSections.skills}
        onToggle={() => toggle('skills')}
      >
        <SkillsEditor
          skills={resume.skills || []}
          onChange={(skills) => setField('skills', skills)}
          resume={resume}
          aiEnabled={aiEnabled}
        />
      </SectionCard>

      {/* ------------------------------------------------------ education */}
      <SectionCard
        title="Education"
        icon={GraduationCap}
        count={resume.education?.length}
        open={openSections.education}
        onToggle={() => toggle('education')}
        action={
          <AddButton
            label="Add education"
            onClick={() => addItem('education', createEmptyEducation)}
          />
        }
      >
        {(resume.education || []).map((school, index) => (
          <EntryCard
            key={school._id || index}
            title={school.degree || 'New entry'}
            subtitle={school.institution}
            canMoveUp={index > 0}
            canMoveDown={index < resume.education.length - 1}
            onMoveUp={() => moveItem('education', index, -1)}
            onMoveDown={() => moveItem('education', index, 1)}
            onRemove={() => removeItem('education', index)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                className="sm:col-span-2"
                label="Institution"
                value={school.institution || ''}
                onChange={(e) => updateItem('education', index, 'institution', e.target.value)}
                placeholder="Example Institute of Technology"
              />
              <TextField
                label="Degree"
                value={school.degree || ''}
                onChange={(e) => updateItem('education', index, 'degree', e.target.value)}
                placeholder="B.Tech"
              />
              <TextField
                label="Field"
                value={school.field || ''}
                onChange={(e) => updateItem('education', index, 'field', e.target.value)}
                placeholder="Computer Science"
              />
              <TextField
                label="Graduated"
                type="month"
                value={school.graduation_date || ''}
                onChange={(e) =>
                  updateItem('education', index, 'graduation_date', e.target.value)
                }
              />
              <TextField
                label="GPA"
                value={school.gpa || ''}
                onChange={(e) => updateItem('education', index, 'gpa', e.target.value)}
                placeholder="8.7"
                hint="Optional."
              />
            </div>
          </EntryCard>
        ))}

        {!resume.education?.length && (
          <p className="py-2 text-center text-xs text-slate-500">
            No education added yet.
          </p>
        )}
      </SectionCard>

      {/* ------------------------------------------------------- projects */}
      <SectionCard
        title="Projects"
        icon={FolderGit2}
        count={resume.project?.length}
        open={openSections.projects}
        onToggle={() => toggle('projects')}
        action={
          <AddButton
            label="Add a project"
            onClick={() => addItem('project', createEmptyProject)}
          />
        }
      >
        {(resume.project || []).map((project, index) => (
          <EntryCard
            key={project._id || index}
            title={project.name || 'New project'}
            subtitle={project.type}
            canMoveUp={index > 0}
            canMoveDown={index < resume.project.length - 1}
            onMoveUp={() => moveItem('project', index, -1)}
            onMoveDown={() => moveItem('project', index, 1)}
            onRemove={() => removeItem('project', index)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Name"
                value={project.name || ''}
                onChange={(e) => updateItem('project', index, 'name', e.target.value)}
                placeholder="TaskTrackr"
              />
              <TextField
                label="Type"
                value={project.type || ''}
                onChange={(e) => updateItem('project', index, 'type', e.target.value)}
                placeholder="Web application"
              />
              <TextField
                className="sm:col-span-2"
                label="Link"
                value={project.link || ''}
                onChange={(e) => updateItem('project', index, 'link', e.target.value)}
                placeholder="github.com/you/project"
                hint="Optional."
              />
            </div>

            <TextArea
              label="Description"
              rows={3}
              value={project.description || ''}
              onChange={(e) => updateItem('project', index, 'description', e.target.value)}
              placeholder="What it does, what you built, which technologies."
              action={
                <AiButton
                  onClick={() => improveEntry('project', index)}
                  loading={ai.key === `project-${index}` && ai.loading}
                  disabled={!aiEnabled || !project.description?.trim()}
                  label="Improve"
                />
              }
            />

            <AiSuggestionPopover
              open={ai.key === `project-${index}`}
              loading={ai.loading}
              error={ai.error}
              title="Rewritten bullets"
              options={ai.options}
              multi
              applyLabel="Use"
              onApply={(option, optionIndex) => {
                if (optionIndex === -1) {
                  updateItem('project', index, 'description', option)
                } else {
                  const existing = project.description?.trim()
                  updateItem(
                    'project',
                    index,
                    'description',
                    existing ? `${existing}\n${option}` : option,
                  )
                }
              }}
              onClose={closeAi}
            />
          </EntryCard>
        ))}

        {!resume.project?.length && (
          <p className="py-2 text-center text-xs text-slate-500">
            No projects yet. Useful if you are early in your career.
          </p>
        )}
      </SectionCard>

      {/* --------------------------------------------------------- design */}
      <SectionCard
        title="Template and colour"
        icon={Palette}
        open={openSections.design}
        onToggle={() => toggle('design')}
      >
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Template
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((template) => {
              const active = resume.template === template.id
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setField('template', template.id)}
                  aria-pressed={active}
                  className={`rounded-lg border p-2.5 text-left transition-colors ${
                    active
                      ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {template.name}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    {template.description}
                  </p>
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Accent colour
          </legend>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((color) => {
              const active =
                resume.accent_color?.toLowerCase() === color.value.toLowerCase()
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setField('accent_color', color.value)}
                  aria-label={color.name}
                  aria-pressed={active}
                  title={color.name}
                  className={`h-8 w-8 rounded-lg transition-transform hover:scale-110 ${
                    active ? 'ring-2 ring-slate-900 ring-offset-2' : 'ring-1 ring-black/10'
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              )
            })}
          </div>
        </fieldset>
      </SectionCard>
    </div>
  )
}
