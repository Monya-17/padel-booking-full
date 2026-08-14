using System.Net.Http.Headers;
using System.Text.Json;
using PadelBooking.Api.Models;

namespace PadelBooking.Api.Services;

public record ThawaniSessionResult(string SessionId, string CheckoutUrl);

public interface IThawaniPaymentService
{
    Task<ThawaniSessionResult> CreateCheckoutSessionAsync(Booking booking);
    Task<string> GetSessionStatusAsync(string sessionId);
}

/// <summary>
/// Thin wrapper around the Thawani e-commerce API (sandbox docs:
/// https://thawani-technologies.stoplight.io/docs/thawani-ecommerce-api).
/// Reads keys from configuration — see appsettings.json "Thawani" section.
/// </summary>
public class ThawaniPaymentService : IThawaniPaymentService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public ThawaniPaymentService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;

        var baseUrl = _config["Thawani:BaseUrl"] ?? "https://uatcheckout.thawani.om/api/v1/";
        _http.BaseAddress = new Uri(baseUrl);
        _http.DefaultRequestHeaders.Add("thawani-api-key", _config["Thawani:SecretKey"]);
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<ThawaniSessionResult> CreateCheckoutSessionAsync(Booking booking)
    {
        var payload = new
        {
            client_reference_id = booking.Id.ToString(),
            mode = "payment",
            products = new[]
            {
                new
                {
                    name = $"Padel court booking #{booking.Id}",
                    quantity = 1,
                    unit_amount = (int)(booking.TotalPrice * 1000) // Thawani uses baisa (1 OMR = 1000 baisa)
                }
            },
            success_url = _config["Thawani:SuccessUrl"],
            cancel_url = _config["Thawani:CancelUrl"],
            metadata = new { booking_id = booking.Id }
        };

        var response = await _http.PostAsJsonAsync("checkout/session", payload);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var sessionId = body.GetProperty("data").GetProperty("session_id").GetString()!;
        var publishableKey = _config["Thawani:PublishableKey"];
        var checkoutBaseUrl = _config["Thawani:CheckoutBaseUrl"] ?? "https://uatcheckout.thawani.om/pay/";

        return new ThawaniSessionResult(sessionId, $"{checkoutBaseUrl}{sessionId}?key={publishableKey}");
    }

    public async Task<string> GetSessionStatusAsync(string sessionId)
    {
        var response = await _http.GetAsync($"checkout/session/{sessionId}");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("data").GetProperty("payment_status").GetString() ?? "unknown";
    }
}
