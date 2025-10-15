// src/contracts/RayanChainDAO.sol - اصلاح شده برای ادغام Timelock
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./permission/AccControl.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/IFinance.sol";
import "./TimelockController.sol"; // ✅ NEW: Import the Timelock Contract

contract RayanChainDAO is Ownable, ReentrancyGuard {
    // --- Enums ---
    enum ProposalState { Pending, Validation, Voting, Approved, Rejected, Executed, Expired, Cancelled }
    enum ProposalType { Funding, TreasuryAction, GrantRole } // ✅ NEW: GrantRole for B.2
    enum VoteType { For, Against }
    enum TokenType { Native, RYC }


    // --- Structs ---
    struct Milestone {
        uint256 amount;
        ProposalState state;
        bytes32 proofOfProgressHash; // ✅ CHANGE: Link changed to Hash for Off-Chain Proof
        bool released;
    }

       struct Proposal {
        uint256 id;
        ProposalType pType;
        address proposer;
        // string description; // ❌ REMOVED: Full description is now off-chain
        bytes32 descriptionHash; // ✅ RETAINED: Only the hash is stored on-chain
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
    address public startupAccessTokenAddress = address(0); 
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

    // --- Constructor ---
    constructor(
        address _accControlAddress,
        address _stakingAddress,
        address _financeAddress,
        address _timelockAddress, // ✅ NEW PARAMETER
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _approvalThreshold
    ) Ownable(msg.sender) {
        accControl = AccControl(_accControlAddress);
        stakingContract = IStaking(_stakingAddress);
        financeContract = IFinance(_financeAddress);
        timelock = TimelockController(_timelockAddress); // ✅ NEW: Set Timelock
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        approvalThresholdPercentage = _approvalThreshold;
        nextProposalId = 1; 
    }

    // --- Proposal Creation ---
    function createFundingProposal(
        bytes32 _descriptionHash, 
        address payable _recipient,
        uint256[] memory _milestoneAmounts
    // ❌ REMOVED: external onlyRole(accControl.DAO_MEMBER_ROLE()) 
    ) external {
        // ✅ NEW: Temporary, less restrictive access check for testing.
        // In final version, this will be: require(IERC20(startupAccessTokenAddress).balanceOf(msg.sender) > 0, "DAO: Must hold Startup Access Token to propose.");
        require(stakingContract.getStakedAmount(msg.sender) > 0, "DAO: Must have RYC staked to propose."); // A simple interim security check
        require(_milestoneAmounts.length > 0, "At least one milestone is required");
        require(_descriptionHash != bytes32(0), "Description hash cannot be zero"); // New check
        
        uint256 proposalId = _createProposal(
            ProposalType.Funding, _descriptionHash, _recipient, 0, TokenType.RYC
        );

        for (uint i = 0; i < _milestoneAmounts.length; i++) {
            proposals[proposalId].milestones.push(Milestone({
                amount: _milestoneAmounts[i],
                state: ProposalState.Pending,
                proofOfProgressHash: bytes32(0), // Initial hash is zero
                released: false
            }));
        }
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
        // ✅ CHANGE: Accepts only the hash
        bytes32 _descriptionHash, 
        address payable _recipient,
        uint256 _amount,
        TokenType _tokenType
    ) private returns (uint256) {
        uint256 proposalId = nextProposalId++;
        // bytes32 descriptionHash = abi.encodePacked(_description).keccak256WithSalt(keccak256("proposal")); // Removed: Hash computed off-chain
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.pType = _pType;
        newProposal.proposer = msg.sender;
        // newProposal.description = _description; // Removed
        newProposal.descriptionHash = _descriptionHash; // ✅ ASSIGN: Use the provided hash
        newProposal.recipient = _recipient;
        newProposal.amount = _amount;
        newProposal.tokenType = _tokenType;
        newProposal.creationTime = block.timestamp;
        newProposal.votingDeadline = block.timestamp + votingPeriod;
        newProposal.state = ProposalState.Voting; // Directly to voting

        emit ProposalCreated(proposalId, msg.sender, _pType, _descriptionHash); // ✅ CHANGE: Event uses hash
        emit ProposalStateChanged(proposalId, ProposalState.Voting);
        return proposalId;
    }
    
    // --- Voting Logic --- 
    function vote(uint256 _proposalId, VoteType _voteType) external nonReentrant {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.Voting, "Proposal not in voting state");
        require(block.timestamp <= p.votingDeadline, "Voting period has ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        uint256 stakedAmount = stakingContract.getStakedAmount(msg.sender);
        require(stakedAmount > 0, "Must have staked tokens to vote");

        uint256 participationScore = participationScores[msg.sender]; //Reading PoP score
        // Simple formula: voting power = staked tokens * (1 + participation score / 100)
        // This makes a score of 100, double the voting power. This formula is adjustable.
        uint256 votingPower = stakedAmount * (100 + participationScore) / 100;

        hasVoted[_proposalId][msg.sender] = true;

        if (_voteType == VoteType.For) {
            p.forVotes += votingPower;
        } else {
            p.againstVotes += votingPower;
        }
        
        emit Voted(_proposalId, msg.sender, _voteType, votingPower);
    }
    
    // --- Proposal Execution ---
    function tallyVotes(uint256 _proposalId) public {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.Voting, "Proposal not in voting state");
        require(block.timestamp > p.votingDeadline, "Voting period not yet ended");

        uint256 totalStaked = IStaking(stakingContract).totalSupply();
        uint256 totalVotes = p.forVotes + p.againstVotes;

        if (totalVotes * 100 / totalStaked < quorumPercentage) {
            p.state = ProposalState.Rejected;
            emit ProposalStateChanged(_proposalId, ProposalState.Rejected);
            return;
        }

        if (p.forVotes * 100 / totalVotes >= approvalThresholdPercentage) {
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

        // ✅ CHANGE: اکنون عملیات حساس را به Timelock زمان‌بندی می‌کنیم
        bytes memory data;
        address target;

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
        }
        
        // زمان‌بندی عملیات در Timelock
        // Note: The DAO contract is the PROPOSER and EXECUTOR of the Timelock.
        timelock.schedule(
            target, 
            0, // value: 0 (عملیات‌های DAO معمولاً بدون ETH/Native Value هستند)
            data, 
            bytes32(0), // predecessor: 0 (بدون عملیات پیش‌نیاز)
            keccak256(data) // salt: از Hash خود داده برای یکتایی استفاده می‌کنیم
        );

        emit ProposalExecuted(_proposalId);
        emit ProposalStateChanged(_proposalId, ProposalState.Executed);
    }

 /**
     * @notice Releases the next milestone for an approved funding proposal.
     * @dev This should now also go through the Timelock if a new vote/milestone proposal is needed.
     * BUT: Since the matrix has "اجرای پروپوزال مالی پس از (Timelock)" and "برداشت از خزانه (تخصیص سرمایه)" 
     *      it is safer to assume that releaseNextMilestone (which is a fund transfer) must also be scheduled.
     */
    function releaseNextMilestone(uint256 _proposalId, bytes32 _proofHash) external nonReentrant onlyRole(accControl.DEFAULT_ADMIN_ROLE()) { // ⚠️ هنوز 
        require(p.pType == ProposalType.Funding, "Not a funding proposal");
        require(p.state == ProposalState.Executed, "Proposal was not approved and executed");
        require(p.currentMilestoneIndex < p.milestones.length, "All milestones already released");
        require(_proofHash != bytes32(0), "Proof hash cannot be zero"); // New check
        
        // ✅ CHANGE: به جای اجرای مستقیم، آن را زمان‌بندی می‌کنیم (باید توسط DAO رأی‌گیری شود)
        // این تابع باید توسط یک پروپوزال جدید (MilestoneReleaseProposal) جایگزین شود.
        
        // برای حفظ سازگاری: عملیات را از طریق Timelock زمان‌بندی می‌کنیم:
        address target = address(financeContract);
        bytes memory data = abi.encodeWithSelector(IFinance(target).releaseNextMilestone.selector, _proposalId);

        timelock.schedule(
            target, 
            0, 
            data, 
            bytes32(0), 
            keccak256(data)
        );
        
        // آپدیت وضعیت در قرارداد DAO
        Proposal storage p = proposals[_proposalId];
        p.milestones[p.currentMilestoneIndex].proofOfProgressHash = _proofHash; // ✅ CHANGE: Store the hash
        p.milestones[p.currentMilestoneIndex].released = true;
        emit MilestoneReleased(_proposalId, p.currentMilestoneIndex, p.milestones[p.currentMilestoneIndex].amount);
        
        p.currentMilestoneIndex++;
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