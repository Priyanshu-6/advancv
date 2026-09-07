import mongoose from 'mongoose'

/**
 * Sub-schemas mirror the shape in client/src/assets/assets.js so the same
 * objects flow from the builder form, through the API, into the templates.
 * `_id: true` on the array items gives React stable keys for list rows.
 */

const personalInfoSchema = new mongoose.Schema(
  {
    full_name: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    linkedin: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    profession: { type: String, default: '', trim: true },
    image: { type: String, default: '' },
  },
  { _id: false },
)

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, default: '', trim: true },
    position: { type: String, default: '', trim: true },
    // Stored as "YYYY-MM" strings to match the <input type="month"> values
    // used in the builder. "Present" is allowed for end_date.
    start_date: { type: String, default: '' },
    end_date: { type: String, default: '' },
    description: { type: String, default: '' },
    is_current: { type: Boolean, default: false },
  },
  { _id: true },
)

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, default: '', trim: true },
    degree: { type: String, default: '', trim: true },
    field: { type: String, default: '', trim: true },
    graduation_date: { type: String, default: '' },
    gpa: { type: String, default: '' },
  },
  { _id: true },
)

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', trim: true },
    type: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    link: { type: String, default: '', trim: true },
  },
  { _id: true },
)

export const TEMPLATE_IDS = [
  'minimal',
  'minimal-image',
  'classic',
  'modern',
  'compact',
]

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Resume',
    },
    // When true the resume is readable at /view/:resumeId without auth.
    public: {
      type: Boolean,
      default: false,
    },
    personal_info: {
      type: personalInfoSchema,
      default: () => ({}),
    },
    professional_summary: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    project: { type: [projectSchema], default: [] },
    template: {
      type: String,
      enum: TEMPLATE_IDS,
      default: 'minimal',
    },
    accent_color: {
      type: String,
      default: '#14B8A6',
      // Guard against arbitrary strings being injected into inline styles.
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'accent_color must be a hex colour'],
    },
    // Cached last-used job description so the JD suggestions panel can
    // restore context when the user comes back to the builder.
    target_job_description: { type: String, default: '' },
  },
  { timestamps: true },
)

// Dashboard lists a user's resumes most-recently-edited first.
resumeSchema.index({ userId: 1, updatedAt: -1 })

export const Resume = mongoose.model('Resume', resumeSchema)
