import bcrypt from "bcryptjs";
import { HDNodeWallet } from "ethers";
import { User, Organization, Profile, EkycJob, db } from "./db.js";
if (Number(process.env.CHAIN_ID || 31337) !== 31337) throw new Error("Local seed is disabled on Sepolia. Use bootstrap-admin then create real test wallets in the UI.");
if (process.env.DEMO_MODE !== "true")
  throw new Error("Seed only allowed with DEMO_MODE=true");
const password = process.env.DEMO_PASSWORD,
  mnemonic = process.env.DEMO_MNEMONIC;
if (!password || password.length < 12 || !mnemonic)
  throw new Error("Set DEMO_PASSWORD and DEMO_MNEMONIC");
try {
  const [org] = await Organization.findOrCreate({
    where: { code: "DEMO_CLINIC" },
    defaults: { name: "Bệnh viện Minh An (dữ liệu giả)" },
  });
  for (const [i, role, name, profile] of [
    [0, "ADMIN", "Quản trị demo", null],
    [1, "ISSUER", "Cơ sở y tế demo", "DOCTOR"],
    [2, "HOLDER", "Bệnh nhân demo", "PATIENT"],
    [3, "MANAGER", "Thanh tra demo", null],
    [4, "HOLDER", "Bác sĩ chuyển tuyến", "DOCTOR"],
  ]) {
    const wallet = HDNodeWallet.fromPhrase(
      mnemonic,
      undefined,
      `m/44'/60'/0'/0/${i}`,
    ).address.toLowerCase();
    const [u] = await User.findOrCreate({
      where: {
        email: role.toLowerCase() + (i === 4 ? "-doctor" : "") + "@demo.local",
      },
      defaults: {
        name,
        role,
        wallet,
        organizationId: ["ISSUER", "MANAGER"].includes(role) ? org.id : null,
        passwordHash: await bcrypt.hash(password, 12),
        ekycStatus: "UNVERIFIED",
      },
    });
    if (profile)
      await Profile.findOrCreate({
        where: { userId: u.id, kind: profile },
        defaults: {
          data:
            profile === "PATIENT"
              ? { insuranceId: "0000000001" }
              : { license: "DEMO-NOT-A-REAL-LICENSE" },
        },
      });
    if (u.role === "HOLDER" && profile && u.ekycStatus === "UNVERIFIED")
      await EkycJob.findOrCreate({
        where: { userId: u.id, status: "REVIEW_REQUIRED" },
        defaults: {
          result: {
            reason: "DEMO_SYNTHETIC_MANUAL_REVIEW_NO_AI_EXECUTED",
            identityMatch: false,
          },
        },
      });
    console.log(`${u.email} | ${wallet}`);
  }
} finally {
  await db.close();
}
