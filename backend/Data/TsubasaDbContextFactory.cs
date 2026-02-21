using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace backend.Data;

public class TsubasaDbContextFactory : IDesignTimeDbContextFactory<TsubasaDbContext>
{
    public TsubasaDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<TsubasaDbContext>()
            .UseSqlite("Data Source=tsubasa.db")
            .Options;

        return new TsubasaDbContext(options);
    }
}