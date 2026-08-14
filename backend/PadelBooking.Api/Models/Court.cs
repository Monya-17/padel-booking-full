namespace PadelBooking.Api.Models;

/// <summary>
/// A physical padel court. Names/numbers are never shown to clients —
/// only used internally by admins and the random-allocation logic.
/// </summary>
public class Court
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. "Court 1" — admin-facing only
    public bool IsActive { get; set; } = true;

    public decimal PricePerHour { get; set; } // base price, can be overridden by PricingRule

    public TimeSpan OpeningTime { get; set; } = new(8, 0, 0);
    public TimeSpan ClosingTime { get; set; } = new(23, 0, 0);

    public ICollection<CourtClosure> Closures { get; set; } = new List<CourtClosure>();
    public ICollection<PricingRule> PricingRules { get; set; } = new List<PricingRule>();
    public ICollection<BookingSlot> BookingSlots { get; set; } = new List<BookingSlot>();
}

/// <summary>
/// Marks a court (or, via CourtId == null, ALL courts) closed for a specific
/// date or date range — e.g. maintenance day, holiday.
/// </summary>
public class CourtClosure
{
    public int Id { get; set; }
    public int? CourtId { get; set; } // null = applies to every court
    public Court? Court { get; set; }

    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? Reason { get; set; }
}

/// <summary>
/// Hour-count based pricing offer, e.g. 1 hour = 10 OMR/hr, 2+ hours = 8 OMR/hr.
/// Rules are evaluated per booking by MinHours descending, first match wins.
/// A rule with CourtId == null applies to all courts (global offer).
/// </summary>
public class PricingRule
{
    public int Id { get; set; }
    public int? CourtId { get; set; }
    public Court? Court { get; set; }

    public int MinHours { get; set; } // e.g. 1, 2, 3...
    public decimal PricePerHour { get; set; }
}

public class AdminUser
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
}
