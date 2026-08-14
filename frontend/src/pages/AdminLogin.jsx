import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login(username, password)
      localStorage.setItem('admin_token', res.token)
      navigate('/admin/bookings')
    } catch (err) {
      setError(err.message || 'بيانات الدخول غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ background: 'var(--court-teal-dark)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={submit} className="card" style={{ width: 360 }}>
        <div className="hero-eyebrow" style={{ color: 'var(--clay)' }}>لوحة التحكم</div>
        <h1 style={{ fontSize: 24, marginBottom: 20 }}>تسجيل الدخول</h1>

        <div className="field">
          <label>اسم المستخدم</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>كلمة المرور</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}

        <button className="btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'جارِ الدخول...' : 'دخول'}
        </button>
      </form>
    </div>
  )
}
