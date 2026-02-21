using System.Text.Json.Serialization;

namespace backend.Models;

public class PlayerLatentSkill
{
    public int Id { get; set; }
    public int PlayerId { get; set; } // ID de la versión específica del jugador
    public int SkillId { get; set; } // ID de la habilidad latente
    
    // Navegación
    [JsonIgnore]
    public Player Player { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
