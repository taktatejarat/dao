// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract UserProfile is Ownable {
    mapping(address => string) public metadataURIs;

    event ProfileUpdated(address indexed user, string newURI);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setProfileURI(string calldata uri) external {
        metadataURIs[msg.sender] = uri;
        emit ProfileUpdated(msg.sender, uri);
    }

    function setProfileURIFor(address user, string calldata uri) external onlyOwner {
        metadataURIs[user] = uri;
        emit ProfileUpdated(user, uri);
    }
}
