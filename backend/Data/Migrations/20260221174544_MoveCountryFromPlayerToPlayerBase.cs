using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class MoveCountryFromPlayerToPlayerBase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Añadir CountryId a PlayerBases
            migrationBuilder.AddColumn<int>(
                name: "CountryId",
                table: "PlayerBases",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlayerBases_CountryId",
                table: "PlayerBases",
                column: "CountryId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlayerBases_Countries_CountryId",
                table: "PlayerBases",
                column: "CountryId",
                principalTable: "Countries",
                principalColumn: "Id");

            // 2) Copiar país desde Players al PlayerBase correspondiente
            migrationBuilder.Sql(@"
                UPDATE PlayerBases
                SET CountryId = (
                    SELECT CountryId FROM Players
                    WHERE Players.PlayerBaseId = PlayerBases.Id AND Players.CountryId IS NOT NULL
                    LIMIT 1
                )
                WHERE EXISTS (
                    SELECT 1 FROM Players
                    WHERE Players.PlayerBaseId = PlayerBases.Id AND Players.CountryId IS NOT NULL
                );
            ");

            // 3) Quitar CountryId de Players
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Countries_CountryId",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_CountryId",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "CountryId",
                table: "Players");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 1) Añadir CountryId de nuevo a Players
            migrationBuilder.AddColumn<int>(
                name: "CountryId",
                table: "Players",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Players_CountryId",
                table: "Players",
                column: "CountryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Countries_CountryId",
                table: "Players",
                column: "CountryId",
                principalTable: "Countries",
                principalColumn: "Id");

            // 2) Copiar país desde PlayerBases a cada Player
            migrationBuilder.Sql(@"
                UPDATE Players
                SET CountryId = (SELECT CountryId FROM PlayerBases WHERE PlayerBases.Id = Players.PlayerBaseId);
            ");

            // 3) Quitar CountryId de PlayerBases
            migrationBuilder.DropForeignKey(
                name: "FK_PlayerBases_Countries_CountryId",
                table: "PlayerBases");

            migrationBuilder.DropIndex(
                name: "IX_PlayerBases_CountryId",
                table: "PlayerBases");

            migrationBuilder.DropColumn(
                name: "CountryId",
                table: "PlayerBases");
        }
    }
}
