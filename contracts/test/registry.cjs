const { expect } = require("chai");
const { ethers, network } = require("hardhat");
async function rejects(p, message) {
  try {
    await p;
    throw new Error("EXPECTED_REVERT");
  } catch (e) {
    expect(e.message).to.include(message);
  }
}
describe("MedicalRecordRegistry V4", function () {
  let c, admin, issuer, holder, manager, doctor, other;
  const code = ethers.id("random-id"),
    hash = ethers.sha256(ethers.toUtf8Bytes("encrypted-file"));
  beforeEach(async () => {
    [admin, issuer, holder, manager, doctor, other] = await ethers.getSigners();
    c = await (
      await ethers.getContractFactory("MedicalRecordRegistry")
    ).deploy();
    await c.waitForDeployment();
    await c.setWalletScope(issuer.address, ethers.id("org"));
  });
  it("admin whitelist and independent roles", async () => {
    await rejects(
      c.connect(issuer).setHospitalRole(issuer.address, true),
      "ADMIN_ONLY",
    );
    expect(await c.isHospitalIssuer(admin.address)).eq(false);
    await c.setHospitalRole(issuer.address, true);
    expect(await c.isHospitalIssuer(issuer.address)).eq(true);
    expect(await c.isHealthInspector(issuer.address)).eq(false);
    await c.setInspectorRole(manager.address, true);
    expect(await c.isHealthInspector(manager.address)).eq(true);
  });
  it("issuance, public verification, duplicate prevention", async () => {
    await rejects(
      c
        .connect(issuer)
        .issueMedicalRecord(code, hash, holder.address, "QmEncryptedDemoCid"),
      "ISSUER_ONLY",
    );
    await c.setHospitalRole(issuer.address, true);
    await c
      .connect(issuer)
      .issueMedicalRecord(code, hash, holder.address, "QmEncryptedDemoCid");
    await rejects(
      c
        .connect(issuer)
        .issueMedicalRecord(code, hash, holder.address, "QmEncryptedDemoCid"),
      "DUPLICATE_RECORD",
    );
    const result = await c.verifyMedicalRecord(code);
    expect(result.exists).eq(true);
    expect(result.recordHash).eq(hash);
    expect(result.length).eq(4);
    expect(await c.recordCid(code)).eq("QmEncryptedDemoCid");
    expect(await c.hasAccess(code, other.address)).eq(false);
  });
  it("encrypted CID is immutable and bounded", async () => {
    await c.setHospitalRole(issuer.address, true);
    await rejects(
      c.connect(issuer).issueMedicalRecord(code, hash, holder.address, ""),
      "INVALID_CID",
    );
    await rejects(
      c
        .connect(issuer)
        .issueMedicalRecord(code, hash, holder.address, "x".repeat(129)),
      "INVALID_CID",
    );
    await c
      .connect(issuer)
      .issueMedicalRecord(code, hash, holder.address, "bafy-encrypted");
    expect(await c.recordCid(code)).eq("bafy-encrypted");
    expect(await c.VERSION()).eq(4n);
  });
  it("holder consent enforces IDOR, bounds, revocation and expiry", async () => {
    await c.setHospitalRole(issuer.address, true);
    await c
      .connect(issuer)
      .issueMedicalRecord(code, hash, holder.address, "QmEncryptedDemoCid");
    await rejects(
      c.connect(other).grantDoctorAccess(code, doctor.address, 60),
      "HOLDER_ONLY",
    );
    await rejects(
      c.connect(holder).grantDoctorAccess(code, doctor.address, 0),
      "INVALID_CONSENT",
    );
    await rejects(
      c.connect(holder).grantDoctorAccess(code, doctor.address, 2592001),
      "INVALID_CONSENT",
    );
    await c.connect(holder).grantDoctorAccess(code, doctor.address, 60);
    expect(await c.hasAccess(code, doctor.address)).eq(true);
    await c.connect(holder).revokeDoctorAccess(code, doctor.address);
    expect(await c.hasAccess(code, doctor.address)).eq(false);
    await c.connect(holder).grantDoctorAccess(code, doctor.address, 60);
    await network.provider.send("evm_increaseTime", [61]);
    await network.provider.send("evm_mine");
    expect(await c.hasAccess(code, doctor.address)).eq(false);
  });
  it("manager invalidation and whitelist removal", async () => {
    await c.setHospitalRole(issuer.address, true);
    await c
      .connect(issuer)
      .issueMedicalRecord(code, hash, holder.address, "QmEncryptedDemoCid");
    await rejects(c.connect(other).invalidateRecord(code), "MANAGER_ONLY");
    await c.setInspectorRole(manager.address, true);
    await rejects(
      c.connect(manager).invalidateRecord(code),
      "MANAGER_SCOPE_FORBIDDEN",
    );
    await c.setWalletScope(manager.address, ethers.id("wrong-org"));
    await rejects(
      c.connect(manager).invalidateRecord(code),
      "MANAGER_SCOPE_FORBIDDEN",
    );
    await c.setWalletScope(manager.address, ethers.id("org"));
    await c.setWalletScope(issuer.address, ethers.id("org"));
    await c.connect(manager).invalidateRecord(code);
    expect((await c.verifyMedicalRecord(code)).invalidated).eq(true);
    expect(await c.hasAccess(code, holder.address)).eq(false);
    await rejects(
      c.connect(holder).grantDoctorAccess(code, doctor.address, 60),
      "INVALIDATED",
    );
    await c.setHospitalRole(issuer.address, false);
    await rejects(
      c
        .connect(issuer)
        .issueMedicalRecord(
          ethers.id("new"),
          hash,
          holder.address,
          "QmEncryptedDemoCid",
        ),
      "ISSUER_ONLY",
    );
  });
  it("issuer scope is snapshotted for historical records", async () => {
    await c.setHospitalRole(issuer.address, true);
    await c
      .connect(issuer)
      .issueMedicalRecord(code, hash, holder.address, "QmEncryptedDemoCid");
    await c.setWalletScope(issuer.address, ethers.id("new-org"));
    await c.setInspectorRole(manager.address, true);
    await c.setWalletScope(manager.address, ethers.id("new-org"));
    await rejects(
      c.connect(manager).invalidateRecord(code),
      "MANAGER_SCOPE_FORBIDDEN",
    );
    await c.setWalletScope(manager.address, ethers.id("org"));
    await c.connect(manager).invalidateRecord(code);
    expect((await c.verifyMedicalRecord(code)).invalidated).eq(true);
  });
});
