namespace backend.Models;

public class TechType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Si true, las técnicas de este tipo aplican el bono de balón bajo (p. ej. volea).</summary>
    public bool AppliesLowBallBonus { get; set; } = false;
    /// <summary>Si true, las técnicas de este tipo aplican el bono de balón alto (p. ej. cabezazo).</summary>
    public bool AppliesHighBallBonus { get; set; } = false;

    /// <summary>Posiciones que pueden tener técnicas de este tipo (ej. DL, MCA, MCD, DF, PO). Vacío = todas.</summary>
    public List<string> AllowedPositionCodes { get; set; } = new List<string>();
}