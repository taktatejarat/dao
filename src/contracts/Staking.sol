// src/contracts/Staking.sol - FINAL, COMPILABLE VERSION

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IStaking.sol";

contract Staking is IStaking, Ownable, ReentrancyGuard {
    IERC20 public immutable rycToken;
    uint256 private _totalStaked;
    mapping(address => uint256) private _stakedBalances;
    mapping(address => address) public delegates;
    mapping(address => uint256) public delegatedPower;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(address _tokenAddress, address _initialOwner) Ownable(_initialOwner) {
        rycToken = IERC20(_tokenAddress);
    }

    function totalSupply() external view override returns (uint256) {
        return _totalStaked;
    }

    function getStakedBalance(address account) external view returns (uint256) {
        return _stakedBalances[account];
    }
    
    function stake(uint256 amount) external override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _totalStaked += amount;
        _stakedBalances[msg.sender] += amount;
        
        address currentDelegatee = delegates[msg.sender];
        if (currentDelegatee == address(0)) {
            currentDelegatee = msg.sender;
            delegates[msg.sender] = currentDelegatee;
        }
        delegatedPower[currentDelegatee] += amount;
        
        rycToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
        emit Delegated(msg.sender, currentDelegatee, _stakedBalances[msg.sender]);
    }

    function unstake(uint256 amount) external override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        require(_stakedBalances[msg.sender] >= amount, "Unstake amount exceeds balance");

        address currentDelegatee = delegates[msg.sender];
        require(currentDelegatee != address(0), "Staking: Inconsistent delegation state");

        _totalStaked -= amount;
        _stakedBalances[msg.sender] -= amount;
        delegatedPower[currentDelegatee] -= amount;

        rycToken.transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
        emit Delegated(msg.sender, currentDelegatee, _stakedBalances[msg.sender]);
    }
    
    function delegate(address _delegatee) external override nonReentrant {
        require(_delegatee != address(0), "Cannot delegate to zero address");
        address currentDelegatee = delegates[msg.sender];
        if (currentDelegatee == address(0)) {
            currentDelegatee = msg.sender;
        }

        uint256 userStakedBalance = _stakedBalances[msg.sender];
        if (userStakedBalance > 0 && currentDelegatee != _delegatee) {
            delegatedPower[currentDelegatee] -= userStakedBalance;
            delegatedPower[_delegatee] += userStakedBalance;
        }
        delegates[msg.sender] = _delegatee;
        
        emit Delegated(msg.sender, _delegatee, userStakedBalance);
    }

    function undelegate() external override nonReentrant {
        address currentDelegatee = delegates[msg.sender];
        require(currentDelegatee != address(0) && currentDelegatee != msg.sender, "Not delegated or already self-delegated");

        uint256 userStakedBalance = _stakedBalances[msg.sender];

        delegatedPower[currentDelegatee] -= userStakedBalance;
        delegatedPower[msg.sender] += userStakedBalance;
        delegates[msg.sender] = msg.sender;

        emit Undelegated(msg.sender, currentDelegatee, userStakedBalance);
    }

    function getStakedAmount(address user) external view override returns (uint256) {
        return delegatedPower[user];
    }
    
    function claimReward() external override nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rycToken.transfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    function earned(address account) public view override returns (uint256) {
        return _stakedBalances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18 + rewards[account];
    }
    
    function setRewardRate(uint256 _rewardRate) external override onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
        emit RewardRateSet(_rewardRate);
    }

    function fundRewards(uint256 amount) external override {
        rycToken.transferFrom(msg.sender, address(this), amount);
        emit RewardFunded(msg.sender, amount);
    }

    // This function now correctly overrides the one in the interface.
    function distributeRewards(uint256) external pure override {
        revert("Staking: distributeRewards is deprecated. Use setRewardRate and fundRewards.");
    }

    function rewardPerToken() internal view returns (uint256) {
        if (_totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / _totalStaked;
    }
}