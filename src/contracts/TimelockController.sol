// src/contracts/TimelockController.sol
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title RayanChainTimelockController
 * @dev This contract is a standard OpenZeppelin TimelockController.
 *      No custom logic is added here to ensure maximum security and compatibility.
 *      Custom roles (like PAUSER) will be handled by the RayanChainDAO contract.
 */
contract RayanChainTimelockController is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}