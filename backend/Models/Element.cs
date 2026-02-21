namespace backend.Models;

public class Element
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Id del elemento sobre el que este tiene ventaja (p. ej. Fuerza vence a Destreza). Null si no tiene ventaja definida.</summary>
    public int? AdvantageOverElementId { get; set; }
    public Element? AdvantageOver { get; set; }
}

