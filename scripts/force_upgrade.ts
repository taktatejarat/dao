// scripts/force_upgrade.ts

import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const proxyAddress = process.env.NEXT_PUBLIC_DAO_ADDRESS;
  
  if (!proxyAddress) {
    throw new Error("NEXT_PUBLIC_DAO_ADDRESS not set in .env");
  }

  console.log("🚀 Starting Force Upgrade...");
  console.log("📍 Proxy Address:", proxyAddress);

  // 1. دریافت آخرین نسخه کامپایل شده قرارداد
  const RayanChainDAOv2 = await ethers.getContractFactory("RayanChainDAO");

  // 2. مرحله Force Import (حل مشکل not registered)
  console.log("📥 Step 1: Force Importing Proxy history...");
  try {
      // این دستور فایل .openzeppelin/unknown-80002.json را بازسازی می‌کند
      await upgrades.forceImport(proxyAddress, RayanChainDAOv2);
      console.log("   ✅ Import successful.");
  } catch (e: any) {
      // اگر قبلاً ایمپورت شده باشد، ممکن است خطا دهد که نادیده می‌گیریم
      console.log("   ⚠️ Import info:", e.message);
  }

  // 3. مرحله آپگرید واقعی
  console.log("⬆️ Step 2: Upgrading to New Implementation...");
  
  const upgraded = await upgrades.upgradeProxy(proxyAddress, RayanChainDAOv2, {
      unsafeAllow: ['constructor', 'state-variable-immutable'],
      // تنظیم گس دستی برای جلوگیری از خطای Pending State شبکه Amoy
      txOverrides: { 
          gasLimit: 5000000,
          gasPrice: 35000000000 // 35 Gwei
      }
  });

  console.log("⏳ Waiting for transaction confirmation...");
  await upgraded.waitForDeployment();

  console.log("✅ Upgrade Complete!");
  console.log("   Logic updated. You can now use the Milestone button.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});