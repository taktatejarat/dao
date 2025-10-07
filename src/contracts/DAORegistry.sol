// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DAORegistry
 * @dev A central contract to store and manage the addresses of all other contracts in the ecosystem.
 * This acts as the single source of truth for the dApp.
 */
contract DAORegistry is Ownable {
    mapping(bytes32 => address) private addresses;

    event AddressSet(bytes32 indexed key, address newAddress);

    // --- Pre-defined keys for contracts ---
    bytes32 public constant RAYAN_CHAIN_DAO = keccak256("RAYAN_CHAIN_DAO");
    bytes32 public constant RAYAN_CHAIN_TOKEN = keccak256("RAYAN_CHAIN_TOKEN");
    bytes32 public constant FINANCE = keccak256("FINANCE");
    bytes32 public constant STAKING = keccak256("STAKING");
    bytes32 public constant ACC_CONTROL = keccak256("ACC_CONTROL");
    bytes32 public constant USER_PROFILE = keccak256("USER_PROFILE");

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Sets or updates the address for a given contract key.
     * @dev Can only be called by the owner.
     * @param _key The identifier for the contract (e.g., keccak256("FINANCE")).
     * @param _address The new address of the contract.
     */
    function setAddress(bytes32 _key, address _address) external onlyOwner {
        require(_address != address(0), "Registry: Zero address is not allowed");
        addresses[_key] = _address;
        emit AddressSet(_key, _address);
    }

    /**
     * @notice Retrieves the address for a given contract key.
     * @param _key The identifier for the contract.
     * @return The stored address.
     */
    function getAddress(bytes32 _key) external view returns (address) {
        return addresses[_key];
    }
}