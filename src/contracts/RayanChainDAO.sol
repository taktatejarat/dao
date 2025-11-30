// src/contracts/RayanChainDAO.sol
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

interface IFinanceExtended is IFinance {
    function depositInvestment(uint256 _proposalId, address _investor, uint256 _amount) external;
    function finalizeInvestment(uint256 _proposalId, address _recipient, uint256 _totalRaised, uint8 _milestoneCount) external;
    function refundInvestment(uint256 _proposalId, address _investor) external;
}

contract RayanChainDAO is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    
    enum ProposalState { Pending, Validation, Voting, Approved, Rejected, Executed, Expired, Cancelled, Funding, Funded, FundingFailed } 
    enum ProposalType { Funding, TreasuryAction, GrantRole, MilestoneRelease }
    enum VoteType { For, Against }
    enum TokenType { Native, RYC }
    string public constant VERSION = "3.1.0_STABLE"; 

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
        bytes32 roleToGrant;
        uint256 totalRaised;      
        uint256 softCap;          
        uint256 fundingDeadline;  
    }

    AccControl public accControl;
    IStaking public stakingContract;
    IFinanceExtended public financeContract;
    TimelockController public timelock;
    address public startupAccessTokenAddress;  
    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalId;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public participationScores;
    uint256 public constant MAX_RISK_SCORE = 75;
    
    uint256 public votingPeriod;
    uint256 public quorumPercentage;
    uint256 public approvalThresholdPercentage;
    
    uint256 public constant FUNDING_DURATION = 15 days; 
    uint256 public constant SOFT_CAP_PERCENT = 51; 

    event ProposalCreated(uint256 id, address proposer, ProposalType pType, bytes32 descriptionHash); 
    event Voted(uint256 proposalId, address voter, VoteType vote, uint256 weight);
    event ParticipationScoreUpdated(address indexed user, uint256 newScore);
    event ProposalExecuted(uint256 id);
    event ProposalStateChanged(uint256 id, ProposalState newState);
    event MilestoneReleased(uint256 indexed proposalId, uint256 milestoneIndex, uint256 amount);
    event InvestmentReceived(uint256 indexed proposalId, address indexed investor, uint256 amount);
    event FundingFinalized(uint256 indexed proposalId, bool success, uint256 totalRaised);

    modifier onlyRole(bytes32 role) {
        require(accControl.hasRole(role, msg.sender), "Caller does not have required role");
        _;
    }

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
        transferOwnership(_initialOwner);

        accControl = AccControl(_accControlAddress);
        stakingContract = IStaking(_stakingAddress);
        financeContract = IFinanceExtended(_financeAddress);
        timelock = TimelockController(payable(_timelockAddress));
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        approvalThresholdPercentage = _approvalThreshold;
        nextProposalId = 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // ✅ NEW: تابع تغییر زمان رأی‌گیری (برای صفحه تنظیمات)
    function setVotingPeriod(uint256 _newPeriod) external onlyOwner {
        require(_newPeriod >= 60, "Period too short");
        votingPeriod = _newPeriod;
    }

    // --- Proposal Creation Functions ---
    function submitFundingProposal(bytes32 _descriptionHash, address payable _recipient, Milestone[] memory _milestones) external {
        require(stakingContract.votingPower(msg.sender) > 0, "DAO: Must have voting power");
        require(_milestones.length > 0, "At least one milestone is required");

        uint256 totalRequested = 0;
        for (uint i = 0; i < _milestones.length; i++) {
            totalRequested += _milestones[i].amount;
        }

        uint256 proposalId = _createProposal(ProposalType.Funding, _descriptionHash, _recipient, totalRequested, TokenType.RYC);
        Proposal storage p = proposals[proposalId];
        
        p.softCap = (totalRequested * SOFT_CAP_PERCENT) / 100;

        for (uint i = 0; i < _milestones.length; i++) {
            p.milestones.push(_milestones[i]);
        }
    }

    function createMilestoneReleaseProposal(uint256 _originalProposalId, bytes32 _proofHash, bytes32 _descriptionHash) external {
        Proposal storage original = proposals[_originalProposalId];
        require(original.pType == ProposalType.Funding, "Not funding proposal");
        require(
            msg.sender == original.proposer || msg.sender == original.recipient || accControl.hasRole(accControl.DEFAULT_ADMIN_ROLE(), msg.sender), 
            "Access Denied: Not authorized"
        );
        require(original.state == ProposalState.Funded, "Project not in Funded state");

        uint256 id = _createProposal(ProposalType.MilestoneRelease, _descriptionHash, payable(original.recipient), _originalProposalId, TokenType.RYC);
        proposals[id].milestones.push(Milestone({
            name: "Release", durationDays: 0, amount: 0, state: ProposalState.Pending, proofOfProgressHash: _proofHash, released: false
        }));
    }
    
    function createGrantRoleProposal(bytes32 _descriptionHash, address _recipient, bytes32 _roleToGrant) external onlyRole(accControl.DAO_MEMBER_ROLE()) {
        uint256 id = _createProposal(ProposalType.GrantRole, _descriptionHash, payable(_recipient), 0, TokenType.RYC);
        proposals[id].roleToGrant = _roleToGrant;
    }

    function createTreasuryActionProposal(bytes32 _descriptionHash, address payable _recipient, uint256 _amount, TokenType _tokenType) external onlyRole(accControl.DEFAULT_ADMIN_ROLE()) {
        _createProposal(ProposalType.TreasuryAction, _descriptionHash, _recipient, _amount, _tokenType);
    }

    function _createProposal(ProposalType _pType, bytes32 _descriptionHash, address payable _recipient, uint256 _amount, TokenType _tokenType) private returns (uint256) {
        uint256 id = nextProposalId++;
        Proposal storage p = proposals[id];
        p.id = id;
        p.pType = _pType;
        p.proposer = msg.sender;
        p.descriptionHash = _descriptionHash;
        p.recipient = _recipient;
        p.amount = _amount;
        p.tokenType = _tokenType;
        p.creationTime = block.timestamp;
        p.votingDeadline = block.timestamp + votingPeriod;
        p.state = ProposalState.Voting;
        emit ProposalCreated(id, msg.sender, _pType, _descriptionHash);
        emit ProposalStateChanged(id, ProposalState.Voting);
        return id;
    }

    function vote(uint256 _proposalId, VoteType _voteType) external nonReentrant {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.Voting, "Not in voting state");
        require(block.timestamp <= p.votingDeadline, "Voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        
        uint256 power = IStaking(stakingContract).votingPower(msg.sender);
        require(power > 0, "No voting power");

        uint256 score = participationScores[msg.sender];
        uint256 effective = power * (100 + score) / 100;
        
        hasVoted[_proposalId][msg.sender] = true;
        if (_voteType == VoteType.For) p.forVotes += effective;
        else p.againstVotes += effective;
        
        emit Voted(_proposalId, msg.sender, _voteType, effective);
    }

    function tallyVotes(uint256 _proposalId) public {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.Voting, "Not voting");
        require(block.timestamp > p.votingDeadline, "Wait for deadline");
        
        uint256 total = p.forVotes + p.againstVotes;
        uint256 networkPower = IStaking(stakingContract).totalVotingPower();
        
        if (total == 0 || (total * 100 / networkPower) < quorumPercentage) {
            p.state = ProposalState.Rejected;
        } else if ((p.forVotes * 100 / total) >= approvalThresholdPercentage) {
            p.state = ProposalState.Approved;
        } else {
            p.state = ProposalState.Rejected;
        }
        emit ProposalStateChanged(_proposalId, p.state);
    }

    function startFunding(uint256 _proposalId) internal {
        Proposal storage p = proposals[_proposalId];
        p.state = ProposalState.Funding;
        p.fundingDeadline = block.timestamp + FUNDING_DURATION;
        emit ProposalStateChanged(_proposalId, ProposalState.Funding);
    }

    function invest(uint256 _proposalId, uint256 _amount) external nonReentrant {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.Funding, "Not in funding phase");
        require(block.timestamp <= p.fundingDeadline, "Funding ended");
        require(p.totalRaised + _amount <= p.amount, "Hard cap reached");

        financeContract.depositInvestment(_proposalId, msg.sender, _amount);
        
        p.totalRaised += _amount;
        emit InvestmentReceived(_proposalId, msg.sender, _amount);
    }

    function finalizeFunding(uint256 _proposalId) external nonReentrant {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.Funding, "Not funding");
        
        bool timeEnded = block.timestamp > p.fundingDeadline;
        bool hardCapReached = p.totalRaised >= p.amount;
        
        require(timeEnded || hardCapReached, "Funding ongoing");

        if (p.totalRaised >= p.softCap) {
            p.state = ProposalState.Funded;
            financeContract.finalizeInvestment(_proposalId, p.recipient, p.totalRaised, uint8(p.milestones.length));
            emit FundingFinalized(_proposalId, true, p.totalRaised);
        } else {
            p.state = ProposalState.FundingFailed;
            emit FundingFinalized(_proposalId, false, p.totalRaised);
        }
        emit ProposalStateChanged(_proposalId, p.state);
    }

    function claimRefund(uint256 _proposalId) external nonReentrant {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.FundingFailed, "Funding not failed");
        financeContract.refundInvestment(_proposalId, msg.sender);
    }

    function executeProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage p = proposals[_proposalId];
        
        if (p.state == ProposalState.Voting && block.timestamp > p.votingDeadline) {
            tallyVotes(_proposalId);
        }

        require(p.state == ProposalState.Approved, "Proposal is not approved");
        require(!p.executed, "Proposal already executed");
        require(p.aiRiskScore <= MAX_RISK_SCORE, "AI risk score is too high");
        
        if (p.pType == ProposalType.Funding) {
            p.executed = true;
            startFunding(_proposalId);
            return;
        }

        p.executed = true;
        p.state = ProposalState.Executed;

        bytes memory data;
        address target;
        bytes32 salt = keccak256(abi.encodePacked("RayanChainProposal", _proposalId));

        if (p.pType == ProposalType.TreasuryAction) {
            target = address(financeContract);
            if (p.tokenType == TokenType.Native) {
                data = abi.encodeWithSelector(IFinance(target).withdraw.selector, p.recipient, p.amount);
            } else {
                data = abi.encodeWithSelector(IFinance(target).withdrawTokens.selector, p.recipient, p.amount);
            }
        } else if (p.pType == ProposalType.GrantRole) {
            target = address(accControl);
            data = abi.encodeWithSelector(AccControl(target).grantRole.selector, p.roleToGrant, p.recipient);
        } else if (p.pType == ProposalType.MilestoneRelease) {
            uint256 originalProposalId = p.amount;
            target = address(financeContract);
            data = abi.encodeWithSelector(IFinance(target).releaseNextMilestone.selector, originalProposalId);
            
            Proposal storage originalProposal = proposals[originalProposalId];
            bytes32 proofHash = p.milestones[0].proofOfProgressHash;
            originalProposal.milestones[originalProposal.currentMilestoneIndex].proofOfProgressHash = proofHash;
            originalProposal.milestones[originalProposal.currentMilestoneIndex].released = true;
            emit MilestoneReleased(originalProposalId, originalProposal.currentMilestoneIndex, originalProposal.milestones[originalProposal.currentMilestoneIndex].amount);
            originalProposal.currentMilestoneIndex++;
        }
        
        timelock.schedule(target, 0, data, bytes32(0), salt, timelock.getMinDelay());
        emit ProposalExecuted(_proposalId);
        emit ProposalStateChanged(_proposalId, ProposalState.Executed);
    }
    
    // --- NEW LOGIC: منطق اضطراری PAUSER ---
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