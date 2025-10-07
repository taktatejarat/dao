// src/contracts/Staking.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IStaking.sol";

contract Staking is IStaking, Ownable, ReentrancyGuard {
    IERC20 public immutable rycToken;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances; // Staked amounts
    
    // ✅ NEW: Delegation Mappings
    mapping(address => address) public delegates; // user => delegatee
    mapping(address => uint256) public delegatedPower; // delegatee => total power delegated to them

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

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function stake(uint256 amount) external override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply += amount;
        
        // ❌ CORRECTION: Must adjust delegated power for the previous delegatee before updating balances
        address currentDelegatee = delegates[msg.sender];
        if (currentDelegatee != address(0)) {
            // Remove previous staked amount from delegated power
            delegatedPower[currentDelegatee] -= _balances[msg.sender];
        }
        
        _balances[msg.sender] += amount;
        rycToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
        
        // Update delegated power after the balance is updated
        if (currentDelegatee != address(0)) {
            delegatedPower[currentDelegatee] += _balances[msg.sender];
            emit Delegated(msg.sender, currentDelegatee, _balances[msg.sender]); // Emit update
        }
    }

    function unstake(uint256 amount) external override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        require(_balances[msg.sender] >= amount, "Unstake amount exceeds balance");

        // ✅ NEW: Adjust delegated power for the current delegatee
        address currentDelegatee = delegates[msg.sender];
        if (currentDelegatee != address(0)) {
            delegatedPower[currentDelegatee] -= amount;
        }
        
        _totalSupply -= amount;
        _balances[msg.sender] -= amount;
        rycToken.transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }
    
    // --- Delegation Functions (dPoS) ---
    
    /**
     * @notice Delegates the user's entire staked voting power to another address.
     * @param _delegatee The address to delegate the power to.
     */
    function delegate(address _delegatee) external nonReentrant updateReward(msg.sender) {
        require(_delegatee != msg.sender, "Cannot delegate to yourself");
        uint256 stakedAmount = _balances[msg.sender];
        require(stakedAmount > 0, "Must have staked tokens to delegate");
        
        address currentDelegatee = delegates[msg.sender];
        
        // If already delegated, undelegate first
        if (currentDelegatee != address(0) && currentDelegatee != _delegatee) {
            delegatedPower[currentDelegatee] -= stakedAmount;
            emit Undelegated(msg.sender, currentDelegatee, stakedAmount);
        }
        
        // Delegate to the new address
        delegates[msg.sender] = _delegatee;
        delegatedPower[_delegatee] += stakedAmount;
        emit Delegated(msg.sender, _delegatee, stakedAmount);
    }

    /**
     * @notice Removes the delegation. The power returns to the delegator (self-delegation).
     */
    function undelegate() external nonReentrant updateReward(msg.sender) {
        address currentDelegatee = delegates[msg.sender];
        require(currentDelegatee != address(0), "No active delegation");

        uint256 stakedAmount = _balances[msg.sender];
        
        delegatedPower[currentDelegatee] -= stakedAmount;
        delegates[msg.sender] = address(0);
        emit Undelegated(msg.sender, currentDelegatee, stakedAmount);
    }

    /**
     * @notice Returns the voting power of an address. 
     * If the user is a delegatee, it returns their own stake PLUS the total power delegated to them.
     * If the user is a delegator, it returns 0.
     * If the user is neither, it returns their own stake.
     * This power is then multiplied by PoP score in RayanChainDAO.
     */
    function getStakedAmount(address user) external view override returns (uint256) {
        // If the user has delegated, their own power is zero for voting purposes.
        if (delegates[user] != address(0) && delegates[user] != user) {
            return 0; // Delegated power is counted for the delegatee
        }
        
        // Power = own staked balance + delegated power (if they are a delegatee)
        return _balances[user] + delegatedPower[user];
    }
    
    // --- Other functions remain unchanged ---
    function claimReward() external override nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rycToken.transfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        return rewardPerTokenStored + (timeElapsed * rewardRate * 1e18) / _totalSupply;
    }

    function earned(address account) public view override returns (uint256) {
        uint256 userBalance = _balances[account];
        return userBalance * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18 + rewards[account];
    }
    
    function setRewardRate(uint256 _rewardRate) external override onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
        emit RewardRateSet(_rewardRate);
    }

    function fundRewards(uint256 amount) external override {
        rycToken.transferFrom(msg.sender, address(this), amount);
        emit RewardFunded(msg.sender, amount);
    }
    
    function distributeRewards(uint256) external pure override {
        revert("distributeRewards is deprecated. Use setRewardRate and fundRewards instead.");
    }
}