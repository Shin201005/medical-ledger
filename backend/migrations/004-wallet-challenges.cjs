const { DataTypes: D } = require("sequelize");
module.exports = {
  async up({ context: q }) {
    await q.createTable("wallet_challenges", {
      id: { type: D.UUID, primaryKey: true, allowNull: false },
      user_id: {
        type: D.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      session_id: { type: D.UUID, allowNull: false },
      wallet: { type: D.STRING, allowNull: false },
      message: { type: D.TEXT, allowNull: false },
      expires_at: { type: D.DATE, allowNull: false },
      used_at: D.DATE,
      created_at: { type: D.DATE, allowNull: false },
      updated_at: { type: D.DATE, allowNull: false },
    });
  },
  async down({ context: q }) {
    await q.dropTable("wallet_challenges");
  },
};
