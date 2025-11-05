// src/contracts/permission/AccControl.sol - نسخه نهایی و قابل ارتقاء (UPGRADEABLE)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


contract AccControl is Initializable, AccessControlUpgradeable, UUPSUpgradeable {

    // --- Initializer ---
    function initialize(address initialOwner) public initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
    }

    // --- UUPS Upgrade Authorization ---
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
  
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