using Microsoft.EntityFrameworkCore;
using PadelBooking.Api.Models;

namespace PadelBooking.Api.Data;

public class PadelDbContext : DbContext
{
    public PadelDbContext(DbContextOptions<PadelDbContext> options) : base(options) { }

    public DbSet<Court> Courts => Set<Court>();
    public DbSet<CourtClosure> CourtClosures => Set<CourtClosure>();
    public DbSet<PricingRule> PricingRules => Set<PricingRule>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingSlot> BookingSlots => Set<BookingSlot>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BookingSlot>()
            .HasIndex(s => new { s.CourtId, s.Date, s.StartTime })
            .IsUnique(); // a court can't be double-booked for the same hour

        modelBuilder.Entity<BookingSlot>()
            .HasOne(s => s.Booking)
            .WithMany(b => b.Slots)
            .HasForeignKey(s => s.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BookingSlot>()
            .HasOne(s => s.Court)
            .WithMany(c => c.BookingSlots)
            .HasForeignKey(s => s.CourtId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CourtClosure>()
            .HasOne(c => c.Court)
            .WithMany(court => court.Closures)
            .HasForeignKey(c => c.CourtId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PricingRule>()
            .HasOne(p => p.Court)
            .WithMany(c => c.PricingRules)
            .HasForeignKey(p => p.CourtId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AdminUser>()
            .HasIndex(a => a.Username)
            .IsUnique();
    }
}
