import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const proxyAddress = process.env.NEXT_PUBLIC_DAO_ADDRESS;
  // 🔴 ID پروپوزالی که می‌خواهید آزاد کنید را اینجا بنویسید
  const proposalId = 7; 

  if (!proxyAddress) throw new Error("No DAO Address found");

  console.log("🔍 --- DIAGNOSTIC START ---");
  const dao = await ethers.getContractAt("RayanChainDAO", proxyAddress);
  
  // 1. خواندن اطلاعات واقعی از بلاکچین
  try {
      const proposal = await dao.proposals(proposalId);
      console.log(`📋 Proposal #${proposalId} Data:`);
      console.log(`   - Proposer:  ${proposal.proposer}`);
      console.log(`   - Recipient: ${proposal.recipient}`);
      
      const [signer] = await ethers.getSigners();
      console.log(`   - Your Addr: ${signer.address}`);
      
      if (signer.address.toLowerCase() === proposal.proposer.toLowerCase()) {
          console.log("   ✅ MATCH: Your wallet IS the Proposer.");
      } else {
          console.log("   ❌ MISMATCH: Your wallet is NOT the Proposer.");
      }
  } catch (e) {
      console.log("   ⚠️ Could not read proposal. ID might be wrong.");
  }

  // 2. اجرای آپگرید اجباری
  console.log("\n🚀 --- FORCING UPGRADE ---");
  const RayanChainDAOv2 = await ethers.getContractFactory("RayanChainDAO");
  
  // Force upgrade even if it thinks it's similar
  const upgradedDao = await upgrades.upgradeProxy(proxyAddress, RayanChainDAOv2, {
      unsafeAllow: ['constructor', 'state-variable-immutable'], // گزینه‌های امنیتی معمول
      txOverrides: { gasLimit: 5000000 } // جلوگیری از خطای Pending
  });
  
  await upgradedDao.waitForDeployment();
  
  console.log("✅ Upgrade Transaction Confirmed!");
  console.log("   Now try the button in the frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});