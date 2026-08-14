# Padel Booking API (.NET 8)

## Setup

```bash
cd PadelBooking.Api
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

Swagger UI: `https://localhost:<port>/swagger`

## Before running

1. Edit `appsettings.json`:
   - `Jwt:Key` — replace with a long random secret (32+ chars).
   - `Thawani:SecretKey` / `Thawani:PublishableKey` — get sandbox keys from
     https://thawani-technologies.stoplight.io/docs/thawani-ecommerce-api
   - `SeedAdmin:Username` / `SeedAdmin:Password` — the admin login created
     automatically on first run (change the password after first login in a
     real deployment).
   - `Cors:AllowedOrigins` — the React dev server URL (default `http://localhost:5173`).

2. The first `dotnet run` auto-applies EF Core migrations and seeds the admin
   user, so the SQLite DB file appears automatically — no manual DB setup needed.

## Project layout

- `Models/` — Court, CourtClosure, PricingRule, Booking, BookingSlot, AdminUser
- `Data/PadelDbContext.cs` — EF Core context + relationships/indexes
- `Services/`
  - `AvailabilityService` — computes open hourly slots per date without
    ever exposing which physical court is free (per the brief's requirement
    that court identity stays hidden from clients)
  - `PricingService` — hour-count based offers (e.g. 1h = 10 OMR/hr,
    2h+ = 8 OMR/hr), court-specific rules override global ones
  - `BookingService` — validates requested slots, randomly assigns a free
    court per hour, prices the whole transaction, and persists atomically
    inside a DB transaction (the unique index on `(CourtId, Date, StartTime)`
    is the final race-condition guard)
  - `ThawaniPaymentService` — creates a Thawani checkout session for online
    payments
- `Controllers/`
  - `AvailabilityController` — public, returns only `{time, available}`
  - `BookingsController` — public `POST` to create a booking; `GET`/`cancel`
    are admin-only and filterable by court/date/status/payment method/phone
  - `CourtsController` — admin-only CRUD for courts, closures, pricing rules
  - `AuthController` — admin login, issues a JWT
