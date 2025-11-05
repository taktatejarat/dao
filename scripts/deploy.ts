// scripts/deploy.ts - FINAL, FULLY UPGRADEABLE DEPLOYMENT SCRIPT

import { ethers, upgrades, network } from "hardhat";
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
    console.log(`🚀 Starting FULLY UPGRADEABLE DAO deployment on network: ${network.name}...`);

    const [deployer] = await ethers.getSigners();
    const aiOracleAddress = deployer.address;
    const adminPrivateKey = process.env.PRIVATE_KEY;

    console.log("👤 Deploying contracts with the account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // --- DEPLOYMENT ---

    // 0. Deploy DAORegistry (این قرارداد ساده و غیرقابل ارتقاء باقی می‌ماند)
    console.log("\n[0/9] Deploying DAORegistry...");
    const DAORegistryFactory = await ethers.getContractFactory("DAORegistry");
    const registry = await DAORegistryFactory.deploy(deployer.address);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ DAORegistry deployed to:", registryAddress);

    // ✅✅✅ تمام قراردادهای اصلی بعدی با متد upgrades.deployProxy مستقر می‌شوند ✅✅✅

    // 1. Deploy AccControl (Upgradeable)
    console.log("\n[1/9] Deploying AccControl (Upgradeable)...");
    const AccControlFactory = await ethers.getContractFactory("AccControl");
    const accControl = await upgrades.deployProxy(AccControlFactory, [deployer.address], { initializer: 'initialize', kind: 'uups' });
     await accControl.waitForDeployment();
    const accControlAddress = await accControl.getAddress();
    console.log("✅ AccControl (Proxy) deployed to:", accControlAddress);
    
    // 2. Deploy RayanChainToken (Upgradeable)
    console.log("\n[2/9] Deploying RayanChainToken (Upgradeable)...");
    const RayanChainTokenFactory = await ethers.getContractFactory("RayanChainToken");
    const initialTokenSupply = ethers.parseUnits("1000000000", 18);
    const rayanChainToken = await upgrades.deployProxy(RayanChainTokenFactory, [deployer.address, initialTokenSupply], { initializer: 'initialize', kind: 'uups' });
    await rayanChainToken.waitForDeployment();
    const tokenAddress = await rayanChainToken.getAddress();
    console.log("✅ RayanChainToken (Proxy) deployed to:", tokenAddress);

    // 3. Deploy Staking (Upgradeable)
    console.log("\n[3/9] Deploying Staking (Upgradeable)...");
    const StakingFactory = await ethers.getContractFactory("Staking");
    const staking = await upgrades.deployProxy(StakingFactory, [tokenAddress, deployer.address], { initializer: 'initialize', kind: 'uups' });
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("✅ Staking (Proxy) deployed to:", stakingAddress);

    // 4. Deploy Finance (Upgradeable)
    console.log("\n[4/9] Deploying Finance (Upgradeable)...");
    const FinanceFactory = await ethers.getContractFactory("Finance");
    const platformFeeBps = 250;
    const finance = await upgrades.deployProxy(FinanceFactory, [deployer.address, tokenAddress, platformFeeBps, accControlAddress], { initializer: 'initialize', kind: 'uups' });
    await finance.waitForDeployment();
    const financeAddress = await finance.getAddress();
    console.log("✅ Finance (Proxy) deployed to:", financeAddress);

    // 5. Deploy TimelockController (این قرارداد از OpenZeppelin است و قابل ارتقاء نیست)
    console.log("\n[5/9] Deploying TimelockController...");
    const TimelockFactory = await ethers.getContractFactory("RayanChainTimelockController");
    const minDelayInSeconds = 72 * 60 * 60; // 72 hours
    const timelock = await TimelockFactory.deploy(minDelayInSeconds, [], [], deployer.address);
    await timelock.waitForDeployment();
    const timelockAddress = await timelock.getAddress();
    console.log("✅ TimelockController deployed to:", timelockAddress);

    // 6. Deploy UserProfile (Upgradeable)
    console.log("\n[6/9] Deploying UserProfile (Upgradeable)...");
    const UserProfileFactory = await ethers.getContractFactory("UserProfile");
    const userProfile = await upgrades.deployProxy(UserProfileFactory, [deployer.address], { initializer: 'initialize', kind: 'uups' });
    await userProfile.waitForDeployment();
    const userProfileAddress = await userProfile.getAddress();
    console.log("✅ UserProfile (Proxy) deployed to:", userProfileAddress);

    // 7. Deploy RayanChainDAO (Upgradeable)
    console.log("\n[7/9] Deploying RayanChainDAO (Upgradeable)...");
    const RayanChainDAOFactory = await ethers.getContractFactory("RayanChainDAO");
    const votingPeriodInSeconds = 7 * 24 * 60 * 60;
    const quorumPercentage = 10;
    const approvalThreshold = 51;
    const dao = await upgrades.deployProxy(RayanChainDAOFactory, [
        deployer.address, accControlAddress, stakingAddress, financeAddress, timelockAddress,
        votingPeriodInSeconds, quorumPercentage, approvalThreshold
    ], { initializer: 'initialize', kind: 'uups' });
    await dao.waitForDeployment();
    const daoAddress = await dao.getAddress();
    console.log("✅ RayanChainDAO (Proxy) deployed to:", daoAddress);

    // --- CONFIGURATION & OWNERSHIP TRANSFER ---
    console.log("\n--- Starting Configuration & Ownership Transfer ---");

    // مقداردهی اولیه قیمت در توکن
    console.log("   - Initializing RayanChainToken pricing...");
    const tokenContract = await ethers.getContractAt("RayanChainToken", tokenAddress);
    const maticUsdPriceFeedAmoy = "0x001382149eBa3441043c1c66972b4772963f5D43";
    const initialRycAmountPerUsd = ethers.parseUnits("100000", 18);
    await (await tokenContract.initializePricing(maticUsdPriceFeedAmoy, initialRycAmountPerUsd)).wait();
    console.log("   ✅ Token pricing initialized.");

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


    console.log("\n🏁 Full Upgradeable DAO Deployment Successful!");
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