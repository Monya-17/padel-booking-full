import { useEffect, useState } from 'react'
import { api } from '../api.js'

const emptyRule = { courtId: '', minHours: 1, pricePerHour: '' }

export default function AdminOffers() {
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyRule)

  function load() {
    setLoading(true)
    api.getCourts().then(setCourts).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function addRule() {
    if (!form.pricePerHour) return
    await api.addPricingRule({
      courtId: form.courtId ? Number(form.courtId) : null,
      minHours: Number(form.minHours),
      pricePerHour: Number(form.pricePerHour)
    })
    setForm(emptyRule)
    load()
  }

  async function removeRule(id) {
    await api.removePricingRule(id)
    load()
  }

  const allRules = courts.flatMap((c) => (c.pricingRules || []).map((r) => ({ ...r, courtName: c.name })))

  return (
    <div>
      <div className="admin-header">
        <h1 style={{ fontSize: 24 }}>العروض والأسعار</h1>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">إضافة عرض جديد</div>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: -6, marginBottom: 14 }}>
          مثال: ساعة واحدة = 10 ر.ع، ساعتان فأكثر = 8 ر.ع للساعة. يتم تطبيق أعلى عتبة ساعات تنطبق على إجمالي حجز العميل.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>الملعب</label>
            <select value={form.courtId} onChange={(e) => setForm({ ...form, courtId: e.target.value })}>
              <option value="">كل الملاعب (عرض عام)</option>
              {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>عدد الساعات (الحد الأدنى)</label>
            <input type="number" min="1" value={form.minHours} onChange={(e) => setForm({ ...form, minHours: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>السعر للساعة</label>
            <input type="number" step="0.1" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} />
          </div>
          <button className="btn-primary" onClick={addRule}>إضافة</button>
        </div>
      </div>

      {loading ? <p>جارِ التحميل...</p> : allRules.length === 0 ? (
        <div className="empty-state">لا توجد عروض مضافة بعد.</div>
      ) : (
        <table>
          <thead><tr><th>الملعب</th><th>من (ساعات)</th><th>السعر/ساعة</th><th></th></tr></thead>
          <tbody>
            {allRules.map((r) => (
              <tr key={r.id}>
                <td>{r.courtId ? r.courtName : 'كل الملاعب'}</td>
                <td>{r.minHours}+</td>
                <td>{r.pricePerHour} ر.ع</td>
                <td><button className="btn-danger" onClick={() => removeRule(r.id)}>إزالة</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
