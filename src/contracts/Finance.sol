// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IFinance.sol";

/**
 * @title Finance Contract (Treasury) - Professional Version
 * @dev Manages DAO funds with support for milestone-based investments and platform fees.
 * This contract acts as the intelligent vault for a VC DAO.
 */
contract Finance is IFinance, Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    address public daoAddress;

    // Platform fee in basis points (e.g., 250 = 2.5%)
    uint256 public platformFeeBps; // Bps = Basis Points. 1% = 100 Bps.

    // Struct to hold all details of an investment tied to a proposal
    struct Investment {
        address recipient;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint8 milestoneCount;
        uint8 currentMilestone;
        bool isActive;
    }

    // Mapping from proposal ID to its investment details
    mapping(uint256 => Investment) public investments;

    constructor(address _initialOwner, address _tokenAddress, uint256 _platformFeeBps) Ownable(_initialOwner) {
        require(_initialOwner != address(0), "Owner cannot be zero address");
        require(_tokenAddress != address(0), "Token cannot be zero address");
        require(_platformFeeBps <= 1000, "Fee cannot exceed 10%"); // Safety check: max 10% fee
        token = IERC20(_tokenAddress);
        platformFeeBps = _platformFeeBps;
    }

    /**
     * @dev Allows anyone to deposit native currency (e.g., ETH, MATIC) into the treasury.
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    // --- Core Investment Logic ---

    /**
     * @notice Registers a new investment when a proposal passes. Called by the main DAO contract.
     */
    function registerInvestment(uint256 _proposalId, address _recipient, uint256 _totalAmount, uint8 _milestoneCount) external override onlyOwner {
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
     * @notice Releases the funds for the next milestone of a project. Called by the main DAO contract.
     */
    function releaseNextMilestone(uint256 _proposalId) external nonReentrant onlyOwner {
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

    // --- Functions from IFinance (for compatibility and general treasury management) ---

    /**
     * @notice This function is deprecated for new investments but is kept for IFinance compatibility.
     * Use releaseNextMilestone for new, structured investments.
     */
    function releaseFunds(address payable, uint256) external view override onlyOwner {
    revert("Finance: This function is deprecated. Use releaseNextMilestone instead.");
    }

    /**
     * @notice Withdraws native currency from the treasury. Called by the DAO for operational purposes.
     */
    function withdraw(address payable to, uint256 amount) external override onlyOwner nonReentrant {
        require(address(this).balance >= amount, "Finance: Insufficient native balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Finance: Native currency transfer failed");
        emit NativeFundsWithdrawn(to, amount);
    }

    /**
     * @notice Withdraws RYC tokens from the treasury. Called by the DAO for operational purposes.
     */
    function withdrawTokens(address to, uint256 amount) external override onlyOwner nonReentrant {
        require(token.balanceOf(address(this)) >= amount, "Finance: Insufficient RYC funds");
        bool success = token.transfer(to, amount);
        require(success, "Finance: RYC token transfer failed");
        emit TokenFundsWithdrawn(to, amount);
    }

    // --- Configuration Functions ---

    /**
     * @notice Sets the DAO contract address. Can only be called by the current owner.
     */
    function setDaoAddress(address _daoAddress) external override onlyOwner {
        require(_daoAddress != address(0), "Finance: DAO address cannot be zero");
        daoAddress = _daoAddress;
        emit DaoAddressSet(_daoAddress);
    }
}