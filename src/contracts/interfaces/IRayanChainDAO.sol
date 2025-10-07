// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRayanChainDAO {
   enum State {
        Pending,
        Validation,
        Voting,
        Approved,
        Rejected,
        FundsReleased,
        Expired,
        Cancelled
    }
    
    struct Milestone {
        uint256 amount;
        State state;
        string proofOfProgressLink;
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes32 descriptionHash;
        address payable recipient;
        uint256 creationTime;
        uint256 votingDeadline;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 validationCount;
        uint256 aiRiskScore;
        State state;
        Milestone[] milestones;
        uint256 currentMilestone;
    }
}
