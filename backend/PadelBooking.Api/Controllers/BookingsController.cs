using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.Api.Data;
using PadelBooking.Api.DTOs;
using PadelBooking.Api.Models;
using PadelBooking.Api.Services;

namespace PadelBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly PadelDbContext _db;

    public BookingsController(IBookingService bookingService, PadelDbContext db)
    {
        _bookingService = bookingService;
        _db = db;
    }

    /// <summary>POST /api/bookings — public, no auth required.</summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
    {
        try
        {
            var result = await _bookingService.CreateBookingAsync(request);
            return Ok(result);
        }
        catch (BookingConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/bookings?courtId=&date=&status=&paymentMethod=&phone=
    /// Admin only — filterable list of all bookings.
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> List(
        [FromQuery] int? courtId,
        [FromQuery] DateOnly? date,
        [FromQuery] BookingStatus? status,
        [FromQuery] PaymentMethod? paymentMethod,
        [FromQuery] string? phone)
    {
        var query = _db.Bookings
            .Include(b => b.Slots).ThenInclude(s => s.Court)
            .AsQueryable();

        if (status.HasValue) query = query.Where(b => b.Status == status);
        if (paymentMethod.HasValue) query = query.Where(b => b.PaymentMethod == paymentMethod);
        if (!string.IsNullOrWhiteSpace(phone)) query = query.Where(b => b.PhoneNumber.Contains(phone));
        if (courtId.HasValue) query = query.Where(b => b.Slots.Any(s => s.CourtId == courtId));
        if (date.HasValue) query = query.Where(b => b.Slots.Any(s => s.Date == date));

        var bookings = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();

        var result = bookings.Select(b => new BookingListItemDto(
            b.Id,
            b.PhoneNumber,
            b.CustomerName,
            b.TotalPrice,
            b.Status,
            b.PaymentMethod,
            b.CreatedAt,
            b.Slots.Select(s => s.Court.Name).Distinct().ToList(),
            b.Slots.Select(s => s.Date).Distinct().ToList()
        ));

        return Ok(result);
    }

    /// <summary>PATCH /api/bookings/{id}/cancel — admin only.</summary>
    [HttpPatch("{id}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(int id)
    {
        var booking = await _db.Bookings.FindAsync(id);
        if (booking == null) return NotFound();

        booking.Status = BookingStatus.Cancelled;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
