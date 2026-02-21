using backend.Models;

namespace backend.Controllers;

// DTO para recibir datos del frontend
public class PlayerDto
{
    public int Id { get; set; }
    /// <summary>Id del PlayerBase (nombre del jugador). Si se envía, se usa este; si no, se resuelve por Name.</summary>
    public int? PlayerBaseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string CardImageUrl { get; set; } = string.Empty;
    
    // Claves foráneas a datos auxiliares (el frontend envía estos IDs)
    public int RarityId { get; set; }
    public int ElementId { get; set; }
    public int? TeamId { get; set; }
    public int? SeriesId { get; set; }
    public List<string> Positions { get; set; } = new List<string>();
    public string GroundBallSkill { get; set; } = "Normal";
    public string HighBallSkill { get; set; } = "Normal";
    public string? Category { get; set; } // DreamFest, DreamCollection, SuperStar, null
    public PlayerStats Stats { get; set; } = new PlayerStats();
    
    // Técnicas en el formato antiguo (para compatibilidad con el frontend)
    public List<TechniqueDto> Techniques { get; set; } = new List<TechniqueDto>();
    
    // Habilidades
    public TeamSkill? TeamSkill { get; set; }
    public Skill? PassiveSkill { get; set; }
    public List<Skill> LatentSkills { get; set; } = new List<Skill>();
}

public class TechniqueDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Power { get; set; }
    public int StaminaCost { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsMain { get; set; }
    public bool IsCombined { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public bool AppliesLowBallBonus { get; set; } = true;
    public bool AppliesHighBallBonus { get; set; } = true;
}
