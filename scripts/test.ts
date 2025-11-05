// scripts/testProposalCreation.ts - نسخه ساده شده برای اجرا با کیف پول دیپلیر

import { ethers } from "hardhat";

async function main() {
    // ✅ STEP 1: استفاده از signer پیش‌فرض (دیپلیر)
    // این signer با PRIVATE_KEY شما در hardhat.config.ts پیکربندی شده است.
    const [deployer] = await ethers.getSigners();
    console.log(`Simulating transaction with DEPLOYER account: ${deployer.address}`);

    // ✅ STEP 2: آدرس DAO را از لاگ خطای قبلی کپی کنید
    const DAO_ADDRESS = "0x5C8683BeD6b02e15AE96c4c13d2E5442A749D6Ad";
    const daoContract = await ethers.getContractAt("RayanChainDAO", DAO_ADDRESS);

    // ✅ STEP 3: آرگومان‌ها را دقیقاً از لاگ خطا کپی کنید
    const descriptionHash = "0x75fd679d150ecddfa7b2c4f70aeffef4b20f198bd86697ff1187ff5ed4bc6519";
    
    // 💡 نکته: حتی اگر دیپلیر ارسال کننده است، دریافت کننده می‌تواند همان کاربر قبلی باشد.
    const recipientAddress = "0x7f9B30A1ba232bC9C847d93f36c293a4726C5De2";
    
    const milestones = [
        {
            name: "فاز تحقیق و توسعه",
            durationDays: 45,
            amount: ethers.parseEther("500"),
            // فیلدهای زیر در قرارداد مقداردهی می‌شوند و نیازی به ارسال نیست،
            // اما برای تطابق با struct باید نوع آن‌ها صحیح باشد.
            state: 0,
            proofOfProgressHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
            released: false
        },
        {
            name: "فاز طراحی معماری",
            durationDays: 120,
            amount: ethers.parseEther("1000"),
            state: 0,
            proofOfProgressHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
            released: false
        },
        {
            name: "فاز پیاده سازی اولیه MVP",
            durationDays: 120,
            amount: ethers.parseEther("500"),
            state: 0,
            proofOfProgressHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
            released: false
        }
    ];

    try {
        console.log("Attempting to simulate (staticCall) createFundingProposal...");
        
        // ✅ STEP 4: استفاده از staticCall برای شبیه‌سازی بدون ارسال تراکنش
        // این کار دلیل revert را بدون هزینه کردن gas به ما نشان می‌دهد.
        await daoContract.createFundingProposal.staticCall(
            descriptionHash,
            recipientAddress,
            milestones
        );
        
        console.log("✅ Simulation successful! The transaction should pass.");
        console.log("   Now, attempting to send the actual transaction...");

        // اگر شبیه‌سازی موفق بود، تراکنش واقعی را ارسال کنید
        const tx = await daoContract.createFundingProposal(descriptionHash, recipientAddress, milestones);
        console.log("   Transaction sent! Hash:", tx.hash);
        
        await tx.wait();
        console.log("✅ Transaction confirmed successfully!");

    } catch (error: any) {
        console.error("\n❌ Transaction failed!");
        
        // Hardhat دلیل دقیق revert را در اینجا نمایش می‌دهد
        if (error.reason) {
            console.error("   Revert Reason:", error.reason);
        } else if (error.data) {
            // گاهی اوقات دلیل در فیلد data قرار دارد
            console.error("   Error Data:", error.data);
        } else {
            console.error("   Full Error:", error);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});