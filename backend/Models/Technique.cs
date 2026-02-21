using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Technique
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public int TechTypeId { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public TechType TechType { get; set; } = null!;

    // Exponer el nombre del tipo como string para el frontend
    [NotMapped]
    public string Type => TechType?.Name ?? string.Empty;

    // Relación con el jugador base (nombre sin versión)
    public int PlayerBaseId { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public PlayerBase PlayerBase { get; set; } = null!;

    public int Power { get; set; }
    public int StaminaCost { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsCombined { get; set; } = false; // True si es una técnica combinada

    /// <summary>Derivado del tipo de técnica (TechType). Para serialización y DTOs; cargar TechType con Include.</summary>
    [NotMapped]
    public bool AppliesLowBallBonus => TechType?.AppliesLowBallBonus ?? false;
    /// <summary>Derivado del tipo de técnica (TechType). Para serialización y DTOs; cargar TechType con Include.</summary>
    [NotMapped]
    public bool AppliesHighBallBonus => TechType?.AppliesHighBallBonus ?? false;

    // Nombre del jugador para el frontend (derivado de PlayerBase)
    [NotMapped]
    public string PlayerName => PlayerBase?.Name ?? string.Empty;
    
    // Propiedad calculada para compatibilidad con el frontend (no se mapea a la BD)
    // Se establece cuando se crea desde PlayerVersionTechnique
    [NotMapped]
    public bool IsMain { get; set; }
    
    // Navegación: técnicas asociadas a versiones de jugadores (ignorada en serialización para evitar referencias circulares)
    [System.Text.Json.Serialization.JsonIgnore]
    public List<PlayerVersionTechnique> PlayerVersions { get; set; } = new List<PlayerVersionTechnique>();
}
