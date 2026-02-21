using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TeamSkills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Effect = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamSkills", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Players",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Version = table.Column<string>(type: "TEXT", nullable: false),
                    CardImageUrl = table.Column<string>(type: "TEXT", nullable: false),
                    Rarity = table.Column<string>(type: "TEXT", nullable: false),
                    Element = table.Column<string>(type: "TEXT", nullable: false),
                    Team = table.Column<string>(type: "TEXT", nullable: false),
                    Country = table.Column<string>(type: "TEXT", nullable: false),
                    Series = table.Column<string>(type: "TEXT", nullable: false),
                    Positions = table.Column<string>(type: "TEXT", nullable: false),
                    GroundBallSkill = table.Column<string>(type: "TEXT", nullable: false),
                    HighBallSkill = table.Column<string>(type: "TEXT", nullable: false),
                    Stats_Energy = table.Column<int>(type: "INTEGER", nullable: false),
                    Stats_Dribble = table.Column<int>(type: "INTEGER", nullable: true),
                    Stats_Shot = table.Column<int>(type: "INTEGER", nullable: true),
                    Stats_Pass = table.Column<int>(type: "INTEGER", nullable: true),
                    Stats_Tackle = table.Column<int>(type: "INTEGER", nullable: true),
                    Stats_Block = table.Column<int>(type: "INTEGER", nullable: true),
                    Stats_Intercept = table.Column<int>(type: "INTEGER", nullable: true),
                    Stats_Punch = table.Column<int>(type: "INTEGER", nullable: true),
                    Stats_CatchStat = table.Column<int>(type: "INTEGER", nullable: true),
                    Stats_Speed = table.Column<int>(type: "INTEGER", nullable: false),
                    Stats_Power = table.Column<int>(type: "INTEGER", nullable: false),
                    Stats_Technique = table.Column<int>(type: "INTEGER", nullable: false),
                    TeamSkillId = table.Column<int>(type: "INTEGER", nullable: true),
                    PassiveSkillId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Players", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Players_TeamSkills_TeamSkillId",
                        column: x => x.TeamSkillId,
                        principalTable: "TeamSkills",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Skills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Effect = table.Column<string>(type: "TEXT", nullable: false),
                    Level = table.Column<int>(type: "INTEGER", nullable: true),
                    Bonuses = table.Column<string>(type: "TEXT", nullable: true),
                    PlayerId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Skills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Skills_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Techniques",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Power = table.Column<int>(type: "INTEGER", nullable: false),
                    StaminaCost = table.Column<int>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    IsMain = table.Column<bool>(type: "INTEGER", nullable: false),
                    PlayerName = table.Column<string>(type: "TEXT", nullable: false),
                    PlayerId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Techniques", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Techniques_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Players_PassiveSkillId",
                table: "Players",
                column: "PassiveSkillId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_TeamSkillId",
                table: "Players",
                column: "TeamSkillId");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_PlayerId",
                table: "Skills",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_Techniques_PlayerId",
                table: "Techniques",
                column: "PlayerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Skills_PassiveSkillId",
                table: "Players",
                column: "PassiveSkillId",
                principalTable: "Skills",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Skills_PassiveSkillId",
                table: "Players");

            migrationBuilder.DropTable(
                name: "Techniques");

            migrationBuilder.DropTable(
                name: "Skills");

            migrationBuilder.DropTable(
                name: "Players");

            migrationBuilder.DropTable(
                name: "TeamSkills");
        }
    }
}
