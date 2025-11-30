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
    uint256 public platformFeeBps;

    // --- SaaS Revenue Model Config ---
    address public protocolWallet; // کیف پول سازنده پلتفرم (1%)
    address public clientWallet;   // کیف پول شرکت VC (4%)
    uint256 public constant PROTOCOL_FEE_BPS = 100; // 1%
    uint256 public constant CLIENT_FEE_BPS = 400;   // 4%


    struct Investment {
        address recipient;
        uint256 totalAmount; // مبلغ نهایی جمع شده (بعد از کسر کارمزد)
        uint256 releasedAmount;
        uint8 milestoneCount;
        uint8 currentMilestone;
        bool isActive;
    }
    mapping(uint256 => Investment) public investments;


   // نگهداری موجودی سرمایه‌گذاران برای هر پروپوزال (برای Refund)
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
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier onlyExecutor() {
        require(accControl.hasRole(accControl.EXECUTOR_ROLE(), msg.sender) || msg.sender == daoAddress, "Finance: Unauthorized");
        _;
    }

    // --- Investment Flow ---

    // 1. واریز سرمایه توسط کاربر (فراخوانی توسط DAO)
    function depositInvestment(uint256 _proposalId, address _investor, uint256 _amount) external onlyExecutor nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        // انتقال توکن از کاربر به این قرارداد (باید قبلا Approve شده باشد)
        bool success = token.transferFrom(_investor, address(this), _amount);
        require(success, "Transfer failed");
        
        investorBalances[_proposalId][_investor] += _amount;
        emit InvestmentDeposited(_proposalId, _investor, _amount);
    }

    // 2. نهایی‌سازی سرمایه‌گذاری (کسر کارمزدها و قفل کردن بودجه)
    function finalizeInvestment(uint256 _proposalId, address _recipient, uint256 _totalRaised, uint8 _milestoneCount) external onlyExecutor nonReentrant {
        require(!investments[_proposalId].isActive, "Already active");
        
        // محاسبه کارمزدها
        uint256 pFee = (_totalRaised * PROTOCOL_FEE_BPS) / 10000;
        uint256 cFee = (_totalRaised * CLIENT_FEE_BPS) / 10000;
        uint256 projectAmount = _totalRaised - pFee - cFee;

        // واریز کارمزدها
        if (pFee > 0) token.transfer(protocolWallet, pFee);
        if (cFee > 0) token.transfer(clientWallet, cFee);
        
        emit FeesDistributed(_proposalId, pFee, cFee);

        // ثبت پروژه برای مایل‌ستون‌ها
        investments[_proposalId] = Investment({
            recipient: _recipient,
            totalAmount: projectAmount, // مبلغ خالص برای پروژه
            releasedAmount: 0,
            milestoneCount: _milestoneCount,
            currentMilestone: 0,
            isActive: true
        });

        emit InvestmentRegistered(_proposalId, _recipient, projectAmount, _milestoneCount);
    }

    // 3. عودت وجه (در صورت شکست در جذب سرمایه)
    function refundInvestment(uint256 _proposalId, address _investor) external onlyExecutor nonReentrant {
        uint256 amount = investorBalances[_proposalId][_investor];
        require(amount > 0, "No balance to refund");
        
        investorBalances[_proposalId][_investor] = 0;
        bool success = token.transfer(_investor, amount);
        require(success, "Refund transfer failed");
        
        emit InvestmentRefunded(_proposalId, _investor, amount);
    }

    // --- Milestone Release (Legacy & New Logic) ---
    function releaseNextMilestone(uint256 _proposalId) external nonReentrant onlyExecutor {
        Investment storage investment = investments[_proposalId];
        require(investment.isActive, "Investment not active");
        require(investment.currentMilestone < investment.milestoneCount, "All milestones released");

        // محاسبه مبلغ این فاز
        uint256 remainingMilestones = investment.milestoneCount - investment.currentMilestone;
        // فرمول ایمن: باقیمانده بودجه تقسیم بر باقیمانده مایل‌ستون‌ها (برای جلوگیری از Dust)
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

    // برای سازگاری با اینترفیس - اضافه کردن 
    function registerInvestment(uint256 _proposalId,address _recipient,uint256 _totalAmount,uint8 _milestoneCount) external override {
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
    
    // توابع تنظیم کیف پول‌های کارمزد (مخصوص ادمین)
    function setFeeWallets(address _protocol, address _client) external onlyOwner {
        protocolWallet = _protocol;
        clientWallet = _client;
    }
}