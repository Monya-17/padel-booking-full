import { useEffect, useState, useMemo } from 'react'
import { api } from '../api.js'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatTime(t) {
  const [h] = t.split(':').map(Number)
  const period = h >= 12 ? 'م' : 'ص'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:00 ${period}`
}

export default function ClientBooking() {
  const [date, setDate] = useState(todayStr())
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selected, setSelected] = useState([]) // [{date, startTime}]
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PayOnArrival')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    setLoadingSlots(true)
    api.getAvailability(date)
      .then(setSlots)
      .catch(() => showToast('تعذّر تحميل الأوقات المتاحة', 'error'))
      .finally(() => setLoadingSlots(false))
  }, [date])

  function showToast(message, tone = 'default') {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 3500)
  }

  function toggleSlot(time, available) {
    if (!available) return
    const key = `${date}|${time}`
    const exists = selected.find(s => `${s.date}|${s.startTime}` === key)
    if (exists) {
      setSelected(selected.filter(s => `${s.date}|${s.startTime}` !== key))
    } else {
      setSelected([...selected, { date, startTime: time }])
    }
  }

  const isSelected = (time) => selected.some(s => s.date === date && s.startTime === time)

  const groupedByDate = useMemo(() => {
    const groups = {}
    for (const s of selected) {
      groups[s.date] = groups[s.date] || []
      groups[s.date].push(s.startTime)
    }
    return groups
  }, [selected])

  async function submit() {
    if (!phone.trim()) {
      showToast('رقم الهاتف مطلوب', 'error')
      return
    }
    if (selected.length === 0) {
      showToast('اختر ساعة واحدة على الأقل', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.createBooking({
        phoneNumber: phone.trim(),
        customerName: name.trim() || null,
        email: email.trim() || null,
        paymentMethod,
        slots: selected.map(s => ({ date: s.date, startTime: `${s.startTime}:00` }))
      })
      setResult(res)
      if (res.thawaniPaymentUrl) {
        window.location.href = res.thawaniPaymentUrl
      }
    } catch (err) {
      showToast(err.message || 'تعذّر إتمام الحجز، حاول مرة أخرى', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (result && !result.thawaniPaymentUrl) {
    return (
      <div className="page">
        <div className="hero">
          <div className="container">
            <div className="hero-eyebrow">تم تأكيد الحجز</div>
            <h1>شكراً لك، حجزك جاهز</h1>
          </div>
        </div>
        <div className="container" style={{ padding: '32px 20px' }}>
          <div className="card" style={{ maxWidth: 460, margin: '0 auto' }}>
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>رقم الحجز</p>
            <h2 style={{ fontSize: 28, margin: '4px 0 16px' }}>#{result.bookingId}</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>الإجمالي</p>
            <h2 style={{ fontSize: 28, margin: '4px 0 20px' }}>{result.totalPrice} ر.ع</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
              {paymentMethod === 'PayOnArrival'
                ? 'الدفع سيكون عند الوصول إلى الملعب.'
                : 'تم الدفع بنجاح عبر ثواني.'}
            </p>
            <button className="btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={() => window.location.reload()}>
              حجز جديد
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="hero">
        <div className="container">
          <div className="hero-eyebrow">حجز ملاعب بادل</div>
          <h1>احجز ملعبك في ثوانٍ، بدون حساب</h1>
          <p>اختر التاريخ والوقت المناسب، وأدخل رقم هاتفك فقط — نتكفل بالباقي.</p>
        </div>
      </div>

      <div className="container" style={{ padding: '28px 20px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card">
          <div className="section-title">التاريخ</div>
          <div className="date-field">
            <input
              type="date"
              value={date}
              min={todayStr()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="card">
          <div className="section-title">الأوقات المتاحة</div>
          {loadingSlots ? (
            <p style={{ color: 'var(--ink-soft)' }}>جارِ التحميل...</p>
          ) : slots.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)' }}>لا توجد أوقات لهذا اليوم.</p>
          ) : (
            <div className="slot-grid">
              {slots.map((s) => {
                const state = isSelected(s.time) ? 'selected' : s.available ? 'available' : 'unavailable'
                return (
                  <button
                    key={s.time}
                    type="button"
                    className="slot"
                    data-state={state}
                    onClick={() => toggleSlot(s.time, s.available)}
                    disabled={!s.available}
                  >
                    {formatTime(s.time)}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="card">
            <div className="section-title">ملخص الحجز ({selected.length} ساعة)</div>
            {Object.entries(groupedByDate).map(([d, times]) => (
              <div key={d} style={{ marginBottom: 8, fontSize: 14 }}>
                <strong>{d}</strong> — {times.sort().map(formatTime).join('، ')}
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <div className="section-title">بياناتك</div>
          <div className="field">
            <label>رقم الهاتف *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9XXXXXXX" />
          </div>
          <div className="field">
            <label>الاسم (اختياري)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>البريد الإلكتروني (اختياري)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label>طريقة الدفع</label>
            <div className="payment-options">
              <button
                type="button"
                className="payment-option"
                data-selected={paymentMethod === 'PayOnArrival'}
                onClick={() => setPaymentMethod('PayOnArrival')}
              >
                الدفع عند الوصول
              </button>
              <button
                type="button"
                className="payment-option"
                data-selected={paymentMethod === 'Online'}
                onClick={() => setPaymentMethod('Online')}
              >
                دفع إلكتروني (ثواني)
              </button>
            </div>
          </div>

          <button className="btn-accent" style={{ width: '100%' }} onClick={submit} disabled={submitting}>
            {submitting ? 'جارِ التأكيد...' : 'تأكيد الحجز'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="toast" data-tone={toast.tone}>{toast.message}</div>
      )}
    </div>
  )
}
