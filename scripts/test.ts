// scripts/deploy.ts - DIAGNOSTIC TEST SCRIPT

import { ethers, upgrades } from "hardhat";

async function main() {
    // تست شماره ۱: آیا این فایل جدید اصلاً خوانده می‌شود؟
    // اگر این خطا را دیدید، یعنی فایل درست است و به مرحله بعد می‌رویم.
    console.log("--- RUNNING DIAGNOSTIC SCRIPT V2 ---");

    const [deployer] = await ethers.getSigners();
    const argsForAccControl = [deployer.address];

    // تست شماره ۲: چاپ آرگومان‌ها قبل از فراخوانی تابع
    // این خط باید آدرس شما را در یک آرایه چاپ کند.
    console.log("[DEBUG] Arguments being passed to AccControl deployProxy:", argsForAccControl);

    // تست شماره ۳: فراخوانی تابع با آرگومان‌های چاپ شده
    console.log("\nAttempting to deploy AccControl (Upgradeable)...");
    const AccControlFactory = await ethers.getContractFactory("AccControl");
    
    // ما به صراحت متغیر آرگومان‌ها را به تابع پاس می‌دهیم
    const accControl = await upgrades.deployProxy(AccControlFactory, argsForAccControl, { initializer: 'initialize', kind: 'uups' });
    
    await accControl.waitForDeployment();
    
    console.log("✅✅✅ DIAGNOSTIC TEST PASSED: AccControl deployed successfully to:", await accControl.getAddress());
}

main().catch((error) => {
    console.error("\n❌ An error occurred during the DIAGNOSTIC script:");
    console.error(error);
    process.exit(1);
});