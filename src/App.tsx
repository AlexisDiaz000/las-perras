import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth"
import { authService } from "@/services/auth"
import Layout from "@/components/Layout"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import POS from "@/pages/POS"
import Orders from "@/pages/Orders"
import Inventory from "@/pages/Inventory"
import Expenses from "@/pages/Expenses"
import Reports from "@/pages/Reports"
import Settings from "@/pages/Settings"
import Products from "@/pages/Products"

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, isInitializing } = useAuthStore()
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }
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
  const { user, checkAuth, isInitializing } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      try {
        await checkAuth()
      } catch (e) {
        console.error("Auth init error:", e)
      }
    }
    
    const { data: sub } = authService.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({
          user: null,
          isInitializing: false,
          isLoading: false,
          authError: null,
          initError: null
        })
        return
      }
      if (event === 'SIGNED_IN') {
        await checkAuth()
      }
    })

    init()
    return () => {
      sub?.subscription?.unsubscribe()
    }
  }, [checkAuth])

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isInitializing
            ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            )
            : (!user ? <Login /> : <Navigate to="/dashboard" replace />)
        }
      />
      
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

      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['vendor', 'admin']}>
          <Orders />
        </ProtectedRoute>
      } />
      
      <Route path="/inventory" element={
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      } />

      <Route path="/products" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Products />
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
