// src/contracts/UserProfile.sol - نسخه نهایی و قابل ارتقاء (UPGRADEABLE)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


contract UserProfile is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    mapping(address => string) public metadataURIs;
    event ProfileUpdated(address indexed user, string newURI);

    // --- Initializer ---
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    // --- UUPS Upgrade Authorization ---
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setProfileURI(string calldata uri) external {
        metadataURIs[msg.sender] = uri;
        emit ProfileUpdated(msg.sender, uri);
    }

    function setProfileURIFor(address user, string calldata uri) external onlyOwner {
        metadataURIs[user] = uri;
        emit ProfileUpdated(user, uri);
    }
}
