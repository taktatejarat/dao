// hardhat.config.cts
// hardhat.config.ts

import { HardhatUserConfig } from "hardhat/config";
import "dotenv/config"; // Use import instead of require for consistency
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter"; // ✅ ۱. پلاگین جدید را import می‌کنیم

// --- Environment Variables ---
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.warn("WARNING: PRIVATE_KEY environment variable is not set.");
}
const accounts = privateKey ? [privateKey] : [];

const amoyRpcUrl = process.env.AMOY_RPC_URL;
const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;

// --- Hardhat Configuration ---
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, 
    },
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: { chainId: 31337 },
    sepolia: {
      url: sepoliaRpcUrl || "https://rpc.sepolia.org",
      accounts: accounts,
    },
    amoy: {
      url: amoyRpcUrl || "https://rpc-amoy.polygon.technology",
      accounts: accounts,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
  // ✅✅✅ ۲. اضافه کردن پیکربندی صحیح برای abiExporter ✅✅✅
  abiExporter: {
    path: './temp_abis', // <-- یک پوشه موقت برای JSON های کامل
    runOnCompile: true,
    clear: true,
    flat: true, // مهم‌ترین بخش: ABI های کامل و flattened تولید می‌کند
    only: [':(DAORegistry|RayanChainDAO|Finance|Staking|RayanChainToken|AccControl|CustomHash|UserProfile)$'], // فقط قراردادهای اصلی
  }
};

// ✅ از export default استفاده می‌کنیم که استاندارد TypeScript است
export default config;