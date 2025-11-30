// src/contracts/Finance.sol - نسخه نهایی و قابل ارتقاء (UPGRADEABLE)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IFinance.sol";
import "./permission/AccControl.sol";


contract Finance is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable, IFinance {
    IERC20 public token;
    address public daoAddress;
    AccControl public accControl;
    
    // --- SaaS Revenue Model Config ---
    address public protocolWallet; 
    address public clientWallet;
    
    //تعریف متغیرهای وضعیت (State Variables) به جای constant
    uint256 public protocolFeeBps; 
    uint256 public clientFeeBps;

    struct Investment {
        address recipient;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint8 milestoneCount;
        uint8 currentMilestone;
        bool isActive;
    }
    mapping(uint256 => Investment) public investments;
    mapping(uint256 => mapping(address => uint256)) public investorBalances;

    event FeesDistributed(uint256 proposalId, uint256 protocolFee, uint256 clientFee);
    event InvestmentDeposited(uint256 indexed proposalId, address indexed investor, uint256 amount);
    event InvestmentRefunded(uint256 indexed proposalId, address indexed investor, uint256 amount);

    function initialize(
        address _initialOwner, 
        address _tokenAddress, 
        address _accControlAddress,
        address _protocolWallet,
        address _clientWallet
    ) public initializer {
        __Ownable_init(_initialOwner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        require(_tokenAddress != address(0), "Zero address");
        token = IERC20(_tokenAddress);
        accControl = AccControl(_accControlAddress);
        
        protocolWallet = _protocolWallet;
        clientWallet = _clientWallet;
        
        // ✅ مقداردهی اولیه متغیرها
        protocolFeeBps = 100; // 1%
        clientFeeBps = 400;   // 4%
    }

     function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier onlyExecutor() {
        require(accControl.hasRole(accControl.EXECUTOR_ROLE(), msg.sender) || msg.sender == daoAddress, "Finance: Unauthorized");
        _;
    }

    // ✅ تابع تنظیم مجدد کارمزدها
    function setFeeConfiguration(uint256 _protocolFeeBps, uint256 _clientFeeBps) external onlyOwner {
        require(_protocolFeeBps + _clientFeeBps <= 1000, "Total fee cannot exceed 10%");
        protocolFeeBps = _protocolFeeBps;
        clientFeeBps = _clientFeeBps;
    }

    // --- Investment Flow ---
    function depositInvestment(uint256 _proposalId, address _investor, uint256 _amount) external onlyExecutor nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        bool success = token.transferFrom(_investor, address(this), _amount);
        require(success, "Transfer failed");
        
        investorBalances[_proposalId][_investor] += _amount;
        emit InvestmentDeposited(_proposalId, _investor, _amount);
    }

    function finalizeInvestment(uint256 _proposalId, address _recipient, uint256 _totalRaised, uint8 _milestoneCount) external onlyExecutor nonReentrant {
        require(!investments[_proposalId].isActive, "Already active");
        
        // ✅ استفاده از متغیرهای وضعیت تعریف شده
        uint256 pFee = (_totalRaised * protocolFeeBps) / 10000;
        uint256 cFee = (_totalRaised * clientFeeBps) / 10000;
        uint256 projectAmount = _totalRaised - pFee - cFee;

        if (pFee > 0) token.transfer(protocolWallet, pFee);
        if (cFee > 0) token.transfer(clientWallet, cFee);
        
        emit FeesDistributed(_proposalId, pFee, cFee);

        investments[_proposalId] = Investment({
            recipient: _recipient,
            totalAmount: projectAmount,
            releasedAmount: 0,
            milestoneCount: _milestoneCount,
            currentMilestone: 0,
            isActive: true
        });

        emit InvestmentRegistered(_proposalId, _recipient, projectAmount, _milestoneCount);
    }

    function refundInvestment(uint256 _proposalId, address _investor) external onlyExecutor nonReentrant {
        uint256 amount = investorBalances[_proposalId][_investor];
        require(amount > 0, "No balance to refund");
        
        investorBalances[_proposalId][_investor] = 0;
        bool success = token.transfer(_investor, amount);
        require(success, "Refund transfer failed");
        
        emit InvestmentRefunded(_proposalId, _investor, amount);
    }

    function releaseNextMilestone(uint256 _proposalId) external nonReentrant onlyExecutor {
        Investment storage investment = investments[_proposalId];
        require(investment.isActive, "Investment not active");
        require(investment.currentMilestone < investment.milestoneCount, "All milestones released");

        uint256 remainingMilestones = investment.milestoneCount - investment.currentMilestone;
        uint256 currentBalance = investment.totalAmount - investment.releasedAmount;
        uint256 amountToRelease = currentBalance / remainingMilestones;

        require(token.balanceOf(address(this)) >= amountToRelease, "Insufficient funds");
        
        bool success = token.transfer(investment.recipient, amountToRelease);
        require(success, "Transfer failed");

        investment.releasedAmount += amountToRelease;
        investment.currentMilestone++;

        if (investment.currentMilestone == investment.milestoneCount) {
            investment.isActive = false;
        }

        emit MilestoneReleased(_proposalId, amountToRelease, investment.currentMilestone);
    }

    // ✅ FIX: اضافه کردن pure برای رفع هشدار کامپایلر
    function registerInvestment(uint256, address, uint256, uint8) external override pure {
        revert("Use finalizeInvestment instead");
    }
    
    function releaseFunds(address payable, uint256) external view override onlyOwner {
        revert("Deprecated");
    }

    function withdraw(address payable to, uint256 amount) external override onlyExecutor nonReentrant {
        (bool success, ) = to.call{value: amount}("");
        require(success, "Failed");
        emit NativeFundsWithdrawn(to, amount);
    }

    function withdrawTokens(address to, uint256 amount) external override onlyExecutor nonReentrant {
        token.transfer(to, amount);
        emit TokenFundsWithdrawn(to, amount);
    }

    function setDaoAddress(address _daoAddress) external override onlyOwner {
        daoAddress = _daoAddress;
        emit DaoAddressSet(_daoAddress);
    }
    
    function setFeeWallets(address _protocol, address _client) external onlyOwner {
        protocolWallet = _protocol;
        clientWallet = _client;
    }
}