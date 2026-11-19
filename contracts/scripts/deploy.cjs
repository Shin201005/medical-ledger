const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
async function main() {
  const contract = await (
    await hre.ethers.getContractFactory("MedicalRecordRegistry")
  ).deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress(),
    network = await hre.ethers.provider.getNetwork();
  const output = { address, chainId: Number(network.chainId), version: 4 };
  const dest =
    process.env.DEPLOYMENT_PATH ||
    path.join(__dirname, "../../deployment.json");
  fs.writeFileSync(dest, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output));
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
