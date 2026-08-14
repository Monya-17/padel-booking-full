using Microsoft.EntityFrameworkCore;
using PadelBooking.Api.Data;
using PadelBooking.Api.DTOs;
using PadelBooking.Api.Models;

namespace PadelBooking.Api.Services;

public class BookingConflictException : Exception
{
    public BookingConflictException(string message) : base(message) { }
}

public interface IBookingService
{
    Task<BookingResultDto> CreateBookingAsync(CreateBookingRequest request);
}

public class BookingService : IBookingService
{
    private readonly PadelDbContext _db;
    private readonly IAvailabilityService _availability;
    private readonly IPricingService _pricing;
    private readonly IThawaniPaymentService _thawani;
    private static readonly Random _rng = new();

    public BookingService(
        PadelDbContext db,
        IAvailabilityService availability,
        IPricingService pricing,
        IThawaniPaymentService thawani)
    {
        _db = db;
        _availability = availability;
        _pricing = pricing;
        _thawani = thawani;
    }

    public async Task<BookingResultDto> CreateBookingAsync(CreateBookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            throw new ArgumentException("Phone number is required.");
        if (request.Slots == null || request.Slots.Count == 0)
            throw new ArgumentException("At least one time slot is required.");

        var now = DateTime.Now;
        foreach (var s in request.Slots)
        {
            var slotDateTime = s.Date.ToDateTime(TimeOnly.FromTimeSpan(s.StartTime));
            if (slotDateTime <= now)
                throw new BookingConflictException($"Cannot book a past time slot: {s.Date} {s.StartTime}.");
        }

        // Use a transaction + the DB unique index (CourtId, Date, StartTime) as the
        // real source of truth for "no double booking", since two customers could
        // race for the same last free court between availability check and commit.
        await using var transaction = await _db.Database.BeginTransactionAsync();

        var allocatedSlots = new List<BookingSlot>();
        foreach (var requested in request.Slots)
        {
            var freeCourtIds = await _availability.GetFreeCourtIdsAsync(requested.Date, requested.StartTime);
            if (freeCourtIds.Count == 0)
                throw new BookingConflictException($"No courts available for {requested.Date} at {requested.StartTime}.");

            // Random assignment — the client never sees or chooses which court.
            var chosenCourtId = freeCourtIds[_rng.Next(freeCourtIds.Count)];

            allocatedSlots.Add(new BookingSlot
            {
                CourtId = chosenCourtId,
                Date = requested.Date,
                StartTime = requested.StartTime
            });
        }

        // Pricing is based on total hour count in this single transaction.
        var totalPrice = await _pricing.CalculateTotalPriceAsync(courtId: null, totalHours: allocatedSlots.Count);

        var booking = new Booking
        {
            PhoneNumber = request.PhoneNumber,
            CustomerName = request.CustomerName,
            Email = request.Email,
            PaymentMethod = request.PaymentMethod,
            TotalPrice = totalPrice,
            Status = request.PaymentMethod == PaymentMethod.PayOnArrival
                ? BookingStatus.Confirmed
                : BookingStatus.PendingPayment,
            Slots = allocatedSlots
        };

        _db.Bookings.Add(booking);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Unique index violation = someone else grabbed the same court/hour first.
            throw new BookingConflictException("One or more selected time slots were just booked by someone else. Please try again.");
        }

        string? paymentUrl = null;
        if (request.PaymentMethod == PaymentMethod.Online)
        {
            var session = await _thawani.CreateCheckoutSessionAsync(booking);
            booking.ThawaniSessionId = session.SessionId;
            await _db.SaveChangesAsync();
            paymentUrl = session.CheckoutUrl;
        }

        await transaction.CommitAsync();

        return new BookingResultDto(
            booking.Id,
            booking.TotalPrice,
            booking.Status,
            booking.PaymentMethod,
            paymentUrl
        );
    }
}
