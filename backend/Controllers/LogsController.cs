using Microsoft.AspNetCore.Mvc;
using Serilog;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private readonly ILogger<LogsController> _logger;

    public LogsController(ILogger<LogsController> logger)
    {
        _logger = logger;
    }

    [HttpPost("frontend")]
    public IActionResult LogFromFrontend([FromBody] FrontendLogEntry logEntry)
    {
        if (logEntry == null)
        {
            return BadRequest("Log entry is required");
        }

        var message = $"[FRONTEND] {logEntry.Message}";
        
        switch (logEntry.Level?.ToUpper())
        {
            case "DEBUG":
                _logger.LogDebug(message, logEntry.Data);
                break;
            case "INFO":
                _logger.LogInformation(message, logEntry.Data);
                break;
            case "WARN":
                _logger.LogWarning(message, logEntry.Data);
                break;
            case "ERROR":
                _logger.LogError(message, logEntry.Data);
                break;
            default:
                _logger.LogInformation(message, logEntry.Data);
                break;
        }

        return Ok();
    }
}

public class FrontendLogEntry
{
    public string? Level { get; set; }
    public string? Message { get; set; }
    public object? Data { get; set; }
}
