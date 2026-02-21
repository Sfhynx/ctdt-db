using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class MoveBallBonusFromTechniqueToTechType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppliesHighBallBonus",
                table: "Techniques");

            migrationBuilder.DropColumn(
                name: "AppliesLowBallBonus",
                table: "Techniques");

            migrationBuilder.AddColumn<bool>(
                name: "AppliesHighBallBonus",
                table: "TechTypes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AppliesLowBallBonus",
                table: "TechTypes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppliesHighBallBonus",
                table: "TechTypes");

            migrationBuilder.DropColumn(
                name: "AppliesLowBallBonus",
                table: "TechTypes");

            migrationBuilder.AddColumn<bool>(
                name: "AppliesHighBallBonus",
                table: "Techniques",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AppliesLowBallBonus",
                table: "Techniques",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }
    }
}
