using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SkillsController : ControllerBase
{
    private readonly TsubasaDbContext _context;

    public SkillsController(TsubasaDbContext context)
    {
        _context = context;
    }

    // GET: api/skills
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Skill>>> GetSkills()
    {
        return await _context.Skills.ToListAsync();
    }

    // GET: api/skills/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Skill>> GetSkill(int id)
    {
        var skill = await _context.Skills.FindAsync(id);

        if (skill == null)
        {
            return NotFound();
        }

        return skill;
    }

    // POST: api/skills
    [HttpPost]
    public async Task<ActionResult<Skill>> CreateSkill(Skill skill)
    {
        _context.Skills.Add(skill);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSkill), new { id = skill.Id }, skill);
    }

    // PUT: api/skills/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSkill(int id, Skill skill)
    {
        if (id != skill.Id)
        {
            return BadRequest();
        }

        _context.Entry(skill).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!SkillExists(id))
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

    // DELETE: api/skills/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSkill(int id)
    {
        var skill = await _context.Skills.FindAsync(id);
        if (skill == null)
        {
            return NotFound();
        }

        // Check if skill is being used by any player (as passive or latent)
        var isUsedAsPassive = await _context.Players.AnyAsync(p => p.PassiveSkill != null && p.PassiveSkill.Id == id);
        var isUsedAsLatent = await _context.Players.AnyAsync(p => p.LatentSkills.Any(ls => ls.Id == id));

        if (isUsedAsPassive || isUsedAsLatent)
        {
            return BadRequest(new { message = "No se puede eliminar esta habilidad porque está asociada a uno o más jugadores." });
        }

        _context.Skills.Remove(skill);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/skills/team
    [HttpGet("team")]
    public async Task<ActionResult<IEnumerable<TeamSkill>>> GetTeamSkills()
    {
        return await _context.TeamSkills.ToListAsync();
    }

    // GET: api/skills/team/{id}
    [HttpGet("team/{id}")]
    public async Task<ActionResult<TeamSkill>> GetTeamSkill(int id)
    {
        var teamSkill = await _context.TeamSkills.FindAsync(id);

        if (teamSkill == null)
        {
            return NotFound();
        }

        return teamSkill;
    }

    // POST: api/skills/team
    [HttpPost("team")]
    public async Task<ActionResult<TeamSkill>> CreateTeamSkill(TeamSkill skill)
    {
        _context.TeamSkills.Add(skill);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTeamSkill), new { id = skill.Id }, skill);
    }

    // PUT: api/skills/team/{id}
    [HttpPut("team/{id}")]
    public async Task<IActionResult> UpdateTeamSkill(int id, TeamSkill skill)
    {
        if (id != skill.Id)
        {
            return BadRequest();
        }

        _context.Entry(skill).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!TeamSkillExists(id))
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

    // DELETE: api/skills/team/{id}
    [HttpDelete("team/{id}")]
    public async Task<IActionResult> DeleteTeamSkill(int id)
    {
        var teamSkill = await _context.TeamSkills.FindAsync(id);
        if (teamSkill == null)
        {
            return NotFound();
        }

        // Check if team skill is being used by any player
        var isUsed = await _context.Players.AnyAsync(p => p.TeamSkill != null && p.TeamSkill.Id == id);

        if (isUsed)
        {
            return BadRequest(new { message = "No se puede eliminar esta Team Skill porque está asociada a uno o más jugadores." });
        }

        _context.TeamSkills.Remove(teamSkill);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool SkillExists(int id)
    {
        return _context.Skills.Any(e => e.Id == id);
    }

    private bool TeamSkillExists(int id)
    {
        return _context.TeamSkills.Any(e => e.Id == id);
    }
}
