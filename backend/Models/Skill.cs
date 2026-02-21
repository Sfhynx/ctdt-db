using System.Text.Json.Serialization;

namespace backend.Models;

public class Skill
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Effect { get; set; }
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Level { get; set; } // Null for passive skills, value for latent skills
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<SkillBonus>? Bonuses { get; set; }
    
    // Navegación: habilidades latentes asociadas a versiones de jugadores (ignorada en serialización)
    [JsonIgnore]
    public List<PlayerLatentSkill> PlayerVersions { get; set; } = new List<PlayerLatentSkill>();
}

public class TeamSkill
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Effect { get; set; }
}

public class SkillBonus
{
    public required string Type { get; set; } // "stat", "all_stats", "stamina_cost", "tech_power_type", "tech_power_combined", "tech_power_specific", etc.
    public int Value { get; set; } // Percentage or flat value
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? StatName { get; set; } // "shot", "pass", etc. (only for Type = "stat")
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TechniqueType { get; set; } // "remate", "volea", etc. (only for Type = "tech_power_type")
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<int>? TechniqueIds { get; set; } // IDs de técnicas concretas (only for Type = "tech_power_specific")
}
