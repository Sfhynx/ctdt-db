using System.Text.Json.Serialization;

namespace backend.Models;

public class PlayerVersionTechnique
{
    public int Id { get; set; }
    public int PlayerId { get; set; } // ID de la versión específica del jugador
    public int TechniqueId { get; set; } // ID de la técnica
    public bool IsMain { get; set; } // True si es técnica principal para esta versión
    
    // Navegación (ignorada en serialización para evitar referencias circulares)
    [JsonIgnore]
    public Player Player { get; set; } = null!;
    public Technique Technique { get; set; } = null!;
}
