import dotenv from "dotenv";
dotenv.config({ path: new URL("../../../.env", import.meta.url) });
const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
};
export const env = {
  port: Number(process.env.PORT || 3000),
  origin: process.env.APP_ORIGIN || "http://localhost:5173",
  database: required("DATABASE_URL"),
  jwt: required("JWT_SECRET"),
  secure: process.env.COOKIE_SECURE === "true",
  keys: JSON.parse(required("ENCRYPTION_KEYS")),
  keyId: required("ACTIVE_KEY_ID"),
  rpc:
    process.env.SEPOLIA_RPC_URL ||
    process.env.RPC_URL ||
    "http://localhost:8545",
  chainId: Number(process.env.CHAIN_ID || 11155111),
  contract: process.env.CONTRACT_ADDRESS,
  ipfs: process.env.IPFS_API || "http://localhost:5001",
  redis: process.env.REDIS_URL || "redis://localhost:6379",
  ai: process.env.AI_URL || "http://localhost:8000",
  aiToken: required("AI_SERVICE_TOKEN"),
};
if (env.jwt.length < 32)
  throw new Error("JWT_SECRET must have at least 32 characters");
for (const key of Object.values(env.keys))
  if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error("Invalid encryption key");
if (!env.keys[env.keyId]) throw new Error("ACTIVE_KEY_ID missing in keyring");

if (![31337, 11155111].includes(env.chainId))
  throw new Error(
    "Supported CHAIN_ID: 11155111 (Sepolia) or 31337 (local tests)",
  );
if (
  env.chainId === 11155111 &&
  (!/^https:\/\//.test(env.rpc) ||
    !/^0x[0-9a-fA-F]{40}$/.test(env.contract || ""))
)
  throw new Error(
    "Sepolia requires HTTPS SEPOLIA_RPC_URL and CONTRACT_ADDRESS; see HUONG_DAN_SEPOLIA.md",
  );

if (env.chainId === 11155111 && process.env.DEPLOYER_PRIVATE_KEY)
  throw new Error(
    "Remove DEPLOYER_PRIVATE_KEY from application .env; use .env.sepolia-deploy only",
  );
