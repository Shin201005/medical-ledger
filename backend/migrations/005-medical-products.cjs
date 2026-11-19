const { DataTypes: D } = require("sequelize");
module.exports = {
  async up({ context: q }) {
    await q.createTable("medical_products", {
      id: { type: D.UUID, primaryKey: true, allowNull: false },
      organization_id: {
        type: D.UUID,
        allowNull: false,
        references: { model: "organizations", key: "id" },
        onDelete: "RESTRICT",
      },
      code: { type: D.STRING(64), allowNull: false },
      name: { type: D.STRING(200), allowNull: false },
      quantity: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
      unit: { type: D.STRING(40), allowNull: false },
      price: { type: D.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      description: { type: D.TEXT, allowNull: false, defaultValue: "" },
      created_at: { type: D.DATE, allowNull: false },
      updated_at: { type: D.DATE, allowNull: false },
      deleted_at: D.DATE,
    });
    await q.addIndex("medical_products", ["organization_id", "code"], {
      unique: true,
      name: "medical_products_org_code_unique",
    });
    await q.addIndex("medical_products", ["organization_id", "created_at"]);
    await q.sequelize.query(
      "ALTER TABLE medical_products ADD CONSTRAINT medical_products_nonnegative CHECK (quantity >= 0 AND price >= 0)",
    );
  },
  async down() {
    throw new Error("Destructive rollback disabled; restore a tested backup.");
  },
};
