using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class TsubasaDbContext : DbContext
{
    public TsubasaDbContext(DbContextOptions<TsubasaDbContext> options) : base(options)
    {
    }

    public DbSet<Player> Players { get; set; }
    public DbSet<Technique> Techniques { get; set; }
    public DbSet<PlayerVersionTechnique> PlayerVersionTechniques { get; set; }
    public DbSet<TeamSkill> TeamSkills { get; set; }
    public DbSet<Skill> Skills { get; set; }
    public DbSet<PlayerLatentSkill> PlayerLatentSkills { get; set; }
    public DbSet<Country> Countries { get; set; }
    public DbSet<Series> Series { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<Rarity> Rarities { get; set; }
    public DbSet<Element> Elements { get; set; }
    public DbSet<TechType> TechTypes { get; set; }
    public DbSet<PlayerBase> PlayerBases { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configurar Player
        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.OwnsOne(p => p.Stats); // PlayerStats como objeto de valor
            entity.HasMany(p => p.PlayerTechniques)
                .WithOne(pvt => pvt.Player)
                .HasForeignKey(pvt => pvt.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(p => p.PlayerBase)
                .WithMany(pb => pb.Players)
                .HasForeignKey(p => p.PlayerBaseId)
                .IsRequired();

            entity.HasOne(p => p.Rarity).WithMany().HasForeignKey(p => p.RarityId).IsRequired(true);
            entity.HasOne(p => p.Element).WithMany().HasForeignKey(p => p.ElementId).IsRequired(true);
            entity.HasOne(p => p.Team).WithMany().HasForeignKey(p => p.TeamId).IsRequired(false);
            entity.HasOne(p => p.Series).WithMany().HasForeignKey(p => p.SeriesId).IsRequired(false);
            entity.HasOne(p => p.TeamSkill).WithMany().HasForeignKey("TeamSkillId").IsRequired(false);
            entity.HasOne(p => p.PassiveSkill).WithMany().HasForeignKey("PassiveSkillId").IsRequired(false);
            entity.HasMany(p => p.PlayerLatentSkills)
                .WithOne(pls => pls.Player)
                .HasForeignKey(pls => pls.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configurar Technique
        modelBuilder.Entity<Technique>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasMany(t => t.PlayerVersions)
                .WithOne(pvt => pvt.Technique)
                .HasForeignKey(pvt => pvt.TechniqueId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(t => t.TechType)
                .WithMany()
                .HasForeignKey(t => t.TechTypeId)
                .IsRequired();

            entity.HasOne(t => t.PlayerBase)
                .WithMany(pb => pb.Techniques)
                .HasForeignKey(t => t.PlayerBaseId)
                .IsRequired();
        });

        // PlayerBase
        modelBuilder.Entity<PlayerBase>(entity =>
        {
            entity.HasKey(pb => pb.Id);
            entity.HasIndex(pb => pb.Name).IsUnique();
            entity.HasOne(pb => pb.Country).WithMany().HasForeignKey(pb => pb.CountryId).IsRequired(false);
        });

        // Element: ventaja de afinidad (auto-referencia)
        modelBuilder.Entity<Element>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.AdvantageOver)
                .WithMany()
                .HasForeignKey(e => e.AdvantageOverElementId)
                .IsRequired(false);
        });

        // Configurar PlayerVersionTechnique
        modelBuilder.Entity<PlayerVersionTechnique>(entity =>
        {
            entity.HasKey(pvt => pvt.Id);
            entity.HasIndex(pvt => new { pvt.PlayerId, pvt.TechniqueId }).IsUnique();
        });

        // Configurar PlayerLatentSkill (many-to-many entre Player y Skill)
        modelBuilder.Entity<PlayerLatentSkill>(entity =>
        {
            entity.HasKey(pls => pls.Id);
            entity.HasOne(pls => pls.Player)
                .WithMany(p => p.PlayerLatentSkills)
                .HasForeignKey(pls => pls.PlayerId);
            entity.HasOne(pls => pls.Skill)
                .WithMany(s => s.PlayerVersions)
                .HasForeignKey(pls => pls.SkillId);
            entity.HasIndex(pls => new { pls.PlayerId, pls.SkillId }).IsUnique();
        });

        // Configurar Skills
        modelBuilder.Entity<TeamSkill>().HasKey(s => s.Id);
        
        modelBuilder.Entity<Skill>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Bonuses)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<SkillBonus>>(v, (System.Text.Json.JsonSerializerOptions?)null)
                );
        });
    }
}
