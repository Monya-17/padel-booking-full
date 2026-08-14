namespace PadelBooking.Api.DTOs;

public record CreateCourtRequest(string Name, decimal PricePerHour, TimeSpan OpeningTime, TimeSpan ClosingTime);
public record UpdateCourtRequest(string Name, decimal PricePerHour, TimeSpan OpeningTime, TimeSpan ClosingTime, bool IsActive);

public record CreateClosureRequest(int? CourtId, DateOnly StartDate, DateOnly EndDate, string? Reason);

public record CreatePricingRuleRequest(int? CourtId, int MinHours, decimal PricePerHour);

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username);
