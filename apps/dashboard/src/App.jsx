import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Staff from './pages/Staff'
import Shifts from './pages/Shifts'
import Records from './pages/Records'
import Attendance from './pages/Attendance'
import Payroll from './pages/Payroll'
import Stores from './pages/Stores'
import Sales from './pages/Sales'
import Goods from './pages/Goods'
import AiForecast from './pages/AiForecast'
import Vendors from './pages/Vendors'

function PrivateRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="staff" element={<PrivateRoute roles={['manager','admin','superadmin']}><Staff /></PrivateRoute>} />
        <Route path="shifts" element={<PrivateRoute roles={['manager','admin','superadmin']}><Shifts /></PrivateRoute>} />
        <Route path="records" element={<PrivateRoute roles={['manager','admin','superadmin']}><Records /></PrivateRoute>} />
        {/* legacy redirects */}
        <Route path="checklist" element={<Navigate to="/records" replace />} />
        <Route path="drive" element={<Navigate to="/records" replace />} />
        <Route path="attendance" element={<PrivateRoute roles={['manager','admin','superadmin']}><Attendance /></PrivateRoute>} />
        <Route path="payroll" element={<PrivateRoute roles={['admin','superadmin']}><Payroll /></PrivateRoute>} />
        <Route path="stores" element={<PrivateRoute roles={['admin','superadmin']}><Stores /></PrivateRoute>} />
        <Route path="sales" element={<PrivateRoute roles={['admin','superadmin']}><Sales /></PrivateRoute>} />
        <Route path="goods" element={<PrivateRoute roles={['admin','superadmin']}><Goods /></PrivateRoute>} />
        <Route path="ai-forecast" element={<PrivateRoute roles={['manager','admin','superadmin']}><AiForecast /></PrivateRoute>} />
        <Route path="vendors" element={<PrivateRoute roles={['admin','superadmin']}><Vendors /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
