using PadelBooking.Api.Data;
using PadelBooking.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace PadelBooking.Api.Services;

public interface IPricingService
{
    /// <summary>
    /// Calculates total price for a booking of <paramref name="totalHours"/> hours.
    /// Offers are hour-count based and apply to the WHOLE transaction, e.g.
    /// 1 hour = 10 OMR/hr, 2+ hours = 8 OMR/hr. The rule with the highest
    /// MinHours that is still &lt;= totalHours wins.
    /// </summary>
    Task<decimal> CalculateTotalPriceAsync(int? courtId, int totalHours);
}

public class PricingService : IPricingService
{
    private readonly PadelDbContext _db;

    public PricingService(PadelDbContext db) => _db = db;

    public async Task<decimal> CalculateTotalPriceAsync(int? courtId, int totalHours)
    {
        if (totalHours <= 0) return 0;

        // Court-specific rules take priority over global (CourtId == null) rules.
        var rules = await _db.PricingRules
            .Where(r => r.CourtId == courtId || r.CourtId == null)
            .ToListAsync();

        var bestRule = rules
            .Where(r => r.MinHours <= totalHours)
            .OrderByDescending(r => r.CourtId.HasValue) // prefer court-specific
            .ThenByDescending(r => r.MinHours)
            .FirstOrDefault();

        decimal pricePerHour;
        if (bestRule != null)
        {
            pricePerHour = bestRule.PricePerHour;
        }
        else if (courtId.HasValue)
        {
            var court = await _db.Courts.FindAsync(courtId.Value);
            pricePerHour = court?.PricePerHour ?? 0;
        }
        else
        {
            pricePerHour = 0;
        }

        return pricePerHour * totalHours;
    }
}
