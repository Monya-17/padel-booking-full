using Microsoft.AspNetCore.Mvc;
using PadelBooking.Api.Services;

namespace PadelBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AvailabilityController : ControllerBase
{
    private readonly IAvailabilityService _availability;

    public AvailabilityController(IAvailabilityService availability) => _availability = availability;

    /// <summary>GET /api/availability?date=2026-08-20</summary>
    [HttpGet]
    public async Task<IActionResult> GetSlots([FromQuery] DateOnly date)
    {
        if (date < DateOnly.FromDateTime(DateTime.Now))
            return BadRequest("Cannot check availability for a past date.");

        var slots = await _availability.GetAvailableSlotsAsync(date);
        return Ok(slots.Select(s => new { time = s.StartTime.ToString(@"hh\:mm"), available = s.IsAvailable }));
    }
}
