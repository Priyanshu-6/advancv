import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../lib/api'
import { AiButton, AiSuggestionPopover } from './AiSuggestionPopover'

/**
 * Tag-style skills editor. Enter or comma commits a skill; Backspace on an
 * empty input removes the last one.
 */
export const SkillsEditor = ({ skills = [], onChange, resume, aiEnabled }) => {
  const [draft, setDraft] = useState('')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addSkill = (value) => {
    const skill = String(value).trim().replace(/,$/, '')
    if (!skill) return
    // Case-insensitive dedupe.
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return
    onChange([...skills, skill])
  }

  const removeSkill = (index) => {
    onChange(skills.filter((_, i) => i !== index))
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addSkill(draft)
      setDraft('')
    } else if (event.key === 'Backspace' && !draft && skills.length) {
      removeSkill(skills.length - 1)
    }
  }

  // Support pasting a comma-separated list.
  const handlePaste = (event) => {
    const text = event.clipboardData.getData('text')
    if (!text.includes(',')) return
    event.preventDefault()
    text.split(',').forEach(addSkill)
    setDraft('')
  }

  const fetchSuggestions = async () => {
    setSuggestOpen(true)
    setLoading(true)
    setError(null)
    try {
      const result = await api.aiSkills({
        resume,
        jobDescription: resume.target_job_description,
      })
      setSuggestions(result.skills || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor="skill-input"
          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
        >
          Skills
        </label>
        <AiButton
          onClick={fetchSuggestions}
          loading={loading}
          disabled={!aiEnabled}
          label="Suggest"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/30">
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className="inline-flex items-center gap-1 rounded-md bg-teal-50 py-1 pl-2 pr-1 text-xs font-medium text-teal-800"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(index)}
              aria-label={`Remove ${skill}`}
              className="rounded p-0.5 text-teal-500 transition-colors hover:bg-teal-100 hover:text-teal-800"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}

        <input
          id="skill-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            // Don't silently drop a half-typed skill on blur.
            if (draft.trim()) {
              addSkill(draft)
              setDraft('')
            }
          }}
          placeholder={skills.length ? 'Add another…' : 'React, TypeScript, SQL…'}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Press Enter or comma to add. Paste a comma-separated list to add several.
      </p>

      <AiSuggestionPopover
        open={suggestOpen}
        loading={loading}
        error={error}
        title="Suggested skills — click to add"
        options={suggestions}
        applyLabel="Add"
        onApply={(skill) => {
          addSkill(skill)
          setSuggestions((current) => current.filter((s) => s !== skill))
        }}
        onClose={() => setSuggestOpen(false)}
      />
    </div>
  )
}
