const { DataTypes: D } = require("sequelize");
module.exports = {
  async up({ context: q }) {
    const uuid = { type: D.UUID, primaryKey: true, allowNull: false };
    const ref = (table) => ({
      type: D.UUID,
      references: { model: table, key: "id" },
      onDelete: "RESTRICT",
    });
    const times = {
      created_at: { type: D.DATE, allowNull: false },
      updated_at: { type: D.DATE, allowNull: false },
    };
    await q.createTable("organizations", {
      id: uuid,
      name: { type: D.STRING, allowNull: false },
      code: { type: D.STRING, unique: true, allowNull: false },
      ...times,
    });
    await q.createTable("users", {
      id: uuid,
      email: { type: D.STRING, unique: true, allowNull: false },
      name: D.STRING,
      password_hash: { type: D.STRING, allowNull: false },
      role: { type: D.STRING, allowNull: false },
      wallet: { type: D.STRING, unique: true },
      organization_id: ref("organizations"),
      active: { type: D.BOOLEAN, defaultValue: true },
      ekyc_status: { type: D.STRING, defaultValue: "UNVERIFIED" },
      ekyc_failures: { type: D.INTEGER, defaultValue: 0 },
      ...times,
    });
    await q.createTable("profiles", {
      id: uuid,
      user_id: ref("users"),
      kind: D.STRING,
      data: D.JSONB,
      ...times,
    });
    await q.addIndex("profiles", ["user_id", "kind"], { unique: true });
    await q.createTable("sessions", {
      id: uuid,
      user_id: ref("users"),
      refresh_hash: D.STRING,
      csrf: D.STRING,
      expires_at: D.DATE,
      ...times,
    });
    await q.createTable("records", {
      id: uuid,
      owner_id: ref("users"),
      issuer_id: ref("users"),
      organization_id: ref("organizations"),
      title: D.STRING,
      icd10: D.STRING,
      cid: D.STRING,
      record_hash: D.STRING,
      key_id: D.STRING,
      mime: D.STRING,
      status: D.STRING,
      idempotency_key: D.STRING,
      request_hash: D.STRING,
      tx_hash: D.STRING,
      metadata: D.JSONB,
      ...times,
    });
    await q.addIndex("records", ["issuer_id", "idempotency_key"], {
      unique: true,
    });
    await q.addIndex("records", ["owner_id"]);
    await q.createTable("clinical_entries", {
      id: uuid,
      record_id: ref("records"),
      kind: D.STRING,
      data: D.JSONB,
      ...times,
    });
    await q.createTable("consents", {
      id: uuid,
      record_id: ref("records"),
      grantee_id: ref("users"),
      expires_at: D.DATE,
      tx_hash: D.STRING,
      ...times,
    });
    await q.addIndex("consents", ["record_id", "grantee_id"], { unique: true });
    await q.createTable("ekyc_jobs", {
      id: uuid,
      user_id: ref("users"),
      status: D.STRING,
      result: D.JSONB,
      ...times,
    });
    await q.createTable("audit_outbox", {
      id: uuid,
      actor_id: ref("users"),
      record_id: ref("records"),
      action: D.STRING,
      outcome: D.STRING,
      delivered_at: D.DATE,
      ...times,
    });
    await q.createTable("chain_operations", {
      id: uuid,
      actor_id: ref("users"),
      record_id: ref("records"),
      kind: D.STRING,
      to: D.STRING,
      data: D.TEXT,
      chain_id: D.INTEGER,
      status: D.STRING,
      tx_hash: { type: D.STRING, unique: true },
      payload: D.JSONB,
      ...times,
    });
  },
  async down() {
    throw new Error(
      "Destructive rollback disabled. Restore a tested backup explicitly.",
    );
  },
};
