// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library CustomHash {
    function keccak256WithSalt(bytes memory data, bytes32 salt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(data, salt));
    }
}