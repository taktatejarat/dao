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

    struct Investment {
        address recipient;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint8 milestoneCount;
        uint8 currentMilestone;
        bool isActive;
    }
    mapping(uint256 => Investment) public investments;


    // --- Initializer ---
    function initialize(address _initialOwner, address _tokenAddress, uint256 _platformFeeBps, address _accControlAddress) public initializer {
        __Ownable_init(_initialOwner);
        __ReentrancyGuard_init();

        require(_tokenAddress != address(0), "Token cannot be zero address");
        require(_platformFeeBps <= 1000, "Fee cannot exceed 10%");
        
        token = IERC20(_tokenAddress);
        platformFeeBps = _platformFeeBps;
        accControl = AccControl(_accControlAddress);
    }

    // --- UUPS Upgrade Authorization ---
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Modifiers ---
    modifier onlyExecutor() {
        require(accControl.hasRole(accControl.EXECUTOR_ROLE(), msg.sender), "Finance: Must be Executor Role");
        _;
    }

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    // --- Core Investment Logic ---

    /**
     * @notice Registers a new investment when a proposal passes. Called by the main DAO contract (via Timelock).
     */
    function registerInvestment(uint256 _proposalId, address _recipient, uint256 _totalAmount, uint8 _milestoneCount) external override onlyExecutor { // ✅ CHANGE: Replaced onlyOwner with onlyExecutor
        require(_recipient != address(0), "Recipient cannot be zero address");
        require(_totalAmount > 0, "Total amount must be greater than zero");
        require(_milestoneCount > 0, "Must have at least one milestone");
        require(!investments[_proposalId].isActive, "Investment for this proposal already exists");

        investments[_proposalId] = Investment({
            recipient: _recipient,
            totalAmount: _totalAmount,
            releasedAmount: 0,
            milestoneCount: _milestoneCount,
            currentMilestone: 0,
            isActive: true
        });

        emit InvestmentRegistered(_proposalId, _recipient, _totalAmount, _milestoneCount);
    }

    /**
     * @notice Releases the funds for the next milestone of a project. Called by the main DAO contract (via Timelock).
     */
    function releaseNextMilestone(uint256 _proposalId) external nonReentrant onlyExecutor { // ✅ CHANGE: Replaced onlyOwner with onlyExecutor
        Investment storage investment = investments[_proposalId];
        require(investment.isActive, "Investment is not active");
        require(investment.currentMilestone < investment.milestoneCount, "All milestones have been released");

        uint256 milestoneAmount = investment.totalAmount / investment.milestoneCount;
        // Note: A more complex implementation could handle potential remainder dust from division.

        uint256 feeAmount = (milestoneAmount * platformFeeBps) / 10000;
        uint256 amountToRecipient = milestoneAmount - feeAmount;

        require(token.balanceOf(address(this)) >= milestoneAmount, "Finance: Insufficient funds for this milestone");

        if (feeAmount > 0) {
            emit PlatformFeeTaken(_proposalId, feeAmount);
        }
        
        bool success = token.transfer(investment.recipient, amountToRecipient);
        require(success, "Finance: Token transfer to recipient failed");

        investment.releasedAmount += milestoneAmount;
        investment.currentMilestone++;

        if (investment.currentMilestone == investment.milestoneCount) {
            investment.isActive = false;
        }

        emit MilestoneReleased(_proposalId, amountToRecipient, investment.currentMilestone);
    }

 
    /**
     * @notice This function is deprecated for new investments but is kept for IFinance compatibility.
     * Use releaseNextMilestone for new, structured investments.
     */
    function releaseFunds(address payable, uint256) external view override onlyOwner { // Keep onlyOwner for access control to deprecated function
        revert("Finance: This function is deprecated. Use releaseNextMilestone instead.");
    }

    /**
     * @notice Withdraws native currency from the treasury. Called by the DAO (via Timelock) for operational purposes.
     */
    function withdraw(address payable to, uint256 amount) external override onlyExecutor nonReentrant { // ✅ CHANGE: Replaced onlyOwner with onlyExecutor
        require(address(this).balance >= amount, "Finance: Insufficient native balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Finance: Native currency transfer failed");
        emit NativeFundsWithdrawn(to, amount);
    }

    /**
     * @notice Withdraws RYC tokens from the treasury. Called by the DAO (via Timelock) for operational purposes.
     */
    function withdrawTokens(address to, uint256 amount) external override onlyExecutor nonReentrant { // ✅ CHANGE: Replaced onlyOwner with onlyExecutor
        require(token.balanceOf(address(this)) >= amount, "Finance: Insufficient RYC funds");
        bool success = token.transfer(to, amount);
        require(success, "Finance: RYC token transfer failed");
        emit TokenFundsWithdrawn(to, amount);
    }

    // --- Configuration Functions ---

    /**
     * @notice Sets the DAO contract address. Can only be called by the current owner.
     * @dev This remains onlyOwner since changing the DAO address is a highly sensitive admin function 
     *      that will be executed by the Timelock (which will be the owner).
     */
    function setDaoAddress(address _daoAddress) external override onlyOwner { 
        require(_daoAddress != address(0), "Finance: DAO address cannot be zero");
        daoAddress = _daoAddress;
        emit DaoAddressSet(_daoAddress);
    }
}