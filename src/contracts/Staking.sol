// src/contracts/Staking.sol - نسخه نهایی و قابل ارتقاء (UPGRADEABLE)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IStaking.sol";

contract Staking is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable, IStaking {
    IERC20 public rycToken;
    uint256 private _totalStaked;
    mapping(address => uint256) private _stakedBalances;
    mapping(address => address) public delegates;
    mapping(address => uint256) public delegatedPower;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) private _votingPower;
    uint256 private _totalVotingPower;
    
  // --- Initializer ---
    function initialize(address _tokenAddress, address _initialOwner) external initializer {
        __Ownable_init(_initialOwner); // تنظیم مالک اولیه
        __ReentrancyGuard_init();     // مقداردهی محافظ امنیت تراکنش
        __UUPSUpgradeable_init(); // ✅ این خط برای ارتقاءپذیری ضروری است
        
        rycToken = IERC20(_tokenAddress); // مقداردهی آدرس توکن RYC
    }
    // --- UUPS Upgrade Authorization ---
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalStaked;
    }

    function getStakedBalance(address account) external view returns (uint256) {
        return _stakedBalances[account];
    }
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Stake: amount 0");
        require(rycToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        _totalStaked += amount;
        _stakedBalances[msg.sender] += amount;

        address delegatee = delegates[msg.sender];

        // اگر user قبلا delegate نکرده (address(0)) treat as self-voting
        if (delegatee == address(0)) {
            // voting rights remain with msg.sender
            _transferVotingPower(address(0), msg.sender, amount);
        } else {
            // voting rights go to delegatee
            _transferVotingPower(address(0), delegatee, amount);
        }

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Unstake: amount 0");
        require(_stakedBalances[msg.sender] >= amount, "Unstake amount exceeds balance");

        address currentDelegatee = delegates[msg.sender]; // may be address(0) meaning self-voting

        _totalStaked -= amount;
        _stakedBalances[msg.sender] -= amount;

        address votingHolder = (currentDelegatee == address(0)) ? msg.sender : currentDelegatee;
        _transferVotingPower(votingHolder, address(0), amount); // decrease voting power of holder

        require(rycToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }
    
    function delegate(address _delegatee) external nonReentrant {
        require(_delegatee != address(0), "Cannot delegate to zero address");
        require(_delegatee != msg.sender, "Use undelegate to self");

        address previous = delegates[msg.sender];
        uint256 userStake = _stakedBalances[msg.sender];

        address prevVotingHolder = (previous == address(0)) ? msg.sender : previous;
        address newVotingHolder = _delegatee;

        // transfer user's stake voting rights from previous holder to new holder
        _transferVotingPower(prevVotingHolder, newVotingHolder, userStake);

        delegates[msg.sender] = _delegatee;
        emit Delegated(msg.sender, _delegatee, userStake);
    }

    function undelegate() external nonReentrant {
        address currentDelegatee = delegates[msg.sender];
        require(currentDelegatee != address(0) && currentDelegatee != msg.sender, "Not delegated or already self-delegated");

        uint256 userStakedBalance = _stakedBalances[msg.sender];

        // move voting rights back from delegatee to self
        _transferVotingPower(currentDelegatee, msg.sender, userStakedBalance);

        delegates[msg.sender] = address(0);

        emit Undelegated(msg.sender, currentDelegatee, userStakedBalance);
    }

    function getStakedAmount(address user) external view override returns (uint256) {
        return _stakedBalances[user];
    }

    function votingPower(address user) public view returns (uint256) {
        return _votingPower[user];
    }

    function totalVotingPower() external view returns (uint256) {
        return _totalVotingPower;
    }

    function _transferVotingPower(address from, address to, uint256 amount) internal {
        if (amount == 0 || from == to) return;

        if (from != address(0)) {
            require(_votingPower[from] >= amount, "VotingPower underflow");
            _votingPower[from] -= amount;
        } else {
            // mint to totalVotingPower only when from == 0
            _totalVotingPower += amount;
        }

        if (to != address(0)) {
            _votingPower[to] += amount;
        } else {
            // burn when to == 0
            _totalVotingPower -= amount;
        }
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