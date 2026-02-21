using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefactorLatentSkillsToManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Create the new PlayerLatentSkills table
            migrationBuilder.CreateTable(
                name: "PlayerLatentSkills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PlayerId = table.Column<int>(type: "INTEGER", nullable: false),
                    SkillId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerLatentSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerLatentSkills_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlayerLatentSkills_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Step 2: Migrate existing data
            // For each Skill with a PlayerId, create a PlayerLatentSkill entry
            migrationBuilder.Sql(@"
                INSERT INTO PlayerLatentSkills (PlayerId, SkillId)
                SELECT PlayerId, Id
                FROM Skills
                WHERE PlayerId IS NOT NULL;
            ");

            // Step 3: Create indexes
            migrationBuilder.CreateIndex(
                name: "IX_PlayerLatentSkills_PlayerId_SkillId",
                table: "PlayerLatentSkills",
                columns: new[] { "PlayerId", "SkillId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlayerLatentSkills_SkillId",
                table: "PlayerLatentSkills",
                column: "SkillId");

            // Step 4: Remove old foreign key, index, and column
            migrationBuilder.DropForeignKey(
                name: "FK_Skills_Players_PlayerId",
                table: "Skills");

            migrationBuilder.DropIndex(
                name: "IX_Skills_PlayerId",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "PlayerId",
                table: "Skills");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlayerLatentSkills");

            migrationBuilder.AddColumn<int>(
                name: "PlayerId",
                table: "Skills",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Skills_PlayerId",
                table: "Skills",
                column: "PlayerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Skills_Players_PlayerId",
                table: "Skills",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id");
        }
    }
}
