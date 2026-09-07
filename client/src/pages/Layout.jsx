import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { ChevronDown, LayoutDashboard, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/** Avatar that falls back to the user's initial if the photo fails to load. */
const Avatar = ({ user, size = 32 }) => {
  const [failed, setFailed] = useState(false)
  const initial = user?.name?.[0]?.toUpperCase() || '?'

  if (!user?.picture || failed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {initial}
      </span>
    )
  }

  return (
    <img
      src={user.picture}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  )
}

/**
 * Chrome for the authenticated area: top bar with the user menu, and an
 * <Outlet> for Dashboard / ResumeBuilder.
 */
export const Layout = () => {
  const { user, logout, aiEnabled } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    // h-screen (not min-h-screen) so <main> gets a definite height. The builder
    // needs that to size its two independently scrolling panes.
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="z-40 shrink-0 border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2.5">
          <Link to="/app" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
              A
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900">
              AdvanCV
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {aiEnabled && (
              <span className="hidden items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200 sm:inline-flex">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                AI enabled
              </span>
            )}

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
              >
                <Avatar user={user} />
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-700 sm:block">
                  {user?.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-1.5 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  <div className="border-b border-slate-100 px-3.5 py-2.5">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>

                  <Link
                    to="/app"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <LayoutDashboard className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    My resumes
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* min-h-0 lets a child opt into its own scroll container instead of
          pushing the page taller. */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
