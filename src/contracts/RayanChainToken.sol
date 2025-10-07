// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RayanChainToken is ERC20, Ownable {
    constructor(address initialOwner, uint256 initialSupply) ERC20("RayanChain Token", "RYC") Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);
    }
}
