import { useEffect, useState } from 'react'
import { api } from '../api.js'

const STATUS_LABELS = { Confirmed: 'مؤكد', PendingPayment: 'بانتظار الدفع', Cancelled: 'ملغى' }
const PAYMENT_LABELS = { PayOnArrival: 'عند الوصول', Online: 'إلكتروني' }

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ phone: '', date: '', status: '', paymentMethod: '' })

  function load() {
    setLoading(true)
    api.getBookings(filters)
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters.status, filters.paymentMethod, filters.date])

  async function cancel(id) {
    if (!confirm('إلغاء هذا الحجز؟')) return
    await api.cancelBooking(id)
    load()
  }

  return (
    <div>
      <div className="admin-header">
        <h1 style={{ fontSize: 24 }}>الحجوزات</h1>
      </div>

      <div className="filters-bar">
        <input
          placeholder="بحث برقم الهاتف"
          value={filters.phone}
          onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">كل الحالات</option>
          <option value="Confirmed">مؤكد</option>
          <option value="PendingPayment">بانتظار الدفع</option>
          <option value="Cancelled">ملغى</option>
        </select>
        <select value={filters.paymentMethod} onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}>
          <option value="">كل طرق الدفع</option>
          <option value="PayOnArrival">عند الوصول</option>
          <option value="Online">إلكتروني</option>
        </select>
        <button className="btn-ghost" onClick={load}>بحث</button>
      </div>

      {loading ? (
        <p>جارِ التحميل...</p>
      ) : error ? (
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state">لا توجد حجوزات مطابقة.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>الهاتف</th>
              <th>الاسم</th>
              <th>التواريخ</th>
              <th>الملعب</th>
              <th>الإجمالي</th>
              <th>الدفع</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.phoneNumber}</td>
                <td>{b.customerName || '—'}</td>
                <td>{b.dates?.join('، ')}</td>
                <td>{b.courtNames?.join('، ')}</td>
                <td>{b.totalPrice} ر.ع</td>
                <td>{PAYMENT_LABELS[b.paymentMethod] || b.paymentMethod}</td>
                <td><span className="badge" data-status={b.status}>{STATUS_LABELS[b.status] || b.status}</span></td>
                <td>
                  {b.status !== 'Cancelled' && (
                    <button className="btn-danger" onClick={() => cancel(b.id)}>إلغاء</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
