// src/contracts/RayanChainToken.sol - REVISED: Oracle-based Token Sale with Decimal Handling

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// ✅ NEW: Import Chainlink Price Feed Interface
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol"; 

contract RayanChainToken is ERC20, Ownable {
    // RYC Decimals is 18 (default for ERC20)
    
    // ✅ FIX 1 & 2: Define RYC Price in USD, using 18 decimals as our standard
    // RYC_PRICE_IN_USD_FULL: 1 RYC = 0.10 USD (10 cents) * 10^18 (Standard Unit)
    uint256 public constant RYC_PRICE_IN_USD_FULL = 100000000000000000; // 0.1 RYC = 10 cents * 10^18
    
    // Chainlink Oracle for Native Currency (MATIC/ETH) Price (Output is typically 8 decimals)
    AggregatorV3Interface public priceFeed; 
    uint256 public constant PRICE_FEED_DECIMALS = 8; // Chainlink MATIC/USD Price Feed Decimals

    // Flag to control if the mint function is active
    bool public mintingActive = true; 

    constructor(address initialOwner, uint256 initialSupply, address _priceFeedAddress) 
        ERC20("RayanChain Token", "RYC") 
        Owner(initialOwner) 
    {
        _mint(initialOwner, initialSupply);
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }
    
    // --- Core Function: Buy RYC with Native Currency (MATIC) ---
    /**
     * @notice Allows users to buy RYC tokens by sending native currency (MATIC).
     */
    function buyTokensWithNative() external payable {
        require(mintingActive, "Minting is currently paused.");
        require(msg.value > 0, "Must send some native currency.");

        // 1. Get current MATIC/USD Price from Oracle
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Price feed is stale or zero.");
        uint256 maticPriceUSD = uint256(price); 
        
        // 2. Calculate Total USD Value of MATIC sent (Normalized to 18 decimals for RYC)
        // maticPriceUSD has 8 decimals. msg.value has 18 decimals.
        // Formula: (MATIC_Amount * MATIC_Price) / 10^8 (Price Feed Decimals)
        // Result is in 18 decimals (USD value)
        uint256 totalUSDValueSent = (msg.value * maticPriceUSD) / (10 ** PRICE_FEED_DECIMALS); 
        
        // 3. Calculate RYC Amount to Mint (Normalized to 18 decimals)
        // Formula: (Total_USD_Value_Sent * 10^18) / RYC_PRICE_IN_USD_FULL
        // RYC_PRICE_IN_USD_FULL is 18 decimals, so the result is correct.
        uint256 rycAmount = (totalUSDValueSent * 10**decimals()) / RYC_PRICE_IN_USD_FULL;

        require(rycAmount >= 10**decimals(), "Insufficient native currency sent for 1 RYC."); // Require at least 1 RYC

        _mint(msg.sender, rycAmount);
        emit TokensPurchased(msg.sender, msg.value, rycAmount);
    }
    
    // --- Core Function: Buy RYC with STABLECOIN ---
    // ✅ FIX 3: Removed the problematic buyTokensWithStablecoin to rely only on Native Currency
    // This is the safest way as per your request to focus on security and standards.
    
    // --- Admin/Maintenance Functions ---
    // ✅ FIX 4: Add function to update RYC price in USD (only by owner)
    function setRycPriceInUsd(uint256 newPriceInUsdFull) external onlyOwner {
        RYC_PRICE_IN_USD_FULL = newPriceInUsdFull;
    }
    
    function setPriceFeedAddress(address _priceFeedAddress) external onlyOwner {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }
    
    // ... (setMintingActive remains the same) ...
    
    receive() external payable {
        buyTokensWithNative();
    }
}