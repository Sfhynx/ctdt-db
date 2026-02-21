using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlayersController : ControllerBase
{
    private readonly TsubasaDbContext _context;
    private readonly ILogger<PlayersController> _logger;

    public PlayersController(TsubasaDbContext context, ILogger<PlayersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/players
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Player>>> GetPlayers()
    {
        return await _context.Players
            .Include(p => p.PlayerBase!)
                .ThenInclude(pb => pb.Country)
            .Include(p => p.Rarity)
            .Include(p => p.Element)
            .Include(p => p.TeamSkill)
            .Include(p => p.PassiveSkill)
            .Include(p => p.Team)
            .Include(p => p.Series)
            .Include(p => p.PlayerLatentSkills)
                .ThenInclude(pls => pls.Skill)
            .Include(p => p.PlayerTechniques)
                .ThenInclude(pvt => pvt.Technique)
                    .ThenInclude(t => t.TechType)
            .Include(p => p.PlayerTechniques)
                .ThenInclude(pvt => pvt.Technique)
                    .ThenInclude(t => t.PlayerBase)
            .ToListAsync();
    }

    // GET: api/players/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Player>> GetPlayer(int id)
    {
        var player = await _context.Players
            .Include(p => p.PlayerBase!)
                .ThenInclude(pb => pb.Country)
            .Include(p => p.Rarity)
            .Include(p => p.Element)
            .Include(p => p.Team)
            .Include(p => p.Series)
            .Include(p => p.TeamSkill)
            .Include(p => p.PassiveSkill)
            .Include(p => p.PlayerLatentSkills)
                .ThenInclude(pls => pls.Skill)
            .Include(p => p.PlayerTechniques)
                .ThenInclude(pvt => pvt.Technique)
                    .ThenInclude(t => t.TechType)
            .Include(p => p.PlayerTechniques)
                .ThenInclude(pvt => pvt.Technique)
                    .ThenInclude(t => t.PlayerBase)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (player == null)
        {
            return NotFound();
        }

        // Asegurar que las habilidades latentes se carguen correctamente
        // Forzar la evaluación de la propiedad calculada
        _ = player.LatentSkills;

        return player;
    }

    // POST: api/players
    [HttpPost]
    public async Task<ActionResult<Player>> CreatePlayer([FromBody] PlayerDto playerDto)
    {
        // Usar PlayerBaseId si viene; si no, resolver o crear por nombre
        PlayerBase playerBase;
        if (playerDto.PlayerBaseId.HasValue && playerDto.PlayerBaseId.Value > 0)
        {
            playerBase = await _context.PlayerBases.FindAsync(playerDto.PlayerBaseId.Value);
            if (playerBase == null)
                return BadRequest(new { message = "PlayerBaseId no válido." });
        }
        else
        {
            playerBase = await _context.PlayerBases.FirstOrDefaultAsync(pb => pb.Name == playerDto.Name);
            if (playerBase == null)
            {
                playerBase = new PlayerBase { Name = playerDto.Name };
                _context.PlayerBases.Add(playerBase);
                await _context.SaveChangesAsync();
            }
        }

        // Convert DTO to Player entity
        var player = new Player
        {
            PlayerBaseId = playerBase.Id,
            Version = playerDto.Version,
            CardImageUrl = playerDto.CardImageUrl,
            RarityId = playerDto.RarityId,
            ElementId = playerDto.ElementId,
            TeamId = playerDto.TeamId,
            SeriesId = playerDto.SeriesId,
            Positions = playerDto.Positions,
            GroundBallSkill = playerDto.GroundBallSkill,
            HighBallSkill = playerDto.HighBallSkill,
            Category = playerDto.Category,
            Stats = playerDto.Stats
        };

        // Handle skill relationships - attach existing skills instead of creating new ones
        if (playerDto.TeamSkill != null && playerDto.TeamSkill.Id > 0)
        {
            player.TeamSkill = await _context.TeamSkills.FindAsync(playerDto.TeamSkill.Id);
        }

        if (playerDto.PassiveSkill != null && playerDto.PassiveSkill.Id > 0)
        {
            player.PassiveSkill = await _context.Skills.FindAsync(playerDto.PassiveSkill.Id);
        }

        // Process latent skills after player is saved
        if (playerDto.LatentSkills != null && playerDto.LatentSkills.Count > 0)
        {
            await ProcessPlayerLatentSkills(player.Id, playerDto.LatentSkills);
        }

        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        // Process techniques after player is saved
        if (playerDto.Techniques != null && playerDto.Techniques.Count > 0)
        {
            await ProcessPlayerTechniques(player.Id, player.PlayerBaseId, playerDto.Techniques);
        }

        // Reload player with all relationships
        return await GetPlayer(player.Id);
    }

    // PUT: api/players/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlayer(int id, [FromBody] PlayerDto playerDto)
    {
        if (id != playerDto.Id)
        {
            return BadRequest();
        }

        var existingPlayer = await _context.Players
            .Include(p => p.PlayerBase)
            .Include(p => p.TeamSkill)
            .Include(p => p.PassiveSkill)
            .Include(p => p.PlayerLatentSkills)
                .ThenInclude(pls => pls.Skill)
            .Include(p => p.PlayerTechniques)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (existingPlayer == null)
        {
            return NotFound();
        }

        // Update basic properties: PlayerBase por id si viene; si no, por nombre
        if (playerDto.PlayerBaseId.HasValue && playerDto.PlayerBaseId.Value > 0)
        {
            var newBase = await _context.PlayerBases.FindAsync(playerDto.PlayerBaseId.Value);
            if (newBase != null)
                existingPlayer.PlayerBaseId = newBase.Id;
        }
        else if (!string.IsNullOrEmpty(playerDto.Name) && existingPlayer.PlayerBase.Name != playerDto.Name)
        {
            var byName = await _context.PlayerBases.FirstOrDefaultAsync(pb => pb.Name == playerDto.Name);
            if (byName != null)
                existingPlayer.PlayerBaseId = byName.Id;
            else
                existingPlayer.PlayerBase.Name = playerDto.Name;
        }
        existingPlayer.Version = playerDto.Version;
        existingPlayer.CardImageUrl = playerDto.CardImageUrl;
        existingPlayer.RarityId = playerDto.RarityId;
        existingPlayer.ElementId = playerDto.ElementId;
        existingPlayer.TeamId = playerDto.TeamId;
        existingPlayer.SeriesId = playerDto.SeriesId;
        existingPlayer.Positions = playerDto.Positions;
        existingPlayer.GroundBallSkill = playerDto.GroundBallSkill;
        existingPlayer.HighBallSkill = playerDto.HighBallSkill;
        existingPlayer.Category = playerDto.Category;
        existingPlayer.Stats = playerDto.Stats;

        // Handle skill relationships
        _logger.LogInformation("🔧 [BACKEND] UpdatePlayer - Handling PassiveSkill");
        _logger.LogInformation("🔧 [BACKEND] playerDto.PassiveSkill is null: {IsNull}", playerDto.PassiveSkill == null);
        _logger.LogInformation("🔧 [BACKEND] playerDto.PassiveSkill?.Id: {PassiveSkillId}", playerDto.PassiveSkill?.Id);
        _logger.LogInformation("🔧 [BACKEND] existingPlayer.PassiveSkill BEFORE update: {SkillId} - {SkillName}", existingPlayer.PassiveSkill?.Id, existingPlayer.PassiveSkill?.Name);
        
        if (playerDto.TeamSkill != null && playerDto.TeamSkill.Id > 0)
        {
            existingPlayer.TeamSkill = await _context.TeamSkills.FindAsync(playerDto.TeamSkill.Id);
        }
        else
        {
            existingPlayer.TeamSkill = null;
        }

        if (playerDto.PassiveSkill != null && playerDto.PassiveSkill.Id > 0)
        {
            existingPlayer.PassiveSkill = await _context.Skills.FindAsync(playerDto.PassiveSkill.Id);
            _logger.LogInformation("🔧 [BACKEND] PassiveSkill ASSIGNED: {SkillId} - {SkillName}", existingPlayer.PassiveSkill?.Id, existingPlayer.PassiveSkill?.Name);
        }
        else
        {
            existingPlayer.PassiveSkill = null;
            _logger.LogInformation("🔧 [BACKEND] PassiveSkill set to NULL");
        }
        
        _logger.LogInformation("🔧 [BACKEND] existingPlayer.PassiveSkill AFTER update: {SkillId} - {SkillName}", existingPlayer.PassiveSkill?.Id, existingPlayer.PassiveSkill?.Name);

        // Update latent skills - compare existing with new and only update what changed
        var existingLatentRelations = await _context.PlayerLatentSkills
            .Where(pls => pls.PlayerId == id)
            .ToListAsync();
        
        // Get the IDs of skills that should be associated
        var desiredSkillIds = playerDto.LatentSkills?.Select(s => s.Id).Where(id => id > 0).ToHashSet() ?? new HashSet<int>();
        
        // Get the IDs of currently associated skills
        var currentSkillIds = existingLatentRelations.Select(pls => pls.SkillId).ToHashSet();
        
        // Remove relationships that are no longer needed
        var toRemove = existingLatentRelations.Where(pls => !desiredSkillIds.Contains(pls.SkillId)).ToList();
        _context.PlayerLatentSkills.RemoveRange(toRemove);
        
        // Add new relationships that don't exist yet
        var toAdd = desiredSkillIds.Where(skillId => !currentSkillIds.Contains(skillId)).ToList();
        foreach (var skillId in toAdd)
        {
            var existingSkill = await _context.Skills.FindAsync(skillId);
            if (existingSkill != null)
            {
                var playerLatentSkill = new PlayerLatentSkill
                {
                    PlayerId = id,
                    SkillId = skillId
                };
                _context.PlayerLatentSkills.Add(playerLatentSkill);
            }
        }

        // Update techniques
        _logger.LogInformation("🔧 [BACKEND] UpdatePlayer - Handling Techniques");
        
        // Remove existing technique relationships
        var existingRelations = await _context.PlayerVersionTechniques
            .Where(pvt => pvt.PlayerId == id)
            .ToListAsync();
        _context.PlayerVersionTechniques.RemoveRange(existingRelations);
        
        // Process new techniques
        if (playerDto.Techniques != null && playerDto.Techniques.Count > 0)
        {
            await ProcessPlayerTechniques(id, existingPlayer.PlayerBaseId, playerDto.Techniques);
        }

        try
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("✅ [BACKEND] Changes saved successfully. PassiveSkill final state: {SkillId} - {SkillName}", existingPlayer.PassiveSkill?.Id, existingPlayer.PassiveSkill?.Name);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!PlayerExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    private async Task ProcessPlayerTechniques(int playerId, int playerBaseId, List<TechniqueDto> techniques)
    {
        foreach (var techniqueDto in techniques)
        {
            // Buscar o crear la técnica basada en el PlayerBase y el nombre de la técnica
            var technique = await _context.Techniques
                .FirstOrDefaultAsync(t => t.Name == techniqueDto.Name && t.PlayerBaseId == playerBaseId);

            if (technique == null)
            {
                // Crear nueva técnica
                technique = new Technique
                {
                    Name = techniqueDto.Name,
                    Power = techniqueDto.Power,
                    StaminaCost = techniqueDto.StaminaCost,
                    Description = techniqueDto.Description,
                    IsCombined = techniqueDto.IsCombined,
                    PlayerBaseId = playerBaseId
                };
                // Resolver TechType por nombre (crear si no existe)
                var techType = await _context.TechTypes.FirstOrDefaultAsync(tt => tt.Name == techniqueDto.Type);
                if (techType == null)
                {
                    techType = new TechType { Name = techniqueDto.Type };
                    _context.TechTypes.Add(techType);
                    await _context.SaveChangesAsync();
                }
                technique.TechTypeId = techType.Id;

                _context.Techniques.Add(technique);
                await _context.SaveChangesAsync(); // Save to get the ID
            }
            else
            {
                // Actualizar técnica existente si cambió algún atributo (excepto PlayerName)
                technique.Name = techniqueDto.Name;
                technique.Power = techniqueDto.Power;
                technique.StaminaCost = techniqueDto.StaminaCost;
                technique.Description = techniqueDto.Description;
                technique.IsCombined = techniqueDto.IsCombined;

                // Actualizar TechType si cambió el nombre
                var techType = await _context.TechTypes.FirstOrDefaultAsync(tt => tt.Name == techniqueDto.Type);
                if (techType == null)
                {
                    techType = new TechType { Name = techniqueDto.Type };
                    _context.TechTypes.Add(techType);
                    await _context.SaveChangesAsync();
                }
                technique.TechTypeId = techType.Id;
            }

            // Crear la relación PlayerVersionTechnique
            var playerVersionTechnique = new PlayerVersionTechnique
            {
                PlayerId = playerId,
                TechniqueId = technique.Id,
                IsMain = techniqueDto.IsMain
            };
            _context.PlayerVersionTechniques.Add(playerVersionTechnique);
        }

        await _context.SaveChangesAsync();
    }

    private async Task ProcessPlayerLatentSkills(int playerId, List<Skill> latentSkills)
    {
        foreach (var skill in latentSkills)
        {
            if (skill.Id > 0)
            {
                var existingSkill = await _context.Skills.FindAsync(skill.Id);
                if (existingSkill != null)
                {
                    // Check if relationship already exists
                    var existingRelation = await _context.PlayerLatentSkills
                        .FirstOrDefaultAsync(pls => pls.PlayerId == playerId && pls.SkillId == skill.Id);
                    
                    if (existingRelation == null)
                    {
                        // Create the relationship
                        var playerLatentSkill = new PlayerLatentSkill
                        {
                            PlayerId = playerId,
                            SkillId = skill.Id
                        };
                        _context.PlayerLatentSkills.Add(playerLatentSkill);
                    }
                }
            }
        }

        await _context.SaveChangesAsync();
    }

    // DELETE: api/players/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlayer(int id)
    {
        var player = await _context.Players.FindAsync(id);
        if (player == null)
        {
            return NotFound();
        }

        _context.Players.Remove(player);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/players/{id}/available-techniques
    [HttpGet("{id}/available-techniques")]
    public async Task<ActionResult<IEnumerable<Technique>>> GetAvailableTechniques(int id)
    {
        var player = await _context.Players.FindAsync(id);
        if (player == null)
        {
            return NotFound();
        }

        // Get all techniques for players with the same PlayerBase
        var availableTechniques = await _context.Techniques
            .Include(t => t.TechType)
            .Include(t => t.PlayerBase)
            .Where(t => t.PlayerBaseId == player.PlayerBaseId)
            .Distinct()
            .ToListAsync();

        return availableTechniques;
    }

    // GET: api/players/with-techniques
    [HttpGet("with-techniques")]
    public async Task<ActionResult<IEnumerable<PlayerWithTechniquesDto>>> GetPlayersWithTechniques()
    {
        // Obtener todos los PlayerBase que tienen técnicas
        var playerBaseIds = await _context.Techniques
            .Select(t => t.PlayerBaseId)
            .Distinct()
            .ToListAsync();

        var result = new List<PlayerWithTechniquesDto>();

        foreach (var playerBaseId in playerBaseIds)
        {
            var playerBase = await _context.PlayerBases.FindAsync(playerBaseId);
            if (playerBase == null) continue;
            var playerName = playerBase.Name;

            // Obtener todas las técnicas de este jugador base
            var techniques = await _context.Techniques
                .Include(t => t.TechType)
                .Include(t => t.PlayerBase)
                .Where(t => t.PlayerBaseId == playerBaseId)
                .ToListAsync();

            // Obtener todas las versiones de este jugador base y encontrar la que tiene las estadísticas más altas
            var playersWithSameName = await _context.Players
                .Where(p => p.PlayerBaseId == playerBaseId)
                .ToListAsync();

            // Encontrar el jugador con el total de estadísticas más alto
            var bestPlayer = playersWithSameName
                .OrderByDescending(p => p.Stats.Total)
                .FirstOrDefault();

            if (bestPlayer != null)
            {
                result.Add(new PlayerWithTechniquesDto
                {
                    PlayerName = playerName,
                    CardImageUrl = bestPlayer.CardImageUrl,
                    PlayerId = bestPlayer.Id,
                    TechniqueCount = techniques.Count,
                    Techniques = techniques.Select(t => new TechniqueDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        Type = t.Type,
                        Power = t.Power,
                        StaminaCost = t.StaminaCost,
                        Description = t.Description,
                        IsMain = false,
                        IsCombined = t.IsCombined,
                        PlayerName = t.PlayerName,
                        AppliesLowBallBonus = t.TechType?.AppliesLowBallBonus ?? false,
                        AppliesHighBallBonus = t.TechType?.AppliesHighBallBonus ?? false
                    }).ToList()
                });
            }
        }

        return result.OrderBy(p => p.PlayerName).ToList();
    }

    // GET: api/techniques/player/{playerName}
    [HttpGet("/api/techniques/player/{playerName}")]
    public async Task<ActionResult<IEnumerable<Technique>>> GetTechniquesByPlayerName(string playerName)
    {
        var playerBase = await _context.PlayerBases.FirstOrDefaultAsync(pb => pb.Name == playerName);
        if (playerBase == null)
        {
            return NotFound();
        }

        var techniques = await _context.Techniques
            .Include(t => t.TechType)
            .Include(t => t.PlayerBase)
            .Where(t => t.PlayerBaseId == playerBase.Id)
            .ToListAsync();

        return techniques;
    }

    // POST: api/techniques
    [HttpPost("/api/techniques")]
    public async Task<ActionResult<Technique>> CreateTechnique(TechniqueDto dto)
    {
        var techType = await _context.TechTypes.FirstOrDefaultAsync(tt => tt.Name == dto.Type);
        if (techType == null)
        {
            techType = new TechType { Name = dto.Type };
            _context.TechTypes.Add(techType);
            await _context.SaveChangesAsync();
        }

        var playerBase = await _context.PlayerBases.FirstOrDefaultAsync(pb => pb.Name == dto.PlayerName);
        if (playerBase == null)
        {
            playerBase = new PlayerBase { Name = dto.PlayerName };
            _context.PlayerBases.Add(playerBase);
            await _context.SaveChangesAsync();
        }

        var technique = new Technique
        {
            Name = dto.Name,
            TechTypeId = techType.Id,
            PlayerBaseId = playerBase.Id,
            Power = dto.Power,
            StaminaCost = dto.StaminaCost,
            Description = dto.Description,
            IsCombined = dto.IsCombined
        };
        _context.Techniques.Add(technique);
        await _context.SaveChangesAsync();

        var created = await _context.Techniques
            .Include(t => t.TechType)
            .Include(t => t.PlayerBase)
            .FirstAsync(t => t.Id == technique.Id);
        return CreatedAtAction(nameof(GetPlayer), new { id = created.Id }, created);
    }

    // PUT: api/techniques/{id}
    [HttpPut("/api/techniques/{id}")]
    public async Task<IActionResult> UpdateTechnique(int id, TechniqueDto dto)
    {
        if (id != dto.Id)
        {
            return BadRequest();
        }

        var existingTechnique = await _context.Techniques.FindAsync(id);
        if (existingTechnique == null)
        {
            return NotFound();
        }

        // Actualizar propiedades (el bono de balón lo define el tipo de técnica, no la técnica)
        existingTechnique.Name = dto.Name;
        existingTechnique.Power = dto.Power;
        existingTechnique.StaminaCost = dto.StaminaCost;
        existingTechnique.Description = dto.Description;
        existingTechnique.IsCombined = dto.IsCombined;

        // Resolver tipo por nombre (el frontend envía type como string)
        var techType = await _context.TechTypes.FirstOrDefaultAsync(tt => tt.Name == dto.Type);
        if (techType != null)
            existingTechnique.TechTypeId = techType.Id;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!TechniqueExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // DELETE: api/techniques/{id}
    [HttpDelete("/api/techniques/{id}")]
    public async Task<IActionResult> DeleteTechnique(int id)
    {
        var technique = await _context.Techniques.FindAsync(id);
        if (technique == null)
        {
            return NotFound();
        }

        // Verificar si la técnica está siendo usada por alguna versión de jugador
        var isUsed = await _context.PlayerVersionTechniques
            .AnyAsync(pvt => pvt.TechniqueId == id);

        if (isUsed)
        {
            return BadRequest(new { message = "No se puede eliminar esta técnica porque está asociada a una o más versiones de jugadores." });
        }

        _context.Techniques.Remove(technique);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool TechniqueExists(int id)
    {
        return _context.Techniques.Any(e => e.Id == id);
    }

    // POST: api/players/upload-image
    [HttpPost("upload-image")]
    public async Task<ActionResult<string>> UploadImage(IFormFile file, [FromQuery] string playerName, [FromQuery] string version)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No se proporcionó ningún archivo");
        }

        // Validar que sea una imagen
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return BadRequest("El archivo debe ser una imagen válida (jpg, jpeg, png, gif, webp)");
        }

        // Generar nombre único basado en nombre del jugador y versión
        var sanitizedName = SanitizeFileName(playerName);
        var sanitizedVersion = SanitizeFileName(version);
        var fileName = $"{sanitizedName}_{sanitizedVersion}{fileExtension}";
        
        // Asegurar que el directorio existe
        var imagesPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
        if (!Directory.Exists(imagesPath))
        {
            Directory.CreateDirectory(imagesPath);
        }

        var filePath = Path.Combine(imagesPath, fileName);

        // Si el archivo ya existe, eliminarlo primero
        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }

        // Guardar el archivo
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Retornar la ruta relativa que se guardará en cardImageUrl
        var imageUrl = $"/images/{fileName}";
        return Ok(new { imageUrl });
    }

    private string SanitizeFileName(string fileName)
    {
        // Remover caracteres especiales y espacios, reemplazarlos con guiones bajos
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries))
            .Replace(" ", "_")
            .Replace("-", "_");
        
        return sanitized;
    }

    private bool PlayerExists(int id)
    {
        return _context.Players.Any(e => e.Id == id);
    }
}
