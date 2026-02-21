using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefactorPlayerAndTechniqueRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM Techniques;");
            migrationBuilder.Sql("DELETE FROM Players;");

            migrationBuilder.DropColumn(
                name: "PlayerName",
                table: "Techniques");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Techniques");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "Element",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "Rarity",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "Series",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "Team",
                table: "Players");

            migrationBuilder.AddColumn<int>(
                name: "PlayerBaseId",
                table: "Techniques",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TechTypeId",
                table: "Techniques",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CountryId",
                table: "Players",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ElementId",
                table: "Players",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PlayerBaseId",
                table: "Players",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RarityId",
                table: "Players",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SeriesId",
                table: "Players",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TeamId",
                table: "Players",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Elements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Elements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlayerBases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerBases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Rarities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rarities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TechTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TechTypes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Techniques_PlayerBaseId",
                table: "Techniques",
                column: "PlayerBaseId");

            migrationBuilder.CreateIndex(
                name: "IX_Techniques_TechTypeId",
                table: "Techniques",
                column: "TechTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_CountryId",
                table: "Players",
                column: "CountryId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_ElementId",
                table: "Players",
                column: "ElementId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_PlayerBaseId",
                table: "Players",
                column: "PlayerBaseId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_RarityId",
                table: "Players",
                column: "RarityId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_SeriesId",
                table: "Players",
                column: "SeriesId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_TeamId",
                table: "Players",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerBases_Name",
                table: "PlayerBases",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Countries_CountryId",
                table: "Players",
                column: "CountryId",
                principalTable: "Countries",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Elements_ElementId",
                table: "Players",
                column: "ElementId",
                principalTable: "Elements",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Players_PlayerBases_PlayerBaseId",
                table: "Players",
                column: "PlayerBaseId",
                principalTable: "PlayerBases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Rarities_RarityId",
                table: "Players",
                column: "RarityId",
                principalTable: "Rarities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Series_SeriesId",
                table: "Players",
                column: "SeriesId",
                principalTable: "Series",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Teams_TeamId",
                table: "Players",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Techniques_PlayerBases_PlayerBaseId",
                table: "Techniques",
                column: "PlayerBaseId",
                principalTable: "PlayerBases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Techniques_TechTypes_TechTypeId",
                table: "Techniques",
                column: "TechTypeId",
                principalTable: "TechTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Countries_CountryId",
                table: "Players");

            migrationBuilder.DropForeignKey(
                name: "FK_Players_Elements_ElementId",
                table: "Players");

            migrationBuilder.DropForeignKey(
                name: "FK_Players_PlayerBases_PlayerBaseId",
                table: "Players");

            migrationBuilder.DropForeignKey(
                name: "FK_Players_Rarities_RarityId",
                table: "Players");

            migrationBuilder.DropForeignKey(
                name: "FK_Players_Series_SeriesId",
                table: "Players");

            migrationBuilder.DropForeignKey(
                name: "FK_Players_Teams_TeamId",
                table: "Players");

            migrationBuilder.DropForeignKey(
                name: "FK_Techniques_PlayerBases_PlayerBaseId",
                table: "Techniques");

            migrationBuilder.DropForeignKey(
                name: "FK_Techniques_TechTypes_TechTypeId",
                table: "Techniques");

            migrationBuilder.DropTable(
                name: "Elements");

            migrationBuilder.DropTable(
                name: "PlayerBases");

            migrationBuilder.DropTable(
                name: "Rarities");

            migrationBuilder.DropTable(
                name: "TechTypes");

            migrationBuilder.DropIndex(
                name: "IX_Techniques_PlayerBaseId",
                table: "Techniques");

            migrationBuilder.DropIndex(
                name: "IX_Techniques_TechTypeId",
                table: "Techniques");

            migrationBuilder.DropIndex(
                name: "IX_Players_CountryId",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_ElementId",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_PlayerBaseId",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_RarityId",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_SeriesId",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_TeamId",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "PlayerBaseId",
                table: "Techniques");

            migrationBuilder.DropColumn(
                name: "TechTypeId",
                table: "Techniques");

            migrationBuilder.DropColumn(
                name: "CountryId",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "ElementId",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "PlayerBaseId",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "RarityId",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "SeriesId",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "Players");

            migrationBuilder.AddColumn<string>(
                name: "PlayerName",
                table: "Techniques",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Techniques",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Players",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Element",
                table: "Players",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Players",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Rarity",
                table: "Players",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Series",
                table: "Players",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Team",
                table: "Players",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
