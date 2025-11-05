// src/contracts/RayanChainToken.sol - نسخه نهایی و قابل ارتقاء (UPGRADEABLE)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";


contract RayanChainToken is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    AggregatorV3Interface public priceFeed;
    uint256 public rycAmountPerUsd;
    bool public mintingActive;

    // --- Initializer ---
    function initialize(address initialOwner, uint256 initialSupply) public initializer {
        __ERC20_init("RayanChain Token", "RYC");
        __Ownable_init(initialOwner);

        mintingActive = true;
        _mint(initialOwner, initialSupply);
    }

    // --- UUPS Upgrade Authorization ---
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

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
    
    function getRycPriceInUsd() external view returns (uint256) {
        require(address(priceFeed) != address(0), "Price feed not set");
        require(rycAmountPerUsd > 0, "RYC rate must be set");

        // The price of 1 USD in RYC is `rycAmountPerUsd` (with 18 decimals)
        // So, the price of 1 RYC in USD is (1 / rycAmountPerUsd)
        // To avoid division with decimals in Solidity, we do:
        // (1 * 10^18 * 10^18) / rycAmountPerUsd
        // We use 10**36 to maintain precision for the final USD value with 18 decimals.
        return (10**36) / rycAmountPerUsd;
    }

    event TokensPurchased(address indexed buyer, uint256 nativeAmount, uint256 rycAmount);
        
}