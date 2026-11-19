const { DataTypes: D } = require("sequelize");
module.exports = {
  async up({ context: q }) {
    await q.createTable("product_package_images", {
      product_id: {
        type: D.UUID,
        primaryKey: true,
        allowNull: false,
        references: { model: "medical_products", key: "id" },
        onDelete: "CASCADE",
      },
      preview: { type: D.TEXT, allowNull: false },
      descriptor: { type: D.JSONB, allowNull: false },
      created_at: { type: D.DATE, allowNull: false },
      updated_at: { type: D.DATE, allowNull: false },
    });
  },
  async down() {
    throw new Error("Destructive rollback disabled; restore a tested backup.");
  },
};
