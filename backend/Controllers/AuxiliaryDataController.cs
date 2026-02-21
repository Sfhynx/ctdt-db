using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuxiliaryDataController : ControllerBase
{
    private readonly TsubasaDbContext _context;

    public AuxiliaryDataController(TsubasaDbContext context)
    {
        _context = context;
    }

    // Rarities
    [HttpGet("rarities")]
    public async Task<ActionResult<IEnumerable<Rarity>>> GetRarities()
    {
        return await _context.Rarities.OrderBy(r => r.Name).ToListAsync();
    }

    [HttpPost("rarities")]
    public async Task<ActionResult<Rarity>> CreateRarity(Rarity rarity)
    {
        _context.Rarities.Add(rarity);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetRarities), new { id = rarity.Id }, rarity);
    }

    [HttpPut("rarities/{id}")]
    public async Task<IActionResult> UpdateRarity(int id, Rarity rarity)
    {
        if (id != rarity.Id)
            return BadRequest();

        _context.Entry(rarity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("rarities/{id}")]
    public async Task<IActionResult> DeleteRarity(int id)
    {
        var rarity = await _context.Rarities.FindAsync(id);
        if (rarity == null)
            return NotFound();

        var inUse = await _context.Players.AnyAsync(p => p.RarityId == id);
        if (inUse)
            return BadRequest(new { message = "No se puede eliminar esta rareza porque hay jugadores que la usan." });

        _context.Rarities.Remove(rarity);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Elements
    [HttpGet("elements")]
    public async Task<ActionResult<IEnumerable<Element>>> GetElements()
    {
        return await _context.Elements
            .Include(e => e.AdvantageOver)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }

    [HttpPost("elements")]
    public async Task<ActionResult<Element>> CreateElement(Element element)
    {
        _context.Elements.Add(element);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetElements), new { id = element.Id }, element);
    }

    [HttpPut("elements/{id}")]
    public async Task<IActionResult> UpdateElement(int id, Element element)
    {
        if (id != element.Id)
            return BadRequest();

        _context.Entry(element).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("elements/{id}")]
    public async Task<IActionResult> DeleteElement(int id)
    {
        var element = await _context.Elements.FindAsync(id);
        if (element == null)
            return NotFound();

        var inUse = await _context.Players.AnyAsync(p => p.ElementId == id);
        if (inUse)
            return BadRequest(new { message = "No se puede eliminar este elemento porque hay jugadores que lo usan." });

        _context.Elements.Remove(element);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Countries
    [HttpGet("countries")]
    public async Task<ActionResult<IEnumerable<Country>>> GetCountries()
    {
        return await _context.Countries.OrderBy(c => c.Name).ToListAsync();
    }

    [HttpPost("countries")]
    public async Task<ActionResult<Country>> CreateCountry(Country country)
    {
        _context.Countries.Add(country);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCountries), new { id = country.Id }, country);
    }

    [HttpPut("countries/{id}")]
    public async Task<IActionResult> UpdateCountry(int id, Country country)
    {
        if (id != country.Id)
            return BadRequest();

        _context.Entry(country).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("countries/{id}")]
    public async Task<IActionResult> DeleteCountry(int id)
    {
        var country = await _context.Countries.FindAsync(id);
        if (country == null)
            return NotFound();

        _context.Countries.Remove(country);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Series
    [HttpGet("series")]
    public async Task<ActionResult<IEnumerable<Series>>> GetSeries()
    {
        return await _context.Series.OrderBy(s => s.Name).ToListAsync();
    }

    [HttpPost("series")]
    public async Task<ActionResult<Series>> CreateSeries(Series series)
    {
        _context.Series.Add(series);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSeries), new { id = series.Id }, series);
    }

    [HttpPut("series/{id}")]
    public async Task<IActionResult> UpdateSeries(int id, Series series)
    {
        if (id != series.Id)
            return BadRequest();

        _context.Entry(series).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("series/{id}")]
    public async Task<IActionResult> DeleteSeries(int id)
    {
        var series = await _context.Series.FindAsync(id);
        if (series == null)
            return NotFound();

        _context.Series.Remove(series);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Teams
    [HttpGet("teams")]
    public async Task<ActionResult<IEnumerable<Team>>> GetTeams()
    {
        return await _context.Teams.OrderBy(t => t.Name).ToListAsync();
    }

    [HttpPost("teams")]
    public async Task<ActionResult<Team>> CreateTeam(Team team)
    {
        _context.Teams.Add(team);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTeams), new { id = team.Id }, team);
    }

    [HttpPut("teams/{id}")]
    public async Task<IActionResult> UpdateTeam(int id, Team team)
    {
        if (id != team.Id)
            return BadRequest();

        _context.Entry(team).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("teams/{id}")]
    public async Task<IActionResult> DeleteTeam(int id)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team == null)
            return NotFound();

        _context.Teams.Remove(team);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // TechTypes (tipos de técnica: Remate, Volea, Regate, etc.)
    [HttpGet("techtypes")]
    public async Task<ActionResult<IEnumerable<TechType>>> GetTechTypes()
    {
        return await _context.TechTypes.OrderBy(t => t.Name).ToListAsync();
    }

    [HttpPost("techtypes")]
    public async Task<ActionResult<TechType>> CreateTechType(TechType techType)
    {
        _context.TechTypes.Add(techType);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTechTypes), new { id = techType.Id }, techType);
    }

    [HttpPut("techtypes/{id}")]
    public async Task<IActionResult> UpdateTechType(int id, TechType techType)
    {
        if (id != techType.Id)
            return BadRequest();

        _context.Entry(techType).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("techtypes/{id}")]
    public async Task<IActionResult> DeleteTechType(int id)
    {
        var techType = await _context.TechTypes.FindAsync(id);
        if (techType == null)
            return NotFound();

        var inUse = await _context.Techniques.AnyAsync(t => t.TechTypeId == id);
        if (inUse)
            return BadRequest(new { message = "No se puede eliminar este tipo de técnica porque hay técnicas que lo usan." });

        _context.TechTypes.Remove(techType);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PlayerBases (nombres de jugador: Tsubasa, Hyuga, etc.; las versiones referencian a uno)
    [HttpGet("playerbases")]
    public async Task<ActionResult<IEnumerable<PlayerBase>>> GetPlayerBases([FromQuery] string? search = null)
    {
        var query = _context.PlayerBases.Include(pb => pb.Country).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(pb => pb.Name.ToLower().Contains(term));
        }
        return await query.OrderBy(pb => pb.Name).ToListAsync();
    }

    [HttpPost("playerbases")]
    public async Task<ActionResult<PlayerBase>> CreatePlayerBase(PlayerBase playerBase)
    {
        var exists = await _context.PlayerBases.AnyAsync(pb => pb.Name == playerBase.Name);
        if (exists)
            return BadRequest(new { message = "Ya existe un nombre de jugador con ese nombre." });
        if (!playerBase.CountryId.HasValue || playerBase.CountryId.Value <= 0)
            return BadRequest(new { message = "El país es obligatorio." });
        if (await _context.Countries.FindAsync(playerBase.CountryId.Value) == null)
            return BadRequest(new { message = "País no válido." });
        _context.PlayerBases.Add(playerBase);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPlayerBases), new { id = playerBase.Id }, playerBase);
    }

    [HttpPut("playerbases/{id}")]
    public async Task<IActionResult> UpdatePlayerBase(int id, PlayerBase playerBase)
    {
        if (id != playerBase.Id)
            return BadRequest();
        var existing = await _context.PlayerBases.FindAsync(id);
        if (existing == null)
            return NotFound();
        var duplicate = await _context.PlayerBases.AnyAsync(pb => pb.Id != id && pb.Name == playerBase.Name);
        if (duplicate)
            return BadRequest(new { message = "Ya existe otro nombre de jugador con ese nombre." });
        if (!playerBase.CountryId.HasValue || playerBase.CountryId.Value <= 0)
            return BadRequest(new { message = "El país es obligatorio." });
        if (await _context.Countries.FindAsync(playerBase.CountryId.Value) == null)
            return BadRequest(new { message = "País no válido." });
        existing.Name = playerBase.Name;
        existing.CountryId = playerBase.CountryId;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("playerbases/{id}")]
    public async Task<IActionResult> DeletePlayerBase(int id)
    {
        var playerBase = await _context.PlayerBases.FindAsync(id);
        if (playerBase == null)
            return NotFound();
        var playersUsing = await _context.Players.AnyAsync(p => p.PlayerBaseId == id);
        if (playersUsing)
            return BadRequest(new { message = "No se puede eliminar: hay jugadores que usan este nombre." });
        var techniquesUsing = await _context.Techniques.AnyAsync(t => t.PlayerBaseId == id);
        if (techniquesUsing)
            return BadRequest(new { message = "No se puede eliminar: hay técnicas asociadas a este nombre." });
        _context.PlayerBases.Remove(playerBase);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}