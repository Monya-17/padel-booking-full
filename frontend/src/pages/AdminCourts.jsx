import { useEffect, useState } from 'react'
import { api } from '../api.js'

const emptyCourt = { name: '', pricePerHour: 10, openingTime: '08:00', closingTime: '23:00', isActive: true }
const emptyClosure = { courtId: '', startDate: '', endDate: '', reason: '' }

export default function AdminCourts() {
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyCourt)
  const [editingId, setEditingId] = useState(null)
  const [closureForm, setClosureForm] = useState(emptyClosure)

  function load() {
    setLoading(true)
    api.getCourts().then(setCourts).finally(() => setLoading(false))
  }
  useEffect(load, [])

  function toTimeSpan(t) { return `${t}:00` }
  function fromTimeSpan(t) { return t?.slice(0, 5) || '00:00' }

  async function saveCourt() {
    const payload = {
      name: form.name,
      pricePerHour: Number(form.pricePerHour),
      openingTime: toTimeSpan(form.openingTime),
      closingTime: toTimeSpan(form.closingTime),
      isActive: form.isActive
    }
    if (editingId) {
      await api.updateCourt(editingId, payload)
    } else {
      await api.createCourt(payload)
    }
    setForm(emptyCourt)
    setEditingId(null)
    load()
  }

  function editCourt(c) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      pricePerHour: c.pricePerHour,
      openingTime: fromTimeSpan(c.openingTime),
      closingTime: fromTimeSpan(c.closingTime),
      isActive: c.isActive
    })
  }

  async function removeCourt(id) {
    if (!confirm('حذف هذا الملعب نهائياً؟')) return
    await api.deleteCourt(id)
    load()
  }

  async function addClosure() {
    if (!closureForm.startDate || !closureForm.endDate) return
    await api.addClosure({
      courtId: closureForm.courtId ? Number(closureForm.courtId) : null,
      startDate: closureForm.startDate,
      endDate: closureForm.endDate,
      reason: closureForm.reason || null
    })
    setClosureForm(emptyClosure)
    load()
  }

  async function removeClosure(id) {
    await api.removeClosure(id)
    load()
  }

  return (
    <div>
      <div className="admin-header">
        <h1 style={{ fontSize: 24 }}>الملاعب</h1>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">{editingId ? 'تعديل ملعب' : 'إضافة ملعب جديد'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>اسم الملعب</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>السعر / ساعة</label>
            <input type="number" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>يفتح</label>
            <input type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>يغلق</label>
            <input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} />
          </div>
          <button className="btn-primary" onClick={saveCourt}>{editingId ? 'حفظ' : 'إضافة'}</button>
        </div>
      </div>

      {loading ? <p>جارِ التحميل...</p> : (
        <table style={{ marginBottom: 32 }}>
          <thead>
            <tr>
              <th>الاسم</th><th>السعر/ساعة</th><th>ساعات العمل</th><th>الحالة</th><th></th>
            </tr>
          </thead>
          <tbody>
            {courts.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.pricePerHour} ر.ع</td>
                <td>{fromTimeSpan(c.openingTime)} – {fromTimeSpan(c.closingTime)}</td>
                <td>{c.isActive ? 'مفعّل' : 'معطّل'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost" onClick={() => editCourt(c)}>تعديل</button>
                  <button className="btn-danger" onClick={() => removeCourt(c.id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="card">
        <div className="section-title">إغلاق ملعب أو كل الملاعب لتاريخ معيّن</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr auto', gap: 10, alignItems: 'end', marginBottom: 20 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>الملعب</label>
            <select value={closureForm.courtId} onChange={(e) => setClosureForm({ ...closureForm, courtId: e.target.value })}>
              <option value="">كل الملاعب</option>
              {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>من تاريخ</label>
            <input type="date" value={closureForm.startDate} onChange={(e) => setClosureForm({ ...closureForm, startDate: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>إلى تاريخ</label>
            <input type="date" value={closureForm.endDate} onChange={(e) => setClosureForm({ ...closureForm, endDate: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>السبب (اختياري)</label>
            <input value={closureForm.reason} onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })} />
          </div>
          <button className="btn-primary" onClick={addClosure}>إغلاق</button>
        </div>

        {courts.some(c => c.closures?.length) && (
          <table>
            <thead><tr><th>الملعب</th><th>من</th><th>إلى</th><th>السبب</th><th></th></tr></thead>
            <tbody>
              {courts.flatMap((c) => (c.closures || []).map((cl) => (
                <tr key={cl.id}>
                  <td>{cl.courtId ? c.name : 'كل الملاعب'}</td>
                  <td>{cl.startDate}</td>
                  <td>{cl.endDate}</td>
                  <td>{cl.reason || '—'}</td>
                  <td><button className="btn-danger" onClick={() => removeClosure(cl.id)}>إزالة</button></td>
                </tr>
              )))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
