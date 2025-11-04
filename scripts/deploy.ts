// scripts/deploy.ts - FINAL, FULLY INTEGRATED VERSION with Multisig Deployment

import { ethers, network } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

// Helper function to read/write env file (simple append/replace)
function updateEnvFile(key: string, value: string) {
    const envPath = path.resolve(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if the key exists and replace its value
    // The regex looks for the key at the start of a line (m flag)
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
        // Replace existing line
        envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
        // If the key does not exist, append it
        envContent += `\n${key}=${value}`;
    }
    
    fs.writeFileSync(envPath, envContent, 'utf8');
}

async function main() {
    console.log(`🚀 Starting full DAO deployment on network: ${network.name}...`);
    
    const [deployer] = await ethers.getSigners();
    
    // AI Oracle Role is assigned to the Deployer (Admin) as requested
    const aiOracleAddress = deployer.address; 
    const adminPrivateKey = process.env.PRIVATE_KEY; 
    
    // ⚠️ NEW LOGIC: آدرس‌های موقت برای نقش‌های جدید
    // برای سادگی، deployer را PAUSER و AUDITOR قرار می‌دهیم تا پس از Deploy، مالکیت به Timelock منتقل شود.
    const pauserAddresses = [deployer.address]; 
    const executorAddresses = [deployer.address]; // Timelock به عنوان Executor عمل خواهد کرد
    const adminAddress = deployer.address;
    
    console.log("👤 Deploying contracts with the account:", deployer.address);
    console.log("🤖 AI Oracle Address (Using Deployer's Address):", aiOracleAddress);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH/MATIC");

    // 0. Deploy DAORegistry
    console.log("\n[0/9] Deploying DAORegistry (Contract address book)...");
    const registry = await ethers.deployContract("DAORegistry", [deployer.address]);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ DAORegistry deployed to:", registryAddress);

    // 1. Deploy AccControl (Now includes PAUSER, AUDITOR, EXECUTOR roles)
    console.log("\n[1/9] Deploying AccControl contract...");
    const accControl = await ethers.deployContract("AccControl", [deployer.address]);
    await accControl.waitForDeployment();
    const accControlAddress = await accControl.getAddress();
    console.log("✅ AccControl deployed to:", accControlAddress);

    // 2. Deploy RayanChainToken and Initialize
    const initialTokenSupply = ethers.parseUnits("1000000000", 18);
    console.log(`\n[2/9] Deploying RayanChainToken contract...`);
    
    const rayanChainToken = await ethers.deployContract("RayanChainToken", [
        deployer.address, 
        initialTokenSupply
    ]);
    await rayanChainToken.waitForDeployment();
    const tokenAddress = await rayanChainToken.getAddress();
    console.log(`✅ RayanChainToken deployed to: ${tokenAddress}`);

    console.log("   - Initializing dynamic pricing parameters...");
    
    // ✅ FIX: تبدیل آدرس Price Feed به Checksum Address
    const maticUsdPriceFeedAmoy = ethers.getAddress("0x001382149eBa3441043c1c66972b4772963f5D43");
    const initialRycAmountPerUsd = ethers.parseUnits("100000", 18);

    const initTx = await rayanChainToken.initializePricing(
        maticUsdPriceFeedAmoy,
        initialRycAmountPerUsd
    );
    await initTx.wait();
    console.log("   ✅ Dynamic pricing initialized successfully.");

    // 3. Deploy Staking Contract
    console.log("\n[3/9] Deploying Staking contract...");
    const staking = await ethers.deployContract("Staking", [tokenAddress, deployer.address]);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("✅ Staking contract deployed to:", stakingAddress);
    
    // 4. Deploy Finance (Vault) Contract (Now accepts AccControl Address)
    console.log("\n[4/9] Deploying Finance (Vault) contract...");
    const platformFeeBps = 250; 
    // ✅ CHANGE: Added accControlAddress to Finance constructor
    const finance = await ethers.deployContract("Finance", [deployer.address, tokenAddress, platformFeeBps, accControlAddress]); 
    await finance.waitForDeployment();
    const financeAddress = await finance.getAddress();
    console.log(`✅ Finance (Vault) deployed to: ${financeAddress} with a ${platformFeeBps / 100}% platform fee.`);
    
  // 5. Deploy Timelock Controller (NEW CRITICAL STEP)
    const minDelayInSeconds = 72 * 60 * 60; // 72 hours
    console.log(`\n[5/9] Deploying TimelockController with min delay of ${minDelayInSeconds} seconds...`);
    
    // ✅ FIX: استفاده از Constructor استاندارد TimelockController
    // Proposers و Executors را خالی می‌گذاریم و در مراحل بعدی به صورت دستی به DAO اعطا می‌کنیم.
    const timelock = await ethers.deployContract("TimelockController", [
        minDelayInSeconds,
        [], // proposers (ابتدا خالی)
        [], // executors (ابتدا خالی)
        deployer.address // admin (موقت)
    ]);
    await timelock.waitForDeployment();
    const timelockAddress = await timelock.getAddress();
    console.log("✅ TimelockController deployed to:", timelockAddress);
    
    // 6. Deploy UserProfile Contract
    console.log("\n[6/9] Deploying UserProfile contract...");
    const userProfile = await ethers.deployContract("UserProfile", [deployer.address]);
    await userProfile.waitForDeployment();
    const userProfileAddress = await userProfile.getAddress();
    console.log("✅ UserProfile contract deployed to:", userProfileAddress);
    
    // 7. Deploy RayanChainDAO Contract (The Core)
    const votingPeriodInSeconds = 7 * 24 * 60 * 60; // 7 days
    const quorumPercentage = 10; 
    const approvalThreshold = 51; 
    console.log("\n[7/9] Deploying RayanChainDAO contract...");
 // ✅ FIX: اطمینان از ارسال آدرس صحیح Timelock
    const dao = await ethers.deployContract("RayanChainDAO", [
        accControlAddress,
        stakingAddress,
        financeAddress,
        timelockAddress,
        votingPeriodInSeconds,
        quorumPercentage,
        approvalThreshold
    ]);
    await dao.waitForDeployment();
    const daoAddress = await dao.getAddress();
    console.log("✅ RayanChainDAO deployed to:", daoAddress);

    // 8. Timelock Role Finalization
    console.log("\n[8/9] Finalizing Timelock Roles...");
    const timelockContract = await ethers.getContractAt("RayanChainTimelockController", timelockAddress);
    const PROPOSER_ROLE = await timelockContract.PROPOSER_ROLE();
    const EXECUTOR_ROLE_TIMELOCK = await timelockContract.EXECUTOR_ROLE(); 
    const CANCELLER_ROLE = await timelockContract.CANCELLER_ROLE();

    process.stdout.write("   - Granting PROPOSER role to DAO contract...");
    // ethers.getAddress() تضمین می‌کند که آدرس معتبر است
    await (await timelockContract.grantRole(PROPOSER_ROLE, ethers.getAddress(daoAddress))).wait();
    process.stdout.write(" Done\n");

    process.stdout.write("   - Granting EXECUTOR role to everyone (permissionless execution)...");
    await (await timelockContract.grantRole(EXECUTOR_ROLE_TIMELOCK, ethers.ZeroAddress)).wait();
    process.stdout.write(" Done\n");
    
    process.stdout.write("   - Granting CANCELLER role to DAO contract...");
    await (await timelockContract.grantRole(CANCELLER_ROLE, daoAddress)).wait();
    process.stdout.write(" Done\n");

    // 9. Final Configurations & Ownership Transfer (CRITICAL SECURITY STEP)
    console.log("\n[9/9] Performing final configurations and transferring ownerships...");
    
    // --- STEP 9.1: Role Assignments in AccControl ---
    const DAO_MEMBER_ROLE = await accControl.DAO_MEMBER_ROLE();
    const AI_ORACLE_ROLE = await accControl.AI_ORACLE_ROLE();
    const PAUSER_ROLE = await accControl.PAUSER_ROLE(); // ✅ NEW
    const EXECUTOR_ROLE_ACC = await accControl.EXECUTOR_ROLE();
    
    process.stdout.write("   - Granting DAO member role to deployer...");
    await (await accControl.grantRole(DAO_MEMBER_ROLE, deployer.address)).wait();
    process.stdout.write(" Done\n");
    
    process.stdout.write(`   - Granting AI_ORACLE_ROLE to Admin Address: ${aiOracleAddress}...`);
    await (await accControl.grantRole(AI_ORACLE_ROLE, aiOracleAddress)).wait();
    process.stdout.write(" Done\n");

    // Grant EXECUTOR_ROLE from AccControl to the Timelock Controller
    process.stdout.write(`   - Granting EXECUTOR_ROLE to Timelock: ${timelockAddress}...`);
    await (await accControl.grantRole(EXECUTOR_ROLE_ACC, timelockAddress)).wait();
    process.stdout.write(" Done\n");
    
    // Grant PAUSER_ROLE from AccControl to the deployer
    process.stdout.write(`   - Granting PAUSER_ROLE to Deployer (Emergency Admin): ${deployer.address}...`);
    await (await accControl.grantRole(PAUSER_ROLE, deployer.address)).wait();
    process.stdout.write(" Done\n");



    // --- STEP 9.2: Set DAO Address & Initial Ownership Transfers ---    
    process.stdout.write("   - Setting DAO address in Finance contract...");
    await (await finance.setDaoAddress(daoAddress)).wait(); 
    process.stdout.write(" Done\n");

    process.stdout.write("   - Transferring ownership of Staking contract to the DAO...");
    await (await staking.transferOwnership(daoAddress)).wait();
    process.stdout.write(" Done\n");

    // --- STEP 9.3: CRITICAL SECURITY STEP: TRANSFERRING OWNERSHIP TO TIMELOCK ---
    console.log("\n   --- TRANSFERRING OWNERSHIP TO TIMELOCK ---");
    
    // Timelock will now manage the Treasury
    process.stdout.write(`   - Transferring Finance Ownership to Timelock: ${timelockAddress}...`);
    await (await finance.transferOwnership(timelockAddress)).wait();
    process.stdout.write(" Done\n");

    // Timelock will now manage the DAO's configuration
    process.stdout.write(`   - Transferring DAO Ownership to Timelock: ${timelockAddress}...`);
    await (await dao.transferOwnership(timelockAddress)).wait();
    process.stdout.write(" Done\n");
    
    // ✅ FIX: به جای transferOwnership، ما نقش DEFAULT_ADMIN_ROLE را منتقل می‌کنیم.
    console.log("\n   --- TRANSFERRING AccControl ADMIN ROLE TO TIMELOCK ---");
    const ADMIN_ROLE = await accControl.DEFAULT_ADMIN_ROLE();
    
    process.stdout.write(`   - Granting AccControl ADMIN ROLE to Timelock: ${timelockAddress}...`);
    await (await accControl.grantRole(ADMIN_ROLE, timelockAddress)).wait();
    process.stdout.write(" Done\n");
    
    process.stdout.write("   - Revoking AccControl ADMIN ROLE from Deployer...");
    await (await accControl.renounceRole(ADMIN_ROLE, deployer.address)).wait();
    process.stdout.write(" Done\n");

    // --- STEP 9.4: Finalizing DAO Autonomy (Making the DAO self-governed) ---
    console.log("\n   --- FINALIZING DAO AUTONOMY ---");
    const TIMELOCK_ADMIN_ROLE = await timelockContract.DEFAULT_ADMIN_ROLE();
    
    process.stdout.write("   - Granting Timelock ADMIN ROLE to itself (DAO becomes self-owner)...");
    await (await timelockContract.grantRole(TIMELOCK_ADMIN_ROLE, timelockAddress)).wait();
    
    process.stdout.write(" Done\n   - Revoking Deployer's admin access from Timelock...");
    await (await timelockContract.renounceRole(TIMELOCK_ADMIN_ROLE, deployer.address)).wait();
    console.log("   ✅ DAO is now fully decentralized and autonomous.");

    // ✅✅✅ NEW STEP: Treasury Funding ✅✅✅
    console.log("\n   --- Funding the DAO Treasury ---");
    const rayanChainTokenContract = await ethers.getContractAt("RayanChainToken", tokenAddress);
    const initialSupply = await rayanChainTokenContract.balanceOf(deployer.address);

    if (initialSupply > 0) {
        process.stdout.write(`   - Transferring initial supply (${ethers.formatEther(initialSupply)} RYC) from Deployer to Finance contract...`);
        const transferTx = await rayanChainTokenContract.transfer(financeAddress, initialSupply);
        await transferTx.wait();
        process.stdout.write(" Done\n");

        const deployerFinalBalance = await rayanChainTokenContract.balanceOf(deployer.address);
        const financeFinalBalance = await rayanChainTokenContract.balanceOf(financeAddress);
        console.log(`   - Deployer final RYC balance: ${ethers.formatUnits(deployerFinalBalance, 18)}`); // Should be 0
        console.log(`   - Treasury (Finance) final RYC balance: ${ethers.formatUnits(financeFinalBalance, 18)}`); // Should be 1 Billion
    } else {
        console.log("   - Deployer has no initial supply to transfer. Skipping treasury funding.");
    }

    // --- STEP 9.5: Register all addresses in DAORegistry ---
    console.log("   - Registering contract addresses in DAORegistry address book...");
    const KEY_DAO = ethers.id("RAYAN_CHAIN_DAO");
    const KEY_TOKEN = ethers.id("RAYAN_CHAIN_TOKEN");
    const KEY_FINANCE = ethers.id("FINANCE");
    const KEY_STAKING = ethers.id("STAKING");
    const KEY_ACC = ethers.id("ACC_CONTROL");
    const KEY_USER_PROFILE = ethers.id("USER_PROFILE");
    const KEY_TIMELOCK = ethers.id("TIMELOCK"); // ✅ NEW KEY
    await (await registry.setAddress(KEY_DAO, daoAddress)).wait();
    await (await registry.setAddress(KEY_TOKEN, tokenAddress)).wait();
    await (await registry.setAddress(KEY_FINANCE, financeAddress)).wait();
    await (await registry.setAddress(KEY_STAKING, stakingAddress)).wait();
    await (await registry.setAddress(KEY_ACC, accControlAddress)).wait();
    await (await registry.setAddress(KEY_USER_PROFILE, userProfileAddress)).wait();
    await (await registry.setAddress(KEY_TIMELOCK, timelockAddress)).wait(); // ✅ NEW REGISTER
    console.log("   - Registry updated. Done\n");
    
    // --- AUTOMATIC ENV CONFIGURATION ---
    console.log("   - Starting automatic AI Oracle ENV setup...");
    
    // 1. Read the DAO ABI from the artifact file
    const daoArtifactPath = path.resolve(__dirname, '..', 'artifacts', 'src', 'contracts', 'RayanChainDAO.sol', 'RayanChainDAO.json');
    const daoArtifact = JSON.parse(fs.readFileSync(daoArtifactPath, 'utf8'));
    const daoAbiJson = JSON.stringify(daoArtifact.abi).replace(/"/g, '\\"'); 
    
    // 2. Inject AI Oracle Private Key (Using Admin's Private Key)
    if (adminPrivateKey) {
        updateEnvFile('AI_ORACLE_PRIVATE_KEY', adminPrivateKey); 
    }
    
    // 3. Inject DAO ABI
    updateEnvFile('RAYAN_CHAIN_DAO_ABI', `"${daoAbiJson}"`);
    
    // ⚠️ NEW: Inject Timelock Address for the Front-End/Backend to check execution status
    updateEnvFile('TIMELOCK_ADDRESS', timelockAddress);
    
    console.log("   - AI Oracle ENV setup complete. Done\n");
    // --- END AUTOMATIC ENV CONFIGURATION ---


    console.log("\n🏁 Full DAO Deployment Successful!");
    console.log("\n--- DEPLOYMENT_SUMMARY_START ---");
    console.log(JSON.stringify({
        registryAddress,
        daoAddress,
        tokenAddress,
        stakingAddress,
        financeAddress,
        userProfileAddress,
        accControlAddress,
        timelockAddress, // ✅ NEW FIELD
        aiOracleAddress,
    }));
    console.log("--- DEPLOYMENT_SUMMARY_END ---");
}

main().catch((error) => {
    // Enhanced error logging
    console.error("\n❌ An unexpected error occurred during deployment. Details:");
    // Attempt to log the error message
    if (error.reason) {
        console.error(`   Reason: ${error.reason}`);
    } else if (error.message) {
        console.error(`   Message: ${error.message}`);
    } else {
        console.error(error);
    }
    process.exitCode = 1;
});