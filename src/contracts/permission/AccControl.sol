// src/contracts/permission/AccControl.sol - اصلاح شده برای نقش‌های جدید
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Access Control Contract
 * @dev Manages roles and permissions for the entire DAO-VC platform.
 *      New roles (PAUSER, AUDITOR) added for enhanced security and compliance.
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
    
    // ✅ NEW ROLE: برای مکانیسم اضطراری (Matris: PAUSER)
    function PAUSER_ROLE() public pure returns (bytes32) {
        return keccak256("PAUSER_ROLE");
    }

    // ✅ NEW ROLE: برای ممیزی، بررسی و درخواست ریورسال (Matris: AUDITOR)
    function AUDITOR_ROLE() public pure returns (bytes32) {
        return keccak256("AUDITOR_ROLE");
    }
    
    // ✅ NEW ROLE: برای نهاد نهایی اجرای تراکنش (Timelock/Multisig)
    // این نقش برای توابعی که قبلاً onlyOwner بودند، استفاده می‌شود و فقط Timelock می‌تواند آن‌ها را فراخوانی کند.
    function EXECUTOR_ROLE() public pure returns (bytes32) {
        return keccak256("EXECUTOR_ROLE");
    }
}