// scripts/smart_upgrade.ts

import { ethers, upgrades, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`🛡️  Starting Smart Upgrade Sentinel on ${network.name}`);
    console.log(`👤 Executor: ${deployer.address}`);

    // 1. خواندن فایل کانفیگ امن
    const configPath = path.resolve(process.cwd(), "dao-config.json");
    if (!fs.existsSync(configPath)) {
        console.log("❌ No pending configuration found (dao-config.json is missing).");
        console.log("   Please go to Admin Settings page and click 'Save & Prepare Upgrade'.");
        return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    // نمایش متادیتای امنیتی
    if (config._meta) {
        console.log(`\n📜 Config Authorization Info:`);
        console.log(`   - Signed By: ${config._meta.updatedBy}`);
        console.log(`   - Timestamp: ${config._meta.updatedAt}`);
        console.log(`   - Signature: ${config._meta.signature.substring(0, 20)}...`);
    }

    // 2. اتصال به قراردادها
    const daoAddress = process.env.NEXT_PUBLIC_DAO_ADDRESS;
    const financeAddress = process.env.NEXT_PUBLIC_FINANCE_ADDRESS;

    if (!daoAddress || !financeAddress) throw new Error("Contract addresses missing in .env");

    const daoContract = await ethers.getContractAt("RayanChainDAO", daoAddress);
    const financeContract = await ethers.getContractAt("Finance", financeAddress);

    console.log("\n🔍 Analyzing Parameter Divergence...");
    let changesDetected = false;

    // --- CHECK 1: DAO Voting Period ---
    try {
        const currentVotingPeriod = await daoContract.votingPeriod();
        const targetVotingPeriod = BigInt(config.dao.votingPeriod);

        if (currentVotingPeriod !== targetVotingPeriod) {
            console.log(`   ⚠️ [Mismatch] Voting Period: Current=${currentVotingPeriod} => Target=${targetVotingPeriod}`);
            console.log("      Executing Update...");
            const tx = await daoContract.setVotingPeriod(targetVotingPeriod);
            await tx.wait();
            console.log("      ✅ Updated.");
            changesDetected = true;
        } else {
            console.log("   ✅ [Synced] Voting Period");
        }
    } catch (e) { console.log(`   ❌ Error checking DAO params: ${(e as Error).message}`); }


    // --- CHECK 2: Finance Fees ---
    try {
        const currentProtocolFee = await financeContract.protocolFeeBps();
        const currentClientFee = await financeContract.clientFeeBps();
        
        const targetProtocolFee = BigInt(config.finance.protocolFeeBps);
        const targetClientFee = BigInt(config.finance.clientFeeBps);

        if (currentProtocolFee !== targetProtocolFee || currentClientFee !== targetClientFee) {
            console.log(`   ⚠️ [Mismatch] Fees Configuration:`);
            console.log(`      Protocol: ${currentProtocolFee} => ${targetProtocolFee}`);
            console.log(`      Client:   ${currentClientFee} => ${targetClientFee}`);
            
            console.log("      Executing Update...");
            const tx = await financeContract.setFeeConfiguration(targetProtocolFee, targetClientFee);
            await tx.wait();
            console.log("      ✅ Updated.");
            changesDetected = true;
        } else {
            console.log("   ✅ [Synced] Finance Fees");
        }
    } catch (e) { console.log(`   ❌ Error checking Finance params: ${(e as Error).message}`); }

    if (!changesDetected) {
        console.log("\n✨ System is fully synced. No actions taken.");
    } else {
        console.log("\n🚀 Upgrade execution completed successfully.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});