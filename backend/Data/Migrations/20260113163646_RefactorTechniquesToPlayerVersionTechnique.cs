using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefactorTechniquesToPlayerVersionTechnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Create the new PlayerVersionTechniques table
            migrationBuilder.CreateTable(
                name: "PlayerVersionTechniques",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PlayerId = table.Column<int>(type: "INTEGER", nullable: false),
                    TechniqueId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsMain = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerVersionTechniques", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerVersionTechniques_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlayerVersionTechniques_Techniques_TechniqueId",
                        column: x => x.TechniqueId,
                        principalTable: "Techniques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Step 2: Migrate existing data
            // For each Technique with a PlayerId, create a PlayerVersionTechnique entry
            // Then consolidate duplicate techniques (same name and PlayerName)
            migrationBuilder.Sql(@"
                -- First, ensure PlayerName is set for all techniques that have a PlayerId
                -- Only update if we can find a matching Player
                UPDATE Techniques 
                SET PlayerName = (SELECT Name FROM Players WHERE Players.Id = Techniques.PlayerId)
                WHERE (PlayerName IS NULL OR PlayerName = '') 
                AND PlayerId IS NOT NULL
                AND EXISTS (SELECT 1 FROM Players WHERE Players.Id = Techniques.PlayerId);

                -- Delete techniques that don't have PlayerName (orphaned - no way to associate them)
                -- This must happen before we try to create PlayerVersionTechniques
                DELETE FROM Techniques
                WHERE (PlayerName IS NULL OR PlayerName = '') 
                AND (PlayerId IS NULL OR NOT EXISTS (SELECT 1 FROM Players WHERE Players.Id = Techniques.PlayerId));

                -- Create PlayerVersionTechnique entries for existing techniques (only those with valid PlayerId)
                INSERT INTO PlayerVersionTechniques (PlayerId, TechniqueId, IsMain)
                SELECT PlayerId, Id, IsMain
                FROM Techniques
                WHERE PlayerId IS NOT NULL 
                AND PlayerName IS NOT NULL 
                AND PlayerName != '';

                -- Consolidate duplicate techniques: keep one, update references, delete duplicates
                -- This is complex, so we'll do it in steps:
                -- 1. Find duplicates (same Name and PlayerName)
                -- 2. Keep the one with the lowest ID
                -- 3. Update PlayerVersionTechniques to point to the kept technique
                -- 4. Delete the duplicate techniques
                
                -- Update PlayerVersionTechniques to point to the first technique of each duplicate group
                UPDATE PlayerVersionTechniques
                SET TechniqueId = (
                    SELECT MIN(t2.Id)
                    FROM Techniques t2
                    WHERE t2.Name = (SELECT Name FROM Techniques WHERE Techniques.Id = PlayerVersionTechniques.TechniqueId)
                    AND t2.PlayerName = (SELECT PlayerName FROM Techniques WHERE Techniques.Id = PlayerVersionTechniques.TechniqueId)
                )
                WHERE EXISTS (
                    SELECT 1 FROM Techniques t
                    WHERE t.Id = PlayerVersionTechniques.TechniqueId
                    AND EXISTS (
                        SELECT 1 FROM Techniques t2
                        WHERE t2.Name = t.Name
                        AND t2.PlayerName = t.PlayerName
                        AND t2.Id < t.Id
                    )
                );

                -- Delete duplicate techniques (keep the one with the lowest ID)
                DELETE FROM Techniques
                WHERE Id NOT IN (
                    SELECT MIN(Id)
                    FROM Techniques
                    GROUP BY Name, PlayerName
                )
                AND EXISTS (
                    SELECT 1 FROM Techniques t2
                    WHERE t2.Name = Techniques.Name
                    AND t2.PlayerName = Techniques.PlayerName
                    AND t2.Id < Techniques.Id
                );
            ");

            // Step 3: Create indexes
            migrationBuilder.CreateIndex(
                name: "IX_PlayerVersionTechniques_PlayerId_TechniqueId",
                table: "PlayerVersionTechniques",
                columns: new[] { "PlayerId", "TechniqueId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlayerVersionTechniques_TechniqueId",
                table: "PlayerVersionTechniques",
                column: "TechniqueId");

            // Step 4: Remove old foreign key and columns
            migrationBuilder.DropForeignKey(
                name: "FK_Techniques_Players_PlayerId",
                table: "Techniques");

            migrationBuilder.DropIndex(
                name: "IX_Techniques_PlayerId",
                table: "Techniques");

            migrationBuilder.DropColumn(
                name: "IsMain",
                table: "Techniques");

            migrationBuilder.DropColumn(
                name: "PlayerId",
                table: "Techniques");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlayerVersionTechniques");

            migrationBuilder.AddColumn<bool>(
                name: "IsMain",
                table: "Techniques",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PlayerId",
                table: "Techniques",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Techniques_PlayerId",
                table: "Techniques",
                column: "PlayerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Techniques_Players_PlayerId",
                table: "Techniques",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id");
        }
    }
}
