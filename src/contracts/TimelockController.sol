
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title RayanChainTimelockController
 * @dev A simple extension of OpenZeppelin's TimelockController.
 * No custom logic is needed here as the base contract is robust.
 * This contract acts as the ultimate owner and executor for the DAO,
 * enforcing a time delay on all critical operations.
 */
contract RayanChainTimelockController is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}