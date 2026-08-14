namespace PadelBooking.Api.Models;

public enum BookingStatus
{
    PendingPayment, // created, waiting for online payment confirmation
    Confirmed,      // paid online, or pay-on-arrival accepted
    Cancelled
}

public enum PaymentMethod
{
    PayOnArrival,
    Online
}

/// <summary>
/// One customer transaction. A single booking can cover multiple hours
/// across multiple days — each individual hour is a BookingSlot.
/// </summary>
public class Booking
{
    public int Id { get; set; }

    public string PhoneNumber { get; set; } = string.Empty; // required
    public string? CustomerName { get; set; }               // optional
    public string? Email { get; set; }                      // optional

    public PaymentMethod PaymentMethod { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.PendingPayment;

    public decimal TotalPrice { get; set; }

    public string? ThawaniSessionId { get; set; }
    public string? ThawaniPaymentStatus { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BookingSlot> Slots { get; set; } = new List<BookingSlot>();
}

/// <summary>
/// A single hour, on a single date, on a specific (randomly-assigned) court.
/// This is the unit that availability is calculated against.
/// </summary>
public class BookingSlot
{
    public int Id { get; set; }

    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    public int CourtId { get; set; } // assigned randomly at confirmation time — never shown to the client
    public Court Court { get; set; } = null!;

    public DateOnly Date { get; set; }
    public TimeSpan StartTime { get; set; } // hour-aligned, e.g. 18:00
}
