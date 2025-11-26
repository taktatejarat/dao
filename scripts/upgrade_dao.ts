// scripts/upgrade_dao.ts

import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const proxyAddress = process.env.NEXT_PUBLIC_DAO_ADDRESS;

  if (!proxyAddress) {
    console.error("❌ Error: NEXT_PUBLIC_DAO_ADDRESS not found in .env file.");
    return;
  }

  console.log("🔄 Starting upgrade for RayanChainDAO...");
  console.log("📍 Proxy Address:", proxyAddress);

  const RayanChainDAOv2 = await ethers.getContractFactory("RayanChainDAO");

  // ✅✅✅ FIX: اضافه کردن تنظیمات دستی گس برای جلوگیری از خطای Pending State
  const dao = await upgrades.upgradeProxy(proxyAddress, RayanChainDAOv2, {
    txOverrides: {
      gasLimit: 5000000, // مقدار بالا (۵ میلیون) تا نیازی به estimateGas نباشد
      // اگر باز هم خطا داد، خط زیر را هم از کامنت در بیاورید (قیمت دستی گس)
      // gasPrice: 35000000000, // 35 Gwei
    }
  });

  console.log("⏳ Waiting for transaction to be mined...");
  await dao.waitForDeployment();

  console.log("✅ RayanChainDAO successfully upgraded!");
  console.log("   - Proxy address remains:", await dao.getAddress());
  console.log("   - New Implementation Logic attached.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});