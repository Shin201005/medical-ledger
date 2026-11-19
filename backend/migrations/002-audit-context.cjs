const { DataTypes: D } = require("sequelize");
module.exports = {
  async up({ context: query }) {
    await query.addColumn("audit_outbox", "context", {
      type: D.JSONB,
      allowNull: false,
      defaultValue: {},
    });
  },
  async down({ context: query }) {
    await query.removeColumn("audit_outbox", "context");
  },
};
