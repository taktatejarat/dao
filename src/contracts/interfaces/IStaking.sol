// src/contracts/interfaces/IStaking.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IStaking Interface
 * @dev Defines the external functions and events for the Staking contract.
 * This version supports a dynamic reward rate mechanism AND dPoS Delegation.
 */
interface IStaking {
    // --- Events ---
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateSet(uint256 newRate);
    event RewardFunded(address indexed funder, uint256 amount);
    event RewardDistributed(uint256 totalReward);
    
    // ✅ NEW: Events for Delegation
    event Delegated(address indexed delegator, address indexed delegatee, uint256 power);
    event Undelegated(address indexed delegator, address indexed previousDelegatee, uint256 power);

    // --- Core User Functions ---
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function claimReward() external;
    
    // ✅ NEW: Delegation Functions (dPoS)
    function delegate(address _delegatee) external;
    function undelegate() external;

    // --- View Functions ---
    // Note: getStakedAmount now returns the TOTAL VOTING POWER (Own stake + delegated power to the user)
    function earned(address account) external view returns (uint256);
    function getStakedAmount(address user) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    
    // ✅ NEW: View functions for dPoS
    function delegates(address) external view returns (address); // Reads the delegatee of a user
    function delegatedPower(address) external view returns (uint256); // Reads the total power delegated *to* a user

    // --- Admin / Governance Functions ---
    function setRewardRate(uint256 _rewardRate) external;
    function fundRewards(uint256 amount) external;
    function distributeRewards(uint256 totalReward) external;
}