import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Layers,
  Link2,
  Sparkles,
  Target,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  {
    icon: Target,
    title: 'Match a job description',
    body: 'Paste any posting and get a match score, the keywords you are missing, and ready-to-paste bullet points tailored to that role.',
  },
  {
    icon: Sparkles,
    title: 'AI writing help',
    body: 'Turn rough notes into sharp, achievement-led bullets. Generate summary options grounded in your real experience, never invented.',
  },
  {
    icon: Layers,
    title: 'Five templates',
    body: 'Switch layout and accent colour instantly. From ATS-safe minimal to a two-column modern sidebar.',
  },
  {
    icon: FileText,
    title: 'Live preview',
    body: 'Edit on the left, watch the page update on the right. What you see is exactly what prints.',
  },
  {
    icon: Download,
    title: 'Clean PDF export',
    body: 'Real text, not a screenshot. Selectable, searchable, and parseable by applicant tracking systems.',
  },
  {
    icon: Link2,
    title: 'Shareable links',
    body: 'Flip a resume to public and send a link. Turn it off and the link goes dead immediately.',
  },
]

const STEPS = [
  'Sign in with Google and create a resume',
  'Fill in your details, or let AI draft them from notes',
  'Paste a job description and apply the suggestions',
  'Export a PDF or share a live link',
]

export const Home = () => {
  const { isAuthenticated } = useAuth()
  const primaryHref = isAuthenticated ? '/app' : '/login'

  return (
    <div className="min-h-screen bg-white">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
              A
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              AdvanCV
            </span>
          </Link>

          <nav className="flex items-center gap-1.5">
            <a
              href="#features"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 sm:block"
            >
              Features
            </a>
            <Link
              to={primaryHref}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {isAuthenticated ? 'Open app' : 'Sign in'}
            </Link>
          </nav>
        </div>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-teal-200/35 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Powered by Google Gemini
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Write the resume that
            <br />
            <span className="text-teal-600">matches the job</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600">
            Build a resume in a live editor, then paste the job posting you are
            targeting. AdvanCV tells you what is missing and drafts bullet points
            from the experience you already have.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={primaryHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 sm:w-auto"
            >
              Start building free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 sm:w-auto"
            >
              See how it works
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            No credit card. Sign in with Google and start writing.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- features */}
      <section id="features" className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Everything you need to tailor an application
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Most resume builders stop at formatting. AdvanCV helps with the part
              that actually changes outcomes: what the bullets say.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <h3 className="mt-3.5 text-base font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ how it works */}
      <section id="how-it-works" className="py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Four steps, start to sent
            </h2>
            <ol className="mt-6 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-slate-700">
                    {step}
                  </p>
                </li>
              ))}
            </ol>

            <Link
              to={primaryHref}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Illustrative mock of the JD-match panel. */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Job match
              </p>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                82%
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[82%] rounded-full bg-emerald-500" />
            </div>

            <p className="mt-4 text-xs font-semibold text-slate-700">
              Suggested bullets
            </p>
            <ul className="mt-2 space-y-2">
              {[
                'Shipped a React design system adopted across four product teams',
                'Cut initial bundle size 38% through route-level code splitting',
                'Led accessibility audit taking the checkout flow to WCAG 2.1 AA',
              ].map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-2 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-700"
                >
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-slate-500 sm:flex-row">
          <p>AdvanCV — resume builder with AI job matching.</p>
          <Link to={primaryHref} className="font-medium text-teal-700 hover:underline">
            {isAuthenticated ? 'Open app' : 'Sign in'}
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default Home
