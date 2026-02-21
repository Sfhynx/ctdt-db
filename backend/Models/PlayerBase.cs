using System.Text.Json.Serialization;

namespace backend.Models;

public class PlayerBase
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public int? CountryId { get; set; }
    public Country? Country { get; set; }

    [JsonIgnore]
    public List<Player> Players { get; set; } = new();
    [JsonIgnore]
    public List<Technique> Techniques { get; set; } = new();
}

