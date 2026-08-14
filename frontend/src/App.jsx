import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ClientBooking from './pages/ClientBooking.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminLayout from './pages/AdminLayout.jsx'
import AdminBookings from './pages/AdminBookings.jsx'
import AdminCourts from './pages/AdminCourts.jsx'
import AdminOffers from './pages/AdminOffers.jsx'

function RequireAuth({ children }) {
  const token = localStorage.getItem('admin_token')
  return token ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientBooking />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="bookings" replace />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="courts" element={<AdminCourts />} />
          <Route path="offers" element={<AdminOffers />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
