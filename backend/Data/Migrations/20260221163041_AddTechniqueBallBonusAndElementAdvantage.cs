using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTechniqueBallBonusAndElementAdvantage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AppliesHighBallBonus",
                table: "Techniques",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "AppliesLowBallBonus",
                table: "Techniques",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "AdvantageOverElementId",
                table: "Elements",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Elements_AdvantageOverElementId",
                table: "Elements",
                column: "AdvantageOverElementId");

            migrationBuilder.AddForeignKey(
                name: "FK_Elements_Elements_AdvantageOverElementId",
                table: "Elements",
                column: "AdvantageOverElementId",
                principalTable: "Elements",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Elements_Elements_AdvantageOverElementId",
                table: "Elements");

            migrationBuilder.DropIndex(
                name: "IX_Elements_AdvantageOverElementId",
                table: "Elements");

            migrationBuilder.DropColumn(
                name: "AppliesHighBallBonus",
                table: "Techniques");

            migrationBuilder.DropColumn(
                name: "AppliesLowBallBonus",
                table: "Techniques");

            migrationBuilder.DropColumn(
                name: "AdvantageOverElementId",
                table: "Elements");
        }
    }
}
