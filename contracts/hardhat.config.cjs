require("@nomicfoundation/hardhat-ethers");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { subtask } = require("hardhat/config");
const {
  TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
} = require("hardhat/builtin-tasks/task-names");
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(
  async ({ solcVersion }, hre, runSuper) =>
    solcVersion === "0.8.24"
      ? {
          compilerPath: require.resolve("solc/soljson.js"),
          isSolcJs: true,
          version: solcVersion,
          longVersion: require("solc").version(),
        }
      : runSuper(),
);
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      accounts: {
        mnemonic:
          process.env.DEMO_MNEMONIC ||
          "test test test test test test test test test test test junk",
      },
    },
    localhost: { url: process.env.RPC_URL || "http://127.0.0.1:8545" },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: [], // Dedicated deployment script reads the separate key file.
    },
  },
  paths: { sources: "./contracts" },
};
