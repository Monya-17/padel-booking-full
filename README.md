# منصة حجز ملاعب البادل

منصة إلكترونية لحجز ملاعب البادل — لوحة تحكم للإدارة وواجهة حجز للعميل بدون تسجيل حساب.

## التقنيات المستخدمة

- **الباكند**: ASP.NET Core 8 Web API + Entity Framework Core + SQLite، مصادقة JWT للأدمن، تكامل مع بوابة الدفع Thawani.
- **الفرونت اند**: React 18 + Vite + React Router (واجهة ويب، RTL بالكامل).

## خطوات التشغيل

### 1) الباكند

```bash
cd backend/PadelBooking.Api
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

قبل التشغيل، عدّل `appsettings.json`:
- `Jwt:Key` → مفتاح عشوائي طويل (32 حرف فأكثر).
- `Thawani:SecretKey` و `Thawani:PublishableKey` → مفاتيح بيئة الاختبار من [Thawani Sandbox](https://thawani-technologies.stoplight.io/docs/thawani-ecommerce-api).
- `SeedAdmin:Username` / `SeedAdmin:Password` → بيانات دخول الأدمن (تُنشأ تلقائياً أول تشغيل).

الـ API يعمل افتراضياً على `http://localhost:5000` (أو المنفذ الذي يحدده dotnet).

### 2) الفرونت اند

```bash
cd frontend
npm install
cp .env.example .env   # عدّل VITE_API_URL إذا لزم
npm run dev
```

يفتح على `http://localhost:5173`.

- واجهة العميل: `/`
- لوحة تحكم الأدمن: `/admin/login`

## بيانات الدخول للوحة التحكم

```
اسم المستخدم: admin
كلمة المرور: ChangeMe123!
```
(القيم الافتراضية من `SeedAdmin` في `appsettings.json` — غيّرها قبل أي نشر حقيقي)

## ملاحظات

- منطق توزيع الحجز: عند تأكيد الحجز، يتحقق النظام من الملاعب المتاحة لكل ساعة مطلوبة، ثم يختار ملعباً عشوائياً من بينها — اسم الملعب لا يظهر للعميل أبداً، فقط للأدمن.
- الحماية من التعارض: كل حجز يمر عبر transaction + unique index على (الملعب، التاريخ، الساعة) في قاعدة البيانات، لمنع حجز نفس الملعب مرتين في نفس اللحظة حتى مع طلبات متزامنة.
- التسعير: قواعد الأسعار مبنية على إجمالي عدد الساعات في نفس عملية الحجز (وليس لكل ساعة منفردة)، مع إمكانية عمل قواعد خاصة بملعب معيّن تتفوق على القواعد العامة.
- لم يتم نشر نسخة تجريبية حية (Demo) ضمن هذا التسليم.
