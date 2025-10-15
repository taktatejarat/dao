// src/contracts/TimelockController.sol

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title RayanChainTimelockController
 * @dev The secure Timelock for the DAO-VC platform. 
 * 
 * This contract acts as the ultimate governance gate. 
 * It will own the Treasury (Finance.sol) and the DAO itself (RayanChainDAO.sol's admin role), 
 * ensuring a time-delay for all sensitive operations voted upon by the DAO.
 */
contract RayanChainTimelockController is TimelockController {
    // ⚠️ توجه: مقادیر زمان (minDelay) در زمان Deploy (استقرار) نهایی باید تنظیم شوند.
    
    // زمان تأخیر پیشنهادی: ۷۲ ساعت (۲۵۹۲۰۰ ثانیه) برای اجرای عملیات مالی
    uint256 public constant DEFAULT_MIN_DELAY = 259200; 

    // ✅ NEW ROLE: نقش PAUSER برای قابلیت اضطراری (برای Cancel کردن یک عملیات زمان‌بندی شده)
    // این نقش باید به یک Multisig اضطراری یا مجموعه ای از AUDITOR/PAUSERs اعطا شود.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // ----------------------------------------------------------------------------------
    // CONSTRUCTOR
    // ----------------------------------------------------------------------------------

    /**
     * @param initialAdmin آدرس اولیه که نقش Admin Timelock را دریافت می‌کند. (Deployer)
     * @param daoContract آدرس قرارداد RayanChainDAO.sol (این قرارداد نقش PROPOSER و EXECUTOR را دریافت می‌کند)
     * @param pausers آدرس‌هایی که می‌توانند عملیات زمان‌بندی شده را در شرایط اضطراری Cancel کنند (نقش PAUSER)
     * @param minDelay تأخیر زمانی (ثانیه).
     */
    constructor(
        address initialAdmin,
        address daoContract,
        address[] memory pausers,
        uint256 minDelay
    ) 
        // در TimelockController:
        // 1. minDelay
        // 2. proposers: {daoContract} - فقط DAO می‌تواند عملیات را زمان‌بندی کند.
        // 3. executors: {daoContract} - فقط DAO می‌تواند عملیات را اجرا کند (بعد از تأخیر).
        // 4. admin: {initialAdmin}
        TimelockController(
            minDelay,
            new address[](1), // فقط DAO PROPOSER است
            new address[](1), // فقط DAO EXECUTOR است
            initialAdmin
        )
    {
        // نقش‌ها را تنظیم می‌کنیم:

        // 1. تنظیم PROPOSER و EXECUTOR (قرارداد DAO)
        // این دو نقش در حال حاضر (در Constructor پدر) به DEPLOYER داده شده‌اند. باید به DAO منتقل شوند.
        _setupRole(PROPOSER_ROLE, daoContract);
        _setupRole(EXECUTOR_ROLE, daoContract);

        // 2. حذف PROPOSER و EXECUTOR از آدرس DEPLOYER
        // (این آدرس به عنوان Admin اصلی تعیین شده بود.)
        _revokeRole(PROPOSER_ROLE, initialAdmin);
        _revokeRole(EXECUTOR_ROLE, initialAdmin);

        // 3. تنظیم نقش PAUSER (جدید و سفارشی)
        // این نقش می‌تواند یک عملیات زمان‌بندی شده را در شرایط اضطراری متوقف کند.
        for (uint256 i = 0; i < pausers.length; i++) {
            _setupRole(PAUSER_ROLE, pausers[i]);
        }
        
        // ⚠️ گام نهایی: انتقال نقش DEFAULT_ADMIN_ROLE (مالک Timelock) به خود Timelock 
        // یا به یک Multisig دیگر که توسط DAO کنترل می‌شود.
        // این کار باید بعد از Deploy انجام شود تا تمرکز قدرت از بین برود.
        // پس از Deploy، initialAdmin باید یک فراخوانی به renounceRole() داشته باشد یا نقش را به DAO منتقل کند.
    }
    
    // ----------------------------------------------------------------------------------
    // CUSTOM FUNCTIONS
    // ----------------------------------------------------------------------------------
    
    /**
     * @dev Only PAUSER_ROLE or ADMIN_ROLE can cancel an operation.
     *      Admin is required to keep an emergency exit in case the PAUSER_ROLE is compromised.
     */
    function cancel(
        address target,
        uint256 value,
        bytes memory data,
        bytes32 predecessor,
        bytes32 salt
    ) public virtual override onlyRole(getRoleAdmin(PAUSER_ROLE)) { // ⚠️ تغییر: استفاده از PAUSER_ROLE به جای Admin
        // چک می‌کند که آیا فراخوانی توسط PAUSER_ROLE یا ADMIN_ROLE انجام شده است.
        require(hasRole(PAUSER_ROLE, _msgSender()) || hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Timelock: Forbidden Role");
        
        // فراخوانی تابع cancel اصلی
        _cancel(target, value, data, predecessor, salt);
    }
}