// scripts/deploy.ts - Final, Working Version with Auto-Configuration for AI Oracle

import { ethers, network } from "hardhat";
import * as fs from 'fs'; // ✅ NEW
import * as path from 'path'; // ✅ NEW

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
    
    // The Admin's private key (from .env) is needed for the AI Oracle Python script
    const adminPrivateKey = process.env.PRIVATE_KEY; 
    if (!adminPrivateKey) {
        // The previous successful deploy meant PRIVATE_KEY was available through hardhat config,
        // but for writing to .env, we must ensure it is present for the Oracle.
        console.warn("⚠️ WARNING: PRIVATE_KEY is not set in process.env. Cannot configure AI Oracle Private Key automatically.");
    }
    
    console.log("👤 Deploying contracts with the account:", deployer.address);
    console.log("🤖 AI Oracle Address (Using Deployer's Address):", aiOracleAddress);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH/MATIC");

    // 0. Deploy DAORegistry
    console.log("\n[0/7] Deploying DAORegistry (Contract address book)...");
    const registry = await ethers.deployContract("DAORegistry", [deployer.address]);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ DAORegistry deployed to:", registryAddress);

    // 1. Deploy AccControl
    console.log("\n[1/7] Deploying AccControl contract...");
    const accControl = await ethers.deployContract("AccControl", [deployer.address]);
    await accControl.waitForDeployment();
    const accControlAddress = await accControl.getAddress();
    console.log("✅ AccControl deployed to:", accControlAddress);

    // 2. Deploy RayanChainToken
    const initialTokenSupply = ethers.parseUnits("1000000000", 18); // 1 Billion tokens
    console.log(`\n[2/7] Deploying RayanChainToken with initial supply of ${ethers.formatEther(initialTokenSupply)} RYC...`);
    const rayanChainToken = await ethers.deployContract("RayanChainToken", [deployer.address, initialTokenSupply]);
    await rayanChainToken.waitForDeployment();
    const tokenAddress = await rayanChainToken.getAddress();
    console.log("✅ RayanChainToken deployed to:", tokenAddress);

    // 3. Deploy Staking Contract
    // NOTE: Staking.sol has been updated for dPoS, ensure you ran npm run build
    console.log("\n[3/7] Deploying Staking contract...");
    const staking = await ethers.deployContract("Staking", [tokenAddress, deployer.address]);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("✅ Staking contract deployed to:", stakingAddress);
    
    // 4. Deploy Finance (Vault) Contract
    console.log("\n[4/7] Deploying Finance (Vault) contract...");
    const platformFeeBps = 250; // کارمزد پلتفرم: 2.5% (250 basis points)
    const finance = await ethers.deployContract("Finance", [deployer.address, tokenAddress, platformFeeBps]); 
    await finance.waitForDeployment();
    const financeAddress = await finance.getAddress();
    console.log(`✅ Finance (Vault) deployed to: ${financeAddress} with a ${platformFeeBps / 100}% platform fee.`);
    
    // 5. Deploy UserProfile Contract
    console.log("\n[5/7] Deploying UserProfile contract...");
    const userProfile = await ethers.deployContract("UserProfile", [deployer.address]);
    await userProfile.waitForDeployment();
    const userProfileAddress = await userProfile.getAddress();
    console.log("✅ UserProfile contract deployed to:", userProfileAddress);
    
    // 6. Deploy RayanChainDAO Contract (The Core)
    // NOTE: RayanChainDAO.sol has been updated to accept hash, ensure you ran npm run build
    const votingPeriodInSeconds = 7 * 24 * 60 * 60; // 7 days
    const quorumPercentage = 10; // 10%
    const approvalThreshold = 51; // 51%
    console.log("\n[6/7] Deploying RayanChainDAO contract...");
    const dao = await ethers.deployContract("RayanChainDAO", [
        accControlAddress,
        stakingAddress,
        financeAddress,
        votingPeriodInSeconds,
        quorumPercentage,
        approvalThreshold
    ]);
    await dao.waitForDeployment();
    const daoAddress = await dao.getAddress();
    console.log("✅ RayanChainDAO deployed to:", daoAddress);

    // 7. Final Configurations
    console.log("\n[7/7] Performing final configurations...");
    
    process.stdout.write("   - Setting DAO address in Finance contract...");
    await (await finance.setDaoAddress(daoAddress)).wait();
    process.stdout.write(" Done\n");

    process.stdout.write("   - Transferring ownership of Staking contract to the DAO...");
    await (await staking.transferOwnership(daoAddress)).wait();
    process.stdout.write(" Done\n");

    // --- Role Assignments ---
    const DAO_MEMBER_ROLE = await accControl.DAO_MEMBER_ROLE();
    const AI_ORACLE_ROLE = await accControl.AI_ORACLE_ROLE();
    
    process.stdout.write("   - Granting DAO member role to deployer...");
    await (await accControl.grantRole(DAO_MEMBER_ROLE, deployer.address)).wait();
    process.stdout.write(" Done\n");
    
    // Grant AI_ORACLE_ROLE to the Admin (Deployer)
    process.stdout.write(`   - Granting AI_ORACLE_ROLE to Admin Address: ${aiOracleAddress}...`);
    await (await accControl.grantRole(AI_ORACLE_ROLE, aiOracleAddress)).wait();
    process.stdout.write(" Done\n");


    // Register all addresses in DAORegistry
    console.log("   - Registering contract addresses in DAORegistry address book...");
    const KEY_DAO = ethers.id("RAYAN_CHAIN_DAO");
    const KEY_TOKEN = ethers.id("RAYAN_CHAIN_TOKEN");
    const KEY_FINANCE = ethers.id("FINANCE");
    const KEY_STAKING = ethers.id("STAKING");
    const KEY_ACC = ethers.id("ACC_CONTROL");
    const KEY_USER_PROFILE = ethers.id("USER_PROFILE");
    await (await registry.setAddress(KEY_DAO, daoAddress)).wait();
    await (await registry.setAddress(KEY_TOKEN, tokenAddress)).wait();
    await (await registry.setAddress(KEY_FINANCE, financeAddress)).wait();
    await (await registry.setAddress(KEY_STAKING, stakingAddress)).wait();
    await (await registry.setAddress(KEY_ACC, accControlAddress)).wait();
    await (await registry.setAddress(KEY_USER_PROFILE, userProfileAddress)).wait();
    console.log("   - Registry updated. Done\n");
    
    // --- AUTOMATIC ENV CONFIGURATION ---
    console.log("   - Starting automatic AI Oracle ENV setup...");
    
    // 1. Read the DAO ABI from the artifact file
    const daoArtifactPath = path.resolve(__dirname, '..', 'artifacts', 'src', 'contracts', 'RayanChainDAO.sol', 'RayanChainDAO.json');
    const daoArtifact = JSON.parse(fs.readFileSync(daoArtifactPath, 'utf8'));
    // We only need the 'abi' array, and we must escape quotes for the .env value
    const daoAbiJson = JSON.stringify(daoArtifact.abi).replace(/"/g, '\\"'); 
    
    // 2. Inject AI Oracle Private Key (Using Admin's Private Key)
    if (adminPrivateKey) {
        // We use the same private key as the admin since the role was granted to the admin's address
        updateEnvFile('AI_ORACLE_PRIVATE_KEY', adminPrivateKey); 
    }
    
    // 3. Inject DAO ABI
    updateEnvFile('RAYAN_CHAIN_DAO_ABI', `"${daoAbiJson}"`);
    
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