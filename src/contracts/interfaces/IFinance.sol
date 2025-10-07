// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IFinance Interface
 * @dev Defines the external functions and events for the Finance (Treasury) contract.
 * This ensures that other contracts, like the main DAO, can interact with it in a typed and secure way.
 */
interface IFinance {
    // --- Events from the original design ---
    event FundsDeposited(address indexed from, uint256 amount);
    event FundsReleased(address indexed recipient, uint256 amount);
    event NativeFundsWithdrawn(address indexed to, uint256 amount);
    event TokenFundsWithdrawn(address indexed to, uint256 amount);

    // ✅✅✅ رویدادهای جدید برای پشتیبانی از سرمایه‌گذاری فازبندی شده ✅✅✅
    event InvestmentRegistered(uint256 indexed proposalId, address indexed recipient, uint256 totalAmount, uint8 milestoneCount);
    event MilestoneReleased(uint256 indexed proposalId, uint256 amount, uint8 milestoneNumber);
    event PlatformFeeTaken(uint256 indexed proposalId, uint256 feeAmount);
    event InvestmentCancelled(uint256 indexed proposalId);
    event DaoAddressSet(address indexed newDaoAddress);

    // --- Functions from the original design ---
    function releaseFunds(address payable recipient, uint256 amount) external view;
    function withdraw(address payable to, uint256 amount) external;
    function withdrawTokens(address to, uint256 amount) external;

    // ✅✅✅ توابع جدید برای پشتیبانی از سرمایه‌گذاری فازبندی شده ✅✅✅
    function registerInvestment(uint256 _proposalId, address _recipient, uint256 _totalAmount, uint8 _milestoneCount) external;
    function releaseNextMilestone(uint256 _proposalId) external;

    // ✅✅✅ توابع جدید مدیریتی ✅✅✅
    function setDaoAddress(address _daoAddress) external;

    // ✅✅✅ توابع view برای خواندن اطلاعات از خارج قرارداد (اختیاری اما بسیار مفید) ✅✅✅
    function investments(uint256 proposalId) external view returns (
        address recipient,
        uint256 totalAmount,
        uint256 releasedAmount,
        uint8 milestoneCount,
        uint8 currentMilestone,
        bool isActive
    );

    function platformFeeBps() external view returns (uint256);

    function daoAddress() external view returns (address);
}