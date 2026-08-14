import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export default function AdminLayout() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">لوحة التحكم</div>
        <NavLink to="/admin/bookings" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          الحجوزات
        </NavLink>
        <NavLink to="/admin/courts" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          الملاعب
        </NavLink>
        <NavLink to="/admin/offers" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          العروض والأسعار
        </NavLink>
        <button
          onClick={logout}
          className="admin-nav-link"
          style={{ marginTop: 'auto', background: 'none', width: '100%', textAlign: 'right' }}
        >
          تسجيل الخروج
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
