namespace backend.Controllers;

public class PlayerWithTechniquesDto
{
    public string PlayerName { get; set; } = string.Empty;
    public string CardImageUrl { get; set; } = string.Empty;
    public int PlayerId { get; set; } // ID del jugador con estadísticas más altas
    public int TechniqueCount { get; set; }
    public List<TechniqueDto> Techniques { get; set; } = new List<TechniqueDto>();
}
