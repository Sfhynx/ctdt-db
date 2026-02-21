using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace backend.Models;

public class Player
{
    public int Id { get; set; }
    
    // Identidad del jugador (sin versión)
    public int PlayerBaseId { get; set; }
    public PlayerBase PlayerBase { get; set; } = null!;

    // Exponer el nombre como string para el frontend
    [NotMapped]
    public string Name
    {
        get => PlayerBase?.Name ?? string.Empty;
        set
        {
            if (PlayerBase == null)
            {
                PlayerBase = new PlayerBase();
            }
            PlayerBase.Name = value;
        }
    }
    public string Version { get; set; } = string.Empty; // "As de Japón", "Amigo del Balón", etc.
    public string CardImageUrl { get; set; } = string.Empty;
    
    // Información básica
    public int RarityId { get; set; } // UR, SSR, SR, R, N
    public Rarity Rarity { get; set; } = null!;

    public int ElementId { get; set; } // Afin. D (Agilidad, Fuerza, Destreza)
    public Element Element { get; set; } = null!;

    public int? TeamId { get; set; }
    public Team? Team { get; set; }

    /// <summary>País del jugador (desde PlayerBase; no se persiste en Player).</summary>
    [NotMapped]
    public Country? Country => PlayerBase?.Country;

    public int? SeriesId { get; set; }
    public Series? Series { get; set; }
    public List<string> Positions { get; set; } = new List<string>(); // DL, MCA, MCD, DF
    
    // Habilidades con balón
    public string GroundBallSkill { get; set; } = "Normal"; // Normal, Bueno, Muy Bueno
    public string HighBallSkill { get; set; } = "Normal"; // Normal, Bueno, Muy Bueno
    
    // Categoría especial (opcional)
    public string? Category { get; set; } // DreamFest, DreamCollection, SuperStar, null
    
    // Estadísticas
    public PlayerStats Stats { get; set; } = new PlayerStats();
    
    // Técnicas asociadas a esta versión del jugador (a través de PlayerVersionTechnique)
    // Ignorada en serialización para evitar referencias circulares (usamos la propiedad calculada Techniques)
    [JsonIgnore]
    public List<PlayerVersionTechnique> PlayerTechniques { get; set; } = new List<PlayerVersionTechnique>();
    
    // Propiedad calculada para compatibilidad con el frontend (no se mapea a la BD)
    [NotMapped]
    public List<Technique> Techniques
    {
        get
        {
            return PlayerTechniques
                .Select(pvt => new Technique
                {
                    Id = pvt.Technique.Id,
                    Name = pvt.Technique.Name,
                    TechTypeId = pvt.Technique.TechTypeId,
                    TechType = pvt.Technique.TechType,
                    PlayerBaseId = pvt.Technique.PlayerBaseId,
                    PlayerBase = pvt.Technique.PlayerBase,
                    Power = pvt.Technique.Power,
                    StaminaCost = pvt.Technique.StaminaCost,
                    Description = pvt.Technique.Description,
                    IsCombined = pvt.Technique.IsCombined,
                    IsMain = pvt.IsMain
                })
                .ToList();
        }
    }
    
    // Habilidades
    public TeamSkill? TeamSkill { get; set; }
    public Skill? PassiveSkill { get; set; }
    
    // Habilidades latentes asociadas a esta versión del jugador (a través de PlayerLatentSkill)
    [JsonIgnore]
    public List<PlayerLatentSkill> PlayerLatentSkills { get; set; } = new List<PlayerLatentSkill>();
    
    // Propiedad calculada para compatibilidad con el frontend (no se mapea a la BD)
    [NotMapped]
    public List<Skill> LatentSkills
    {
        get
        {
            return PlayerLatentSkills
                .Where(pls => pls.Skill != null) // Filtrar nulos por si acaso
                .Select(pls => pls.Skill!)
                .ToList();
        }
        set
        {
            // Setter para compatibilidad con deserialización JSON
            // No hace nada, pero permite que System.Text.Json pueda deserializar
        }
    }
}
