// src/contracts/RayanChainToken.sol - FINAL, ROBUST VERSION with Chainlink Oracle

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract RayanChainToken is ERC20, Ownable {
    AggregatorV3Interface public priceFeed;
    // نشان می‌دهد به ازای هر 1 دلار (با 18 رقم اعشار)، چه مقدار RYC داده می‌شود
    uint256 public rycAmountPerUsd;

    bool public mintingActive = true; 

    constructor(
        address initialOwner, 
        uint256 initialSupply
    ) 
        ERC20("RayanChain Token", "RYC") 
        Ownable(initialOwner) 
    {
        _mint(initialOwner, initialSupply);
    }

    /**
     * @notice پارامترهای قیمت‌گذاری را تنظیم می‌کند. فقط یک بار توسط مالک قابل اجراست.
     */
    function initializePricing(
        address _priceFeedAddress,
        uint256 _initialRycAmountPerUsd
    ) external onlyOwner {
        require(address(priceFeed) == address(0), "Pricing is already initialized");
        require(_priceFeedAddress != address(0), "Price feed address cannot be zero");

        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        rycAmountPerUsd = _initialRycAmountPerUsd;
    }
    
    function getAmountOfTokensForNative(uint256 _nativeAmount) public view returns (uint256) {
        require(address(priceFeed) != address(0), "Price feed not set");
        (, int maticPrice, , , ) = priceFeed.latestRoundData(); // قیمت با ۸ رقم اعشار
        
        // محاسبه ارزش دلاری MATIC ارسالی (با ۱۸ رقم اعشار برای دقت)
        uint256 nativeValueInUsd = (_nativeAmount * uint256(maticPrice)) / (10**8);

        require(rycAmountPerUsd > 0, "RYC rate must be set");
        // تعداد RYC = (ارزش دلاری * تعداد RYC به ازای هر دلار) / 10**18
        uint256 rycAmount = (nativeValueInUsd * rycAmountPerUsd) / (10**18);

        return rycAmount;
    }
    
    function _buyTokensLogic() internal {
        require(mintingActive, "Minting is currently paused.");
        require(msg.value > 0, "Must send some native currency.");

        uint256 rycAmount = getAmountOfTokensForNative(msg.value);
        require(rycAmount > 0, "Insufficient native currency sent.");

        _mint(msg.sender, rycAmount);
        emit TokensPurchased(msg.sender, msg.value, rycAmount);
    }
    
    function buyTokensWithNative() external payable {
        _buyTokensLogic();
    }
    
    function setMintingActive(bool _active) external onlyOwner {
        mintingActive = _active;
    }

    function setRycAmountPerUsd(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Rate must be greater than zero");
        rycAmountPerUsd = _newRate;
    }
    
    function setPriceFeed(address _newPriceFeed) external onlyOwner {
        require(_newPriceFeed != address(0), "New price feed address cannot be zero");
        priceFeed = AggregatorV3Interface(_newPriceFeed);
    }
    
    event TokensPurchased(address indexed buyer, uint256 nativeAmount, uint256 rycAmount);

    receive() external payable {
        _buyTokensLogic();
    }
}