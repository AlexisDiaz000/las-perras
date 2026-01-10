import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuthStore } from "./stores/auth"
import { authService } from "./services/auth"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import POS from "./pages/POS"
import Inventory from "./pages/Inventory"
import Expenses from "./pages/Expenses"
import Reports from "./pages/Reports"
import Settings from "./pages/Settings"

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuthStore()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Layout>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">No autorizado</h2>
            <p className="text-gray-600">Tu rol no tiene acceso a esta sección.</p>
          </div>
        </div>
      </Layout>
    )
  }
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user, checkAuth } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        await checkAuth()
      } finally {
        setLoading(false)
      }
    }
    const { data: sub } = authService.onAuthStateChange(async () => {
      await checkAuth()
    })
    init()
    return () => {
      sub?.subscription?.unsubscribe()
    }
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/pos" element={
        <ProtectedRoute allowedRoles={['vendor', 'admin']}>
          <POS />
        </ProtectedRoute>
      } />
      
      <Route path="/inventory" element={
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      } />
      
      <Route path="/expenses" element={
        <ProtectedRoute>
          <Expenses />
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}
