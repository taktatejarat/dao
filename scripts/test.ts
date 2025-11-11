// scripts/test.ts - FINAL, CORRECT VERSION WITH TIME MANIPULATION

import { ethers, network } from "hardhat";
import { RayanChainDAO, Staking, RayanChainToken } from "../typechain-types";
import { keccak256, encodePacked } from "viem";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Simulating transaction with DEPLOYER account:", deployer.address);

    // --- آدرس‌های قراردادهای مستقر شده روی شبکه Hardhat ---
    const DAO_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
    const TOKEN_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const STAKING_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

    const dao = await ethers.getContractAt("RayanChainDAO", DAO_ADDRESS) as RayanChainDAO;
    const token = await ethers.getContractAt("RayanChainToken", TOKEN_ADDRESS) as RayanChainToken;
    const staking = await ethers.getContractAt("Staking", STAKING_ADDRESS) as Staking;

    // --- STEP 1: آماده‌سازی - استیک کردن توکن ---
    console.log("\n--- Preparing for test: Staking RYC tokens ---");
    const stakeAmount = ethers.parseEther("10000");

    try {
        console.log("   - Approving Staking contract...");
        const approveTx = await token.approve(STAKING_ADDRESS, stakeAmount);
        await approveTx.wait();
        console.log("   - Approval successful.");

        // ✅✅✅ THE FIX IS HERE ✅✅✅
        // به صورت دستی زمان شبکه را به جلو می‌بریم تا `block.timestamp` تغییر کند
        console.log("   - Increasing network time by 1 hour...");
        await network.provider.send("evm_increaseTime", [3600]); // 3600 ثانیه = 1 ساعت
        await network.provider.send("evm_mine"); // ماین کردن یک بلاک جدید با تایم‌استمپ جدید

        console.log("   - Staking RYC tokens...");
        const stakeTx = await staking.stake(stakeAmount);
        await stakeTx.wait();
        console.log("   - Staking successful.");

        const stakedBalance = await staking.getStakedAmount(deployer.address);
        console.log(`   - Current Staked Balance: ${ethers.formatEther(stakedBalance)} RYC`);
        
        // بررسی می‌کنیم که آیا مقدار استیک شده بزرگتر از صفر است
        if (stakedBalance === 0n) {
            throw new Error("Staking failed, staked balance is zero.");
        }

    } catch (error) {
        console.error("--- ❌ PREPARATION FAILED ❌ ---");
        console.error("Could not stake tokens. Ensure contracts are deployed and deployer has tokens.", error);
        return; // اگر استیک کردن شکست بخورد، ادامه نده
    }


    // --- ✅✅✅ STEP 2: آماده‌سازی داده‌های تست ---
    console.log("\n--- Preparing test data for proposal creation ---");

    // ✅ FIX: استفاده از مقادیر واقعی به جای placeholder
    const description = "این یک پروپوزال تستی برای اثبات عملکرد صحیح است.";
    const descriptionHash = keccak256(encodePacked(['string'], [description]));
    const recipient = deployer.address; // برای سادگی، خودمان را دریافت‌کننده قرار می‌دهیم
    
    const milestoneNames = ["فاز اول: تحقیق", "فاز دوم: توسعه"];
    const milestoneDurations = [30, 90];
    const milestoneAmounts = [ethers.parseEther("1000"), ethers.parseEther("5000")];

    console.log("   - Description Hash:", descriptionHash);
    console.log("   - Recipient:", recipient);
    

    // --- ✅✅✅ STEP 3: شبیه‌سازی و اجرای تراکنش ---
    console.log("\n--- Simulating and Executing createFundingProposal ---");
    try {
        console.log("   - Attempting to simulate (staticCall)...");
        // فراخوانی با آرایه‌های ساده و مقادیر واقعی
        await dao.createFundingProposal.staticCall(
            descriptionHash, 
            recipient,
            milestoneNames,
            milestoneDurations,
            milestoneAmounts
        );
        
        console.log("\n✅✅✅ SIMULATION SUCCESSFUL! ✅✅✅");
        console.log("   - The transaction is valid and should pass.");
        
        console.log("\n   - Now, sending the actual transaction...");
        const tx = await dao.createFundingProposal(
            descriptionHash, 
            recipient,
            milestoneNames,
            milestoneDurations,
            milestoneAmounts
        );
        console.log("   - Transaction sent! Hash:", tx.hash);
        
        await tx.wait();
        console.log("\n✅✅✅ TRANSACTION CONFIRMED SUCCESSFULLY! ✅✅✅");

    } catch (error) {
        console.error("\n--- ❌ TRANSACTION FAILED ❌ ---");
        // @ts-ignore
        console.error("   - Reason:", error.reason || "No reason string provided (likely Stack Too Deep or invalid opcode).");
        // console.error("   - Full Error:", error);
    }
}

main().catch(console.error);