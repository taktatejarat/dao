// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Access Control Contract
 * @dev Manages roles and permissions for the entire DAO-VC platform.
 */
contract AccControl is AccessControl {

    /**
     * @dev Constructor that grants the deployer the default admin role.
     */
    constructor(address initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
    }
    
    function VALIDATOR_ROLE() public pure returns (bytes32) {
        return keccak256("VALIDATOR_ROLE");
    }

    function AI_ORACLE_ROLE() public pure returns (bytes32) {
        return keccak256("AI_ORACLE_ROLE");
    }

    function DAO_MEMBER_ROLE() public pure returns (bytes32) {
        return keccak256("DAO_MEMBER_ROLE");
    }
}
