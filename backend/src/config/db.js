import { Sequelize, DataTypes as D } from "sequelize";
import { env } from "./env.js";
export const db = new Sequelize(env.database, { logging: false });
const opts = { timestamps: true, underscored: true };
export const Organization = db.define(
  "Organization",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    name: { type: D.STRING, allowNull: false },
    code: { type: D.STRING, unique: true, allowNull: false },
  },
  { ...opts, tableName: "organizations" },
);
export const User = db.define(
  "User",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    email: { type: D.STRING, unique: true, allowNull: false },
    name: D.STRING,
    passwordHash: D.STRING,
    role: D.STRING,
    wallet: { type: D.STRING, unique: true },
    organizationId: D.UUID,
    active: { type: D.BOOLEAN, defaultValue: true },
    ekycStatus: { type: D.STRING, defaultValue: "UNVERIFIED" },
    ekycFailures: { type: D.INTEGER, defaultValue: 0 },
  },
  { ...opts, tableName: "users" },
);
export const Profile = db.define(
  "Profile",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    userId: D.UUID,
    kind: D.STRING,
    data: { type: D.JSONB, defaultValue: {} },
  },
  { ...opts, tableName: "profiles" },
);
export const Session = db.define(
  "Session",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    userId: D.UUID,
    refreshHash: D.STRING,
    csrf: D.STRING,
    expiresAt: D.DATE,
  },
  { ...opts, tableName: "sessions" },
);
export const Record = db.define(
  "Record",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    ownerId: D.UUID,
    issuerId: D.UUID,
    organizationId: D.UUID,
    title: D.STRING,
    icd10: D.STRING,
    cid: D.STRING,
    recordHash: D.STRING,
    keyId: D.STRING,
    mime: D.STRING,
    status: { type: D.STRING, defaultValue: "DRAFT" },
    idempotencyKey: D.STRING,
    requestHash: D.STRING,
    txHash: D.STRING,
    metadata: { type: D.JSONB, defaultValue: {} },
  },
  { ...opts, tableName: "records" },
);
export const Entry = db.define(
  "Entry",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    recordId: D.UUID,
    kind: D.STRING,
    data: D.JSONB,
  },
  { ...opts, tableName: "clinical_entries" },
);
export const Consent = db.define(
  "Consent",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    recordId: D.UUID,
    granteeId: D.UUID,
    expiresAt: D.DATE,
    txHash: D.STRING,
  },
  { ...opts, tableName: "consents" },
);
export const EkycJob = db.define(
  "EkycJob",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    userId: D.UUID,
    status: D.STRING,
    result: D.JSONB,
  },
  { ...opts, tableName: "ekyc_jobs" },
);
export const Audit = db.define(
  "Audit",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    actorId: D.UUID,
    recordId: D.UUID,
    action: D.STRING,
    outcome: D.STRING,
    deliveredAt: D.DATE,
    context: { type: D.JSONB, allowNull: false, defaultValue: {} },
  },
  { ...opts, tableName: "audit_outbox" },
);
export const Operation = db.define(
  "Operation",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    actorId: D.UUID,
    recordId: D.UUID,
    kind: D.STRING,
    to: D.STRING,
    data: D.TEXT,
    chainId: D.INTEGER,
    status: D.STRING,
    txHash: { type: D.STRING, unique: true },
    payload: D.JSONB,
  },
  { ...opts, tableName: "chain_operations" },
);

export const WalletChallenge = db.define(
  "WalletChallenge",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    userId: D.UUID,
    sessionId: D.UUID,
    wallet: D.STRING,
    message: D.TEXT,
    expiresAt: D.DATE,
    usedAt: D.DATE,
  },
  { ...opts, tableName: "wallet_challenges" },
);

export const MedicalProduct = db.define(
  "MedicalProduct",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    organizationId: { type: D.UUID, allowNull: false },
    code: { type: D.STRING(64), allowNull: false },
    name: { type: D.STRING(200), allowNull: false },
    quantity: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
    unit: { type: D.STRING(40), allowNull: false },
    price: { type: D.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    description: { type: D.TEXT, allowNull: false, defaultValue: "" },
  },
  { ...opts, paranoid: true, tableName: "medical_products" },
);

export const ProductPackageImage = db.define(
  "ProductPackageImage",
  {
    productId: { type: D.UUID, primaryKey: true, allowNull: false },
    preview: { type: D.TEXT, allowNull: false },
    descriptor: { type: D.JSONB, allowNull: false },
  },
  { ...opts, tableName: "product_package_images" },
);
ProductPackageImage.belongsTo(MedicalProduct, {
  foreignKey: "productId",
  as: "product",
});
