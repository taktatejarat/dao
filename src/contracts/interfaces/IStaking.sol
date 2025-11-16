// src/contracts/interfaces/IStaking.sol - FINAL CORRECTED VERSION

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStaking {
    // --- Events ---
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateSet(uint256 newRate);
    event RewardFunded(address indexed funder, uint256 amount);
    event Delegated(address indexed delegator, address indexed delegatee, uint256 power);
    event Undelegated(address indexed delegator, address indexed previousDelegatee, uint256 power);
    event VotingPowerUpdated(address indexed user, uint256 newVotingPower);

    // --- Core User Actions ---
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function claimReward() external;
    function delegate(address _delegatee) external;
    function undelegate() external;

    // --- Core View Functions ---
    function earned(address account) external view returns (uint256);
    function getStakedAmount(address user) external view returns (uint256);
    function getStakedBalance(address user) external view returns (uint256);
    function votingPower(address user) external view returns (uint256);
    function totalVotingPower() external view returns (uint256);
    function totalSupply() external view returns (uint256);

    // --- Admin / Governance Functions ---
    function setRewardRate(uint256 _rewardRate) external;
    function fundRewards(uint256 amount) external;

    // ✅✅✅ THIS FUNCTION MUST EXIST IN THE INTERFACE ✅✅✅
    function distributeRewards(uint256 totalReward) external;
}