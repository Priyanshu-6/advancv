import { Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import Preview from './pages/Preview'
import Login from './pages/Login'
import { ProtectedRoute } from './components/ProtectedRoute'

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-center">
    <div>
      <p className="text-sm font-semibold text-teal-600">404</p>
      <h1 className="mt-1 text-xl font-bold text-slate-900">Page not found</h1>
      <Link
        to="/"
        className="mt-4 inline-block text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        Go home
      </Link>
    </div>
  </div>
)

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="login" element={<Login />} />

      {/* Public share link — no auth, no app chrome. */}
      <Route path="view/:resumeId" element={<Preview />} />

      <Route
        path="app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="builder/:resumeId" element={<ResumeBuilder />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
