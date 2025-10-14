// src/contracts/RayanChainToken.sol - FINAL, ROBUST VERSION using Internal Function Pattern

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RayanChainToken is ERC20, Ownable {
    uint256 public constant RYC_PER_NATIVE = 10000; 

    bool public mintingActive = true; 

    constructor(address initialOwner, uint256 initialSupply) 
        ERC20("RayanChain Token", "RYC") 
        Ownable(initialOwner) 
    {
        _mint(initialOwner, initialSupply);
    }
    
    // ✅ FINAL FIX 1: Core logic moved to an internal function
    /**
     * @notice Internal logic to handle the minting of RYC for native currency.
     */
    function _buyTokensLogic() internal {
        require(mintingActive, "Minting is currently paused.");
        require(msg.value > 0, "Must send some native currency.");

        uint256 rycAmount = (msg.value * RYC_PER_NATIVE) / 1 ether;

        require(rycAmount > 0, "Insufficient native currency sent for even 1 RYC.");

        _mint(msg.sender, rycAmount);
        emit TokensPurchased(msg.sender, msg.value, rycAmount);
    }
    
    // --- Public Facing Functions ---
    /**
     * @notice Allows users to explicitly buy RYC tokens by sending native currency.
     */
    function buyTokensWithNative() external payable {
        _buyTokensLogic();
    }
    
    // --- Admin/Maintenance Functions ---
    function setMintingActive(bool _active) external onlyOwner {
        mintingActive = _active;
    }
    
    // --- Events ---
    event TokensPurchased(address indexed buyer, uint256 nativeAmount, uint256 rycAmount);

    // ✅ FINAL FIX 2: receive() now calls the internal function, which is always visible.
    /**
     * @notice Fallback function to accept native currency for token purchases.
     */
    receive() external payable {
        _buyTokensLogic();
    }
}