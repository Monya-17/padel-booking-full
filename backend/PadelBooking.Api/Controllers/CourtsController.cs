using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.Api.Data;
using PadelBooking.Api.DTOs;
using PadelBooking.Api.Models;

namespace PadelBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // every endpoint here is admin-only
public class CourtsController : ControllerBase
{
    private readonly PadelDbContext _db;
    public CourtsController(PadelDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Courts.Include(c => c.Closures).Include(c => c.PricingRules).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCourtRequest req)
    {
        var court = new Court
        {
            Name = req.Name,
            PricePerHour = req.PricePerHour,
            OpeningTime = req.OpeningTime,
            ClosingTime = req.ClosingTime
        };
        _db.Courts.Add(court);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = court.Id }, court);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCourtRequest req)
    {
        var court = await _db.Courts.FindAsync(id);
        if (court == null) return NotFound();

        court.Name = req.Name;
        court.PricePerHour = req.PricePerHour;
        court.OpeningTime = req.OpeningTime;
        court.ClosingTime = req.ClosingTime;
        court.IsActive = req.IsActive;

        await _db.SaveChangesAsync();
        return Ok(court);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var court = await _db.Courts.FindAsync(id);
        if (court == null) return NotFound();

        _db.Courts.Remove(court);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---- Closures (close one court, several, or all courts for specific dates) ----

    [HttpPost("closures")]
    public async Task<IActionResult> AddClosure([FromBody] CreateClosureRequest req)
    {
        var closure = new CourtClosure
        {
            CourtId = req.CourtId, // null => applies to ALL courts
            StartDate = req.StartDate,
            EndDate = req.EndDate,
            Reason = req.Reason
        };
        _db.CourtClosures.Add(closure);
        await _db.SaveChangesAsync();
        return Ok(closure);
    }

    [HttpDelete("closures/{closureId}")]
    public async Task<IActionResult> RemoveClosure(int closureId)
    {
        var closure = await _db.CourtClosures.FindAsync(closureId);
        if (closure == null) return NotFound();

        _db.CourtClosures.Remove(closure);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---- Pricing rules (hour-count based offers) ----

    [HttpPost("pricing-rules")]
    public async Task<IActionResult> AddPricingRule([FromBody] CreatePricingRuleRequest req)
    {
        var rule = new PricingRule
        {
            CourtId = req.CourtId, // null => global offer across all courts
            MinHours = req.MinHours,
            PricePerHour = req.PricePerHour
        };
        _db.PricingRules.Add(rule);
        await _db.SaveChangesAsync();
        return Ok(rule);
    }

    [HttpDelete("pricing-rules/{ruleId}")]
    public async Task<IActionResult> RemovePricingRule(int ruleId)
    {
        var rule = await _db.PricingRules.FindAsync(ruleId);
        if (rule == null) return NotFound();

        _db.PricingRules.Remove(rule);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
