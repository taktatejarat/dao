// src/contracts/RayanChainToken.sol - REVISED: Oracle-based Token Sale with Decimal Handling

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// ✅ NEW: Import Chainlink Price Feed Interface
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol"; 


contract RayanChainToken is ERC20, Ownable {
    // RYC Decimals is 18 (default for ERC20)
    
    // ✅ FIX 1: Changed from 'constant' to a regular state variable
    uint256 public RYC_PRICE_IN_USD_FULL; 
    
    AggregatorV3Interface public priceFeed; 
    uint256 public constant PRICE_FEED_DECIMALS = 8;

    bool public mintingActive = true; 


    constructor(address initialOwner, uint256 initialSupply, address _priceFeedAddress) 
        ERC20("RayanChain Token", "RYC") 
        Ownable(initialOwner) 
    {
        _mint(initialOwner, initialSupply);
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        RYC_PRICE_IN_USD_FULL = 100000000000000000;
    }
      function _mintForNative() internal {
        require(mintingActive, "Minting is currently paused.");
        require(msg.value > 0, "Must send some native currency.");

        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Price feed is stale or zero.");
        uint256 maticPriceUSD = uint256(price); 
        
        uint256 totalUSDValueSent = (msg.value * maticPriceUSD) / (10 ** PRICE_FEED_DECIMALS); 
        
        uint256 rycAmount = (totalUSDValueSent * 10**decimals()) / RYC_PRICE_IN_USD_FULL;

        require(rycAmount >= 10**decimals(), "Insufficient native currency sent for 1 RYC.");

        _mint(msg.sender, rycAmount);
        emit TokensPurchased(msg.sender, msg.value, rycAmount);
    }
    
    // --- Public Facing Function (Optional but good practice) ---
    /**
     * @notice Allows users to explicitly call the buy function.
     */
    function buyTokens() external payable {
        _mintForNative();
    }
    
    // --- Core Function: Buy RYC with Native Currency (MATIC) ---
    // ✅ FIX 2: Added 'public' visibility to ensure it's callable from fallback
    function buyTokensWithNative() public payable {
        require(mintingActive, "Minting is currently paused.");
        require(msg.value > 0, "Must send some native currency.");

        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Price feed is stale or zero.");
        uint256 maticPriceUSD = uint256(price); 
        
        uint256 totalUSDValueSent = (msg.value * maticPriceUSD) / (10 ** PRICE_FEED_DECIMALS); 
        
        uint256 rycAmount = (totalUSDValueSent * 10**decimals()) / RYC_PRICE_IN_USD_FULL;

        require(rycAmount >= 10**decimals(), "Insufficient native currency sent for 1 RYC.");

        _mint(msg.sender, rycAmount);
        emit TokensPurchased(msg.sender, msg.value, rycAmount);
    }
    
    // --- Admin/Maintenance Functions ---
    
    // ✅ FIX 1 (continued): This function now correctly modifies the state variable
    function setRycPriceInUsd(uint256 newPriceInUsdFull) external onlyOwner {
        RYC_PRICE_IN_USD_FULL = newPriceInUsdFull;
    }
    
    function setPriceFeedAddress(address _priceFeedAddress) external onlyOwner {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }
    
    function setMintingActive(bool _active) external onlyOwner {
        mintingActive = _active;
    }
    
    // --- Events ---
    event TokensPurchased(address indexed buyer, uint256 nativeAmount, uint256 rycAmount);

    // If no data is sent, receive() is called. By defining only fallback(), it handles both cases.
   receive() external payable {
        _mintForNative();
    }
    
    // ✅ FINAL FIX: fallback() is for transactions with invalid/unmatched calldata
    fallback() external payable {
        _mintForNative();
    }
}