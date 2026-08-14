using PadelBooking.Api.Models;

namespace PadelBooking.Api.DTOs;

public record RequestedSlot(DateOnly Date, TimeSpan StartTime);

public record CreateBookingRequest(
    string PhoneNumber,
    string? CustomerName,
    string? Email,
    PaymentMethod PaymentMethod,
    List<RequestedSlot> Slots
);

public record BookingResultDto(
    int BookingId,
    decimal TotalPrice,
    BookingStatus Status,
    PaymentMethod PaymentMethod,
    string? ThawaniPaymentUrl
);

public record BookingListItemDto(
    int Id,
    string PhoneNumber,
    string? CustomerName,
    decimal TotalPrice,
    BookingStatus Status,
    PaymentMethod PaymentMethod,
    DateTime CreatedAt,
    List<string> CourtNames,
    List<DateOnly> Dates
);
