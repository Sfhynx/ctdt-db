namespace backend.Models;

public class PlayerStats
{
    public int Energy { get; set; }
    
    // Total (calculado) - Para porteros solo incluye Physical
    public int Total => (Dribble ?? 0) + (Shot ?? 0) + (Pass ?? 0) + 
                        (Tackle ?? 0) + (Block ?? 0) + (Intercept ?? 0) + 
                        (Punch ?? 0) + (CatchStat ?? 0) +
                        Speed + Power + Technique;
    
    // Ataque (calculado) - Solo para jugadores de campo
    public int Attack => (Dribble ?? 0) + (Shot ?? 0) + (Pass ?? 0);
    public int? Dribble { get; set; }
    public int? Shot { get; set; }
    public int? Pass { get; set; }
    
    // Defensa (calculado) - Solo para jugadores de campo
    public int Defense => (Tackle ?? 0) + (Block ?? 0) + (Intercept ?? 0);
    public int? Tackle { get; set; }
    public int? Block { get; set; }
    public int? Intercept { get; set; }
    
    // Parada (calculado) - Solo para porteros
    public int CatchTotal => (Punch ?? 0) + (CatchStat ?? 0);
    public int? Punch { get; set; }
    public int? CatchStat { get; set; } // Blocaje
    
    // Físico (calculado) - Para todos los jugadores
    public int Physical => Speed + Power + Technique;
    public int Speed { get; set; }
    public int Power { get; set; }
    public int Technique { get; set; }
}
