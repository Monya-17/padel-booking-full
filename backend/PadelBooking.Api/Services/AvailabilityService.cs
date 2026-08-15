using Microsoft.EntityFrameworkCore;
using PadelBooking.Api.Data;
using PadelBooking.Api.Models;

namespace PadelBooking.Api.Services;

public class TimeSlotDto
{
    public TimeSpan StartTime { get; set; }
    public bool IsAvailable { get; set; }
}

public interface IAvailabilityService
{
    /// <summary>
    /// Returns hourly slots for the given date. A slot is "available" as long as
    /// AT LEAST ONE active, non-closed court is free at that hour — court identity
    /// is never surfaced to the caller. Past slots (for today) are always unavailable.
    /// </summary>
    Task<List<TimeSlotDto>> GetAvailableSlotsAsync(DateOnly date);

    /// <summary>
    /// Returns the list of court IDs that are genuinely free (open, not closed,
    /// not already booked) at the given date+hour. Used internally at booking time.
    /// </summary>
    Task<List<int>> GetFreeCourtIdsAsync(DateOnly date, TimeSpan hour);
}

public class AvailabilityService : IAvailabilityService
{
    private readonly PadelDbContext _db;

    public AvailabilityService(PadelDbContext db) => _db = db;

    public async Task<List<TimeSlotDto>> GetAvailableSlotsAsync(DateOnly date)
    {
        var courts = await _db.Courts.Where(c => c.IsActive).ToListAsync();
        if (courts.Count == 0) return new List<TimeSlotDto>();

        var earliestOpen = courts.Min(c => c.OpeningTime);
        var latestClose = courts.Max(c => c.ClosingTime);

        var now = DateTime.Now;
        var isToday = date == DateOnly.FromDateTime(now);

        var slots = new List<TimeSlotDto>();
        for (var t = earliestOpen; t < latestClose; t = t.Add(TimeSpan.FromHours(1)))
        {
            if (isToday && t <= now.TimeOfDay)
            {
                slots.Add(new TimeSlotDto { StartTime = t, IsAvailable = false });
                continue;
            }

            var freeCourts = await GetFreeCourtIdsAsync(date, t);
            slots.Add(new TimeSlotDto { StartTime = t, IsAvailable = freeCourts.Count > 0 });
        }

        return slots;
    }

    public async Task<List<int>> GetFreeCourtIdsAsync(DateOnly date, TimeSpan hour)
    {
        var activeCourts = await _db.Courts
            .Include(c => c.Closures)
            .Where(c => c.IsActive)
            .ToListAsync();

        var courts = activeCourts
            .Where(c => c.OpeningTime <= hour && c.ClosingTime > hour)
            .ToList();

        var bookedCourtIds = await _db.BookingSlots
            .Where(s => s.Date == date && s.StartTime == hour)
            .Where(s => s.Booking.Status != BookingStatus.Cancelled)
            .Select(s => s.CourtId)
            .ToListAsync();

        var freeCourts = courts.Where(c =>
            !bookedCourtIds.Contains(c.Id) &&
            !c.Closures.Any(cl => date >= cl.StartDate && date <= cl.EndDate)
        ).Select(c => c.Id).ToList();

        return freeCourts;
    }
}
