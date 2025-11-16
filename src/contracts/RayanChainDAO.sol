// src/contracts/RayanChainDAO.sol - اصلاح شده برای ادغام Timelock
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./permission/AccControl.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/IFinance.sol";
import "./TimelockController.sol"; 

contract RayanChainDAO is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    // --- Enums ---
    enum ProposalState { Pending, Validation, Voting, Approved, Rejected, Executed, Expired, Cancelled }
    enum ProposalType { Funding, TreasuryAction, GrantRole, MilestoneRelease } // ✅ NEW: GrantRole for B.2
    enum VoteType { For, Against }
    enum TokenType { Native, RYC }


    // --- Structs ---
    // ✅✅✅ FIX 1: به‌روزرسانی کامل ساختار Milestone ✅✅✅
    struct Milestone {
        string name;
        uint256 durationDays;
        uint256 amount;
        ProposalState state;
        bytes32 proofOfProgressHash;
        bool released;
    }

       struct Proposal {
        uint256 id;
        ProposalType pType;
        address proposer;
        bytes32 descriptionHash;
        address payable recipient;
        uint256 amount;
        TokenType tokenType;
        uint256 creationTime;
        uint256 votingDeadline;
        uint256 forVotes;
        uint256 againstVotes;
        ProposalState state;
        bool executed;
        Milestone[] milestones;
        uint256 currentMilestoneIndex;
        uint256 aiRiskScore;
        uint256 requiredApprovalThreshold;
        // ✅ NEW FIELD: برای ذخیره آدرس/نقشی که قرار است اعطا شود (برای GrantRole)
        bytes32 roleToGrant; 
    }

    // --- State Variables ---
    AccControl public accControl;
    IStaking public stakingContract;
    IFinance public financeContract;
    TimelockController public timelock; // ✅ NEW: State variable for Timelock
    address public startupAccessTokenAddress;  
    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalId;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public participationScores;
    uint256 public constant MAX_RISK_SCORE = 75;
    
    uint256 public votingPeriod;
    uint256 public quorumPercentage;
    uint256 public approvalThresholdPercentage;

    // --- Events ---
    // ✅ CHANGE: Event now uses hash instead of full description
    event ProposalCreated(uint256 id, address proposer, ProposalType pType, bytes32 descriptionHash); 
    event Voted(uint256 proposalId, address voter, VoteType vote, uint256 weight);
    event ParticipationScoreUpdated(address indexed user, uint256 newScore);
    event ProposalExecuted(uint256 id);
    event ProposalStateChanged(uint256 id, ProposalState newState);
    event MilestoneReleased(uint256 indexed proposalId, uint256 milestoneIndex, uint256 amount);

    // --- Modifiers ---
    modifier onlyRole(bytes32 role) {
        require(accControl.hasRole(role, msg.sender), "Caller does not have required role");
        _;
    }

   // --- ✅✅✅ INITIALIZER FUNCTION ✅✅✅ ---
    function initialize(
        address _initialOwner,
        address _accControlAddress,
        address _stakingAddress,
        address _financeAddress,
        address _timelockAddress,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _approvalThreshold
    ) public initializer {
        __Ownable_init(_initialOwner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        // تنظیم دستی مالک اولیه
        transferOwnership(_initialOwner); // تنظیم مالک اولیه به آدرس ارائه‌شده

        accControl = AccControl(_accControlAddress);
        stakingContract = IStaking(_stakingAddress);
        financeContract = IFinance(_financeAddress);
        timelock = TimelockController(payable(_timelockAddress));
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        approvalThresholdPercentage = _approvalThreshold;
        startupAccessTokenAddress = address(0);
        nextProposalId = 1;
    }

    // --- ✅✅✅ UUPS UPGRADE AUTHORIZATION ✅✅✅ ---
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ✅✅✅ THE FINAL, CORRECT IMPLEMENTATION ✅✅✅
    function submitFundingProposal(
        bytes32 _descriptionHash,
        address payable _recipient,
        Milestone[] memory _milestones // فقط ۳ پارامتر
    ) external {
        // ✅ FIX: فراخوانی تابع صحیح از قرارداد Staking
        require(stakingContract.votingPower(msg.sender) > 0, "DAO: Must have voting power to propose.");
        require(_descriptionHash != bytes32(0), "Description hash cannot be zero");
        require(_milestones.length > 0, "At least one milestone is required");

        uint256 proposalId = _createProposal(
            ProposalType.Funding, _descriptionHash, _recipient, 0, TokenType.RYC
        );
        Proposal storage newProposal = proposals[proposalId];

        for (uint i = 0; i < _milestones.length; i++) {
            require(_milestones[i].amount > 0, "Milestone amount must be > 0");
            require(_milestones[i].durationDays > 0, "Milestone duration must be > 0");
            require(bytes(_milestones[i].name).length > 0, "Milestone name cannot be empty");

            newProposal.milestones.push(_milestones[i]);
        }
    }


    /**
     * @notice Creates a proposal to release the next milestone for an existing funding project.
     * @dev Can be called by the original project recipient or an admin.
     * @param _originalProposalId The ID of the initial funding proposal.
     * @param _proofHash The hash of the off-chain proof of progress.
     * @param _descriptionHash A hash of the description for this new milestone release proposal.
     */
    function createMilestoneReleaseProposal(
        uint256 _originalProposalId,
        bytes32 _proofHash,
        bytes32 _descriptionHash
    ) external {
        Proposal storage originalProposal = proposals[_originalProposalId];
        require(originalProposal.pType == ProposalType.Funding, "Original proposal is not for funding");
        require(msg.sender == originalProposal.recipient || accControl.hasRole(accControl.DEFAULT_ADMIN_ROLE(), msg.sender), "Not authorized to propose milestone release");
        require(originalProposal.currentMilestoneIndex < originalProposal.milestones.length, "All milestones already released");
        require(_proofHash != bytes32(0), "Proof hash cannot be zero");

        // ایجاد یک پروپوزال جدید از نوع MilestoneRelease
        uint256 milestoneProposalId = _createProposal(
            ProposalType.MilestoneRelease,
            _descriptionHash,
            payable(originalProposal.recipient), // Recipient is the same
            _originalProposalId, // 'amount' field now stores the original proposal ID
            TokenType.RYC
        );
        
        // ✅✅✅ THE FIX IS HERE: مقداردهی کامل struct با مقادیر پیش‌فرض ✅✅✅
        // ذخیره کردن proofHash در پروپوزال جدید برای بررسی در زمان اجرا
        proposals[milestoneProposalId].milestones.push(Milestone({
            name: "", // ✅ FIX: افزودن فیلد name با مقدار پیش‌فرض
            durationDays: 0, // ✅ FIX: افزودن فیلد durationDays با مقدار پیش‌فرض
            amount: 0, // برای این نوع پروپوزال استفاده نمی‌شود
            state: ProposalState.Pending,
            proofOfProgressHash: _proofHash, // مقدار اصلی که باید ذخیره شود
            released: false
        }));
    }

    // ✅ NEW: ایجاد پروپوزال برای اعطای نقش (برای غیرمتمرکزسازی اعطای نقش)
    function createGrantRoleProposal(
        bytes32 _descriptionHash, 
        address _recipient, 
        bytes32 _roleToGrant
    ) external onlyRole(accControl.DAO_MEMBER_ROLE()) { // فقط اعضای DAO می‌توانند درخواست Grant Role دهند
        require(_descriptionHash != bytes32(0), "Description hash cannot be zero"); 
        
        uint256 proposalId = _createProposal(
            ProposalType.GrantRole, _descriptionHash, payable(_recipient), 0, TokenType.RYC
        );
        proposals[proposalId].roleToGrant = _roleToGrant;
    }

    function createTreasuryActionProposal(
        // ✅ CHANGE: Accepts only the hash
        bytes32 _descriptionHash, 
        address payable _recipient,
        uint256 _amount,
        TokenType _tokenType
    ) external onlyRole(accControl.DEFAULT_ADMIN_ROLE()) { // Only admins can propose treasury actions
        require(_descriptionHash != bytes32(0), "Description hash cannot be zero"); // New check
        _createProposal(ProposalType.TreasuryAction, _descriptionHash, _recipient, _amount, _tokenType);
    }

    function _createProposal(
        ProposalType _pType,
        bytes32 _descriptionHash,
        address payable _recipient,
        uint256 _amount,
        TokenType _tokenType
    ) private returns (uint256) {
        uint256 proposalId = nextProposalId++;
        // ✅✅✅ FIX: استفاده از storage pointer
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.pType = _pType;
        newProposal.proposer = msg.sender;
        newProposal.descriptionHash = _descriptionHash;
        newProposal.recipient = _recipient;
        newProposal.amount = _amount;
        newProposal.tokenType = _tokenType;
        newProposal.creationTime = block.timestamp;
        newProposal.votingDeadline = block.timestamp + votingPeriod;
        newProposal.state = ProposalState.Voting;

        emit ProposalCreated(proposalId, msg.sender, _pType, _descriptionHash);
        emit ProposalStateChanged(proposalId, ProposalState.Voting);
        return proposalId;
    }
    
    // --- Voting Logic --- 
    function vote(uint256 _proposalId, VoteType _voteType) external nonReentrant {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.Voting, "Proposal not in voting state");
        require(block.timestamp <= p.votingDeadline, "Voting period has ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        // baseVotingPower: مقدار رسمیِ رأی از قرارداد استیکینگ (staked + delegated مطابق قرارداد استیکینگ)
        uint256 baseVotingPower = IStaking(stakingContract).votingPower(msg.sender);
        require(baseVotingPower > 0, "Must have voting power to vote");

        uint256 participationScore = participationScores[msg.sender]; // PoP score
        // اعمال modifier مشارکت بر روی کل توان رأی
        uint256 effectiveVotingPower = baseVotingPower * (100 + participationScore) / 100;

        hasVoted[_proposalId][msg.sender] = true;

        if (_voteType == VoteType.For) {
            p.forVotes += effectiveVotingPower;
        } else {
            p.againstVotes += effectiveVotingPower;
        }

        emit Voted(_proposalId, msg.sender, _voteType, effectiveVotingPower);
    }
    
    // --- Proposal Execution ---
    function tallyVotes(uint256 _proposalId) public {
        Proposal storage p = proposals[_proposalId];

        require(p.state == ProposalState.Voting, "Proposal not in voting state");
        require(block.timestamp > p.votingDeadline, "Voting period not yet ended");

        // *** اصلاح اول: استفاده از مجموع واقعی قدرت رأی ***
        uint256 totalVotingPower = IStaking(stakingContract).totalVotingPower();

        // *** جلوگیری از تقسیم بر صفر ***
        require(totalVotingPower > 0, "DAO: No voting power in system");

        uint256 totalVotes = p.forVotes + p.againstVotes;

        // اگر حتی یک رأی هم ثبت نشده باشد → رد شود
        if (totalVotes == 0) {
            p.state = ProposalState.Rejected;
            emit ProposalStateChanged(_proposalId, ProposalState.Rejected);
            return;
        }

        // *** اصلاح دوم: محاسبه صحیح quorum ***
        // quorum: درصد حداقل مشارکت نسبت به کل voting power
        uint256 participationPercent = (totalVotes * 100) / totalVotingPower;

        if (participationPercent < quorumPercentage) {
            p.state = ProposalState.Rejected;
            emit ProposalStateChanged(_proposalId, ProposalState.Rejected);
            return;
        }

        // *** اصلاح سوم: محاسبه approval threshold با اطمینان از تقسیم صحیح ***
        uint256 approvalPercent = (p.forVotes * 100) / totalVotes;

        if (approvalPercent >= approvalThresholdPercentage) {
            p.state = ProposalState.Approved;
            emit ProposalStateChanged(_proposalId, ProposalState.Approved);
        } else {
            p.state = ProposalState.Rejected;
            emit ProposalStateChanged(_proposalId, ProposalState.Rejected);
        }
    }


      
   // --- Proposal Execution (اصلی‌ترین تغییر) ---
    function executeProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage p = proposals[_proposalId];
        
        if (p.state == ProposalState.Voting && block.timestamp > p.votingDeadline) {
            tallyVotes(_proposalId);
        }


        require(p.state == ProposalState.Approved, "Proposal is not approved");
        require(!p.executed, "Proposal already executed");
        require(p.aiRiskScore <= MAX_RISK_SCORE, "AI risk score is too high"); // ✅ AI Gate Check
        
        p.executed = true;
        p.state = ProposalState.Executed;

        bytes memory data;
        address target;
        // Salt باید یکتا و قابل پیش‌بینی باشد. استفاده از ID پروپوزال بهترین گزینه است.
        bytes32 salt = keccak256(abi.encodePacked("RayanChainProposal", _proposalId));

        if (p.pType == ProposalType.Funding) {
            // عملیات: registerInvestment در قرارداد Finance
            uint256 totalAmount = 0;
            for (uint i = 0; i < p.milestones.length; i++) {
                totalAmount += p.milestones[i].amount;
            }
            target = address(financeContract);
            data = abi.encodeWithSelector(
                IFinance(target).registerInvestment.selector,
                _proposalId,
                p.recipient,
                totalAmount,
                uint8(p.milestones.length)
            );
        } else if (p.pType == ProposalType.TreasuryAction) {
            // عملیات: withdraw/withdrawTokens در قرارداد Finance
            target = address(financeContract);
            if (p.tokenType == TokenType.Native) {
                data = abi.encodeWithSelector(IFinance(target).withdraw.selector, p.recipient, p.amount);
            } else {
                data = abi.encodeWithSelector(IFinance(target).withdrawTokens.selector, p.recipient, p.amount);
            }
        } else if (p.pType == ProposalType.GrantRole) { // ✅ NEW: اجرای GrantRole
            // عملیات: grantRole در قرارداد AccControl
            target = address(accControl);
            data = abi.encodeWithSelector(
                AccControl(target).grantRole.selector,
                p.roleToGrant, 
                p.recipient // آدرس دریافت‌کننده نقش
            );
        } else if (p.pType == ProposalType.MilestoneRelease) { // ✅ NEW LOGIC
            uint256 originalProposalId = p.amount; // ID پروپوزال اصلی در فیلد amount ذخیره شده
            target = address(financeContract);
            data = abi.encodeWithSelector(
                IFinance(target).releaseNextMilestone.selector,
                originalProposalId
        ); 
         // آپدیت وضعیت در پروپوزال اصلی
            Proposal storage originalProposal = proposals[originalProposalId];
            bytes32 proofHash = p.milestones[0].proofOfProgressHash; // دریافت proofHash از پروپوزال فعلی
            originalProposal.milestones[originalProposal.currentMilestoneIndex].proofOfProgressHash = proofHash;
            originalProposal.milestones[originalProposal.currentMilestoneIndex].released = true;
            emit MilestoneReleased(originalProposalId, originalProposal.currentMilestoneIndex, originalProposal.milestones[originalProposal.currentMilestoneIndex].amount);
            originalProposal.currentMilestoneIndex++;
        }
        
        // ✅ FIX 2: افزودن آرگومان ششم (delay) به تابع schedule
        timelock.schedule(
            target,
            0,
            data,
            bytes32(0),
            salt,
            timelock.getMinDelay() // حداقل زمان تأخیر
        );

        emit ProposalExecuted(_proposalId);
        emit ProposalStateChanged(_proposalId, ProposalState.Executed);
    }

    // --- ✅ NEW LOGIC: منطق اضطراری PAUSER ---
    /**
     * @notice Allows an account with the PAUSER_ROLE to cancel a scheduled operation in the Timelock.
     * @dev This function acts as the emergency escape hatch for the DAO.
     * @param _proposalId The ID of the proposal whose scheduled operation should be cancelled.
     */
    function emergencyCancel(uint256 _proposalId) external nonReentrant onlyRole(accControl.PAUSER_ROLE()) {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.Executed, "DAO: Proposal must be in Executed (Scheduled) state to be cancelled.");

        // ✅ NEW: بازسازی دقیق داده‌ها و salt برای فراخوانی timelock.cancel()
        bytes memory data;
        address target;
        bytes32 salt = keccak256(abi.encodePacked(_proposalId, block.timestamp)); // ✅ Salt باید با salt استفاده شده در schedule() مطابقت داشته باشد.

        if (p.pType == ProposalType.Funding) {
            // بازسازی داده‌ها برای Funding
            uint256 totalAmount = 0;
            for (uint i = 0; i < p.milestones.length; i++) {
                totalAmount += p.milestones[i].amount;
            }
            target = address(financeContract);
            data = abi.encodeWithSelector(
                IFinance(target).registerInvestment.selector,
                _proposalId,
                p.recipient,
                totalAmount,
                uint8(p.milestones.length)
            );
        } else if (p.pType == ProposalType.TreasuryAction) {
            // بازسازی داده‌ها برای TreasuryAction
            target = address(financeContract);
            if (p.tokenType == TokenType.Native) {
                data = abi.encodeWithSelector(IFinance(target).withdraw.selector, p.recipient, p.amount);
            } else {
                data = abi.encodeWithSelector(IFinance(target).withdrawTokens.selector, p.recipient, p.amount);
            }
        } else if (p.pType == ProposalType.GrantRole) {
            // بازسازی داده‌ها برای GrantRole
            target = address(accControl);
            data = abi.encodeWithSelector(
                AccControl(target).grantRole.selector,
                p.roleToGrant, 
                p.recipient
            );
        }
        
       // محاسبه شناسه عملیات (Operation ID)
        bytes32 operationId = timelock.hashOperation(
            target,
            0,
            data,
            bytes32(0),
            salt
        );

        // فراخوانی تابع cancel با شناسه صحیح
        timelock.cancel(operationId);

        // آپدیت وضعیت پروپوزال به Cancelled
        p.state = ProposalState.Cancelled;
        emit ProposalStateChanged(_proposalId, ProposalState.Cancelled);
    }

    // --- Oracle Functions (Remains UNCHANGED) ---
    function updateParticipationScore(address _user, uint256 _score) external onlyRole(accControl.AI_ORACLE_ROLE()) {
        participationScores[_user] = _score;
        emit ParticipationScoreUpdated(_user, _score);
    }
    
    function updateProposalRiskScore(uint256 _proposalId, uint256 _riskScore) external onlyRole(accControl.AI_ORACLE_ROLE()) {
        require(_riskScore <= 100, "Risk score cannot exceed 100");
        proposals[_proposalId].aiRiskScore = _riskScore;
    }
    // ✅ NEW: Function to set the Role Token address (only by owner/DAO)
    function setStartupAccessTokenAddress(address _address) external onlyOwner {
        require(_address != address(0), "DAO: Cannot set zero address.");
        // ✅ FIX: Assignment to the defined state variable
        startupAccessTokenAddress = _address; 
    }
}