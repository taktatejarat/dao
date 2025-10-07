import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AccControl
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const accControlAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'initialOwner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'function',
    inputs: [],
    name: 'AI_ORACLE_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DAO_MEMBER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'VALIDATOR_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DAORegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daoRegistryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'initialOwner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'newAddress',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'AddressSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ACC_CONTROL',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FINANCE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'RAYAN_CHAIN_DAO',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'RAYAN_CHAIN_TOKEN',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'STAKING',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'USER_PROFILE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_key', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_key', internalType: 'bytes32', type: 'bytes32' },
      { name: '_address', internalType: 'address', type: 'address' },
    ],
    name: 'setAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Finance
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const financeAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_initialOwner', internalType: 'address', type: 'address' },
      { name: '_tokenAddress', internalType: 'address', type: 'address' },
      { name: '_platformFeeBps', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newDaoAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'DaoAddressSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'FundsDeposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'FundsReleased',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'InvestmentCancelled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'totalAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'milestoneCount',
        internalType: 'uint8',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'InvestmentRegistered',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'milestoneNumber',
        internalType: 'uint8',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'MilestoneReleased',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'NativeFundsWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'feeAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PlatformFeeTaken',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TokenFundsWithdrawn',
  },
  {
    type: 'function',
    inputs: [],
    name: 'daoAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'investments',
    outputs: [
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: 'totalAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'releasedAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'milestoneCount', internalType: 'uint8', type: 'uint8' },
      { name: 'currentMilestone', internalType: 'uint8', type: 'uint8' },
      { name: 'isActive', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'platformFeeBps',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_proposalId', internalType: 'uint256', type: 'uint256' },
      { name: '_recipient', internalType: 'address', type: 'address' },
      { name: '_totalAmount', internalType: 'uint256', type: 'uint256' },
      { name: '_milestoneCount', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'registerInvestment',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address payable', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'releaseFunds',
    outputs: [],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'releaseNextMilestone',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_daoAddress', internalType: 'address', type: 'address' }],
    name: 'setDaoAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address payable', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RayanChainDAO
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const rayanChainDaoAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_accControlAddress', internalType: 'address', type: 'address' },
      { name: '_stakingAddress', internalType: 'address', type: 'address' },
      { name: '_financeAddress', internalType: 'address', type: 'address' },
      { name: '_votingPeriod', internalType: 'uint256', type: 'uint256' },
      { name: '_quorumPercentage', internalType: 'uint256', type: 'uint256' },
      { name: '_approvalThreshold', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'milestoneIndex',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MilestoneReleased',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'newScore',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ParticipationScoreUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        name: 'proposer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'pType',
        internalType: 'enum RayanChainDAO.ProposalType',
        type: 'uint8',
        indexed: false,
      },
      {
        name: 'descriptionHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'ProposalCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ProposalExecuted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        name: 'newState',
        internalType: 'enum RayanChainDAO.ProposalState',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'ProposalStateChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'voter',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'vote',
        internalType: 'enum RayanChainDAO.VoteType',
        type: 'uint8',
        indexed: false,
      },
      {
        name: 'weight',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Voted',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_RISK_SCORE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'accControl',
    outputs: [
      { name: '', internalType: 'contract AccControl', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'approvalThresholdPercentage',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_descriptionHash', internalType: 'bytes32', type: 'bytes32' },
      { name: '_recipient', internalType: 'address payable', type: 'address' },
      {
        name: '_milestoneAmounts',
        internalType: 'uint256[]',
        type: 'uint256[]',
      },
    ],
    name: 'createFundingProposal',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_descriptionHash', internalType: 'bytes32', type: 'bytes32' },
      { name: '_recipient', internalType: 'address payable', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      {
        name: '_tokenType',
        internalType: 'enum RayanChainDAO.TokenType',
        type: 'uint8',
      },
    ],
    name: 'createTreasuryActionProposal',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'executeProposal',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'financeContract',
    outputs: [{ name: '', internalType: 'contract IFinance', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'hasVoted',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextProposalId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'participationScores',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      {
        name: 'pType',
        internalType: 'enum RayanChainDAO.ProposalType',
        type: 'uint8',
      },
      { name: 'proposer', internalType: 'address', type: 'address' },
      { name: 'descriptionHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'recipient', internalType: 'address payable', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      {
        name: 'tokenType',
        internalType: 'enum RayanChainDAO.TokenType',
        type: 'uint8',
      },
      { name: 'creationTime', internalType: 'uint256', type: 'uint256' },
      { name: 'votingDeadline', internalType: 'uint256', type: 'uint256' },
      { name: 'forVotes', internalType: 'uint256', type: 'uint256' },
      { name: 'againstVotes', internalType: 'uint256', type: 'uint256' },
      {
        name: 'state',
        internalType: 'enum RayanChainDAO.ProposalState',
        type: 'uint8',
      },
      { name: 'executed', internalType: 'bool', type: 'bool' },
      {
        name: 'currentMilestoneIndex',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'aiRiskScore', internalType: 'uint256', type: 'uint256' },
      {
        name: 'requiredApprovalThreshold',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'quorumPercentage',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_proposalId', internalType: 'uint256', type: 'uint256' },
      { name: '_proofHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'releaseNextMilestone',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_address', internalType: 'address', type: 'address' }],
    name: 'setStartupAccessTokenAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'stakingContract',
    outputs: [{ name: '', internalType: 'contract IStaking', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'startupAccessTokenAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'tallyVotes',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_user', internalType: 'address', type: 'address' },
      { name: '_score', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateParticipationScore',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_proposalId', internalType: 'uint256', type: 'uint256' },
      { name: '_riskScore', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateProposalRiskScore',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_proposalId', internalType: 'uint256', type: 'uint256' },
      {
        name: '_voteType',
        internalType: 'enum RayanChainDAO.VoteType',
        type: 'uint8',
      },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'votingPeriod',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RayanChainToken
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const rayanChainTokenAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'initialOwner', internalType: 'address', type: 'address' },
      { name: 'initialSupply', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Staking
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const stakingAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_tokenAddress', internalType: 'address', type: 'address' },
      { name: '_initialOwner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'delegatee',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'power',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Delegated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'reward',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardClaimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'totalReward',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardDistributed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'funder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardFunded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newRate',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardRateSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Staked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'previousDelegatee',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'power',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Undelegated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Unstaked',
  },
  {
    type: 'function',
    inputs: [],
    name: 'claimReward',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_delegatee', internalType: 'address', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'delegatedPower',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'delegates',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'distributeRewards',
    outputs: [],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'earned',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'fundRewards',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'getStakedAmount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'lastUpdateTime',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'rewardPerToken',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'rewardPerTokenStored',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'rewardRate',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'rewards',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'rycToken',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_rewardRate', internalType: 'uint256', type: 'uint256' }],
    name: 'setRewardRate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'undelegate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'userRewardPerTokenPaid',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UserProfile
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const userProfileAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'initialOwner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'newURI',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'ProfileUpdated',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'metadataURIs',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'uri', internalType: 'string', type: 'string' }],
    name: 'setProfileURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'uri', internalType: 'string', type: 'string' },
    ],
    name: 'setProfileURIFor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link accControlAbi}__
 */
export const useReadAccControl = /*#__PURE__*/ createUseReadContract({
  abi: accControlAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"AI_ORACLE_ROLE"`
 */
export const useReadAccControlAiOracleRole =
  /*#__PURE__*/ createUseReadContract({
    abi: accControlAbi,
    functionName: 'AI_ORACLE_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"DAO_MEMBER_ROLE"`
 */
export const useReadAccControlDaoMemberRole =
  /*#__PURE__*/ createUseReadContract({
    abi: accControlAbi,
    functionName: 'DAO_MEMBER_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 */
export const useReadAccControlDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: accControlAbi,
    functionName: 'DEFAULT_ADMIN_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"VALIDATOR_ROLE"`
 */
export const useReadAccControlValidatorRole =
  /*#__PURE__*/ createUseReadContract({
    abi: accControlAbi,
    functionName: 'VALIDATOR_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"getRoleAdmin"`
 */
export const useReadAccControlGetRoleAdmin =
  /*#__PURE__*/ createUseReadContract({
    abi: accControlAbi,
    functionName: 'getRoleAdmin',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"hasRole"`
 */
export const useReadAccControlHasRole = /*#__PURE__*/ createUseReadContract({
  abi: accControlAbi,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadAccControlSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: accControlAbi,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link accControlAbi}__
 */
export const useWriteAccControl = /*#__PURE__*/ createUseWriteContract({
  abi: accControlAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"grantRole"`
 */
export const useWriteAccControlGrantRole = /*#__PURE__*/ createUseWriteContract(
  { abi: accControlAbi, functionName: 'grantRole' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useWriteAccControlRenounceRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: accControlAbi,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useWriteAccControlRevokeRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: accControlAbi,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link accControlAbi}__
 */
export const useSimulateAccControl = /*#__PURE__*/ createUseSimulateContract({
  abi: accControlAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"grantRole"`
 */
export const useSimulateAccControlGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: accControlAbi,
    functionName: 'grantRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useSimulateAccControlRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: accControlAbi,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link accControlAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useSimulateAccControlRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: accControlAbi,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link accControlAbi}__
 */
export const useWatchAccControlEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: accControlAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link accControlAbi}__ and `eventName` set to `"RoleAdminChanged"`
 */
export const useWatchAccControlRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: accControlAbi,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link accControlAbi}__ and `eventName` set to `"RoleGranted"`
 */
export const useWatchAccControlRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: accControlAbi,
    eventName: 'RoleGranted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link accControlAbi}__ and `eventName` set to `"RoleRevoked"`
 */
export const useWatchAccControlRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: accControlAbi,
    eventName: 'RoleRevoked',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daoRegistryAbi}__
 */
export const useReadDaoRegistry = /*#__PURE__*/ createUseReadContract({
  abi: daoRegistryAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"ACC_CONTROL"`
 */
export const useReadDaoRegistryAccControl = /*#__PURE__*/ createUseReadContract(
  { abi: daoRegistryAbi, functionName: 'ACC_CONTROL' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"FINANCE"`
 */
export const useReadDaoRegistryFinance = /*#__PURE__*/ createUseReadContract({
  abi: daoRegistryAbi,
  functionName: 'FINANCE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"RAYAN_CHAIN_DAO"`
 */
export const useReadDaoRegistryRayanChainDao =
  /*#__PURE__*/ createUseReadContract({
    abi: daoRegistryAbi,
    functionName: 'RAYAN_CHAIN_DAO',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"RAYAN_CHAIN_TOKEN"`
 */
export const useReadDaoRegistryRayanChainToken =
  /*#__PURE__*/ createUseReadContract({
    abi: daoRegistryAbi,
    functionName: 'RAYAN_CHAIN_TOKEN',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"STAKING"`
 */
export const useReadDaoRegistryStaking = /*#__PURE__*/ createUseReadContract({
  abi: daoRegistryAbi,
  functionName: 'STAKING',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"USER_PROFILE"`
 */
export const useReadDaoRegistryUserProfile =
  /*#__PURE__*/ createUseReadContract({
    abi: daoRegistryAbi,
    functionName: 'USER_PROFILE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"getAddress"`
 */
export const useReadDaoRegistryGetAddress = /*#__PURE__*/ createUseReadContract(
  { abi: daoRegistryAbi, functionName: 'getAddress' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"owner"`
 */
export const useReadDaoRegistryOwner = /*#__PURE__*/ createUseReadContract({
  abi: daoRegistryAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daoRegistryAbi}__
 */
export const useWriteDaoRegistry = /*#__PURE__*/ createUseWriteContract({
  abi: daoRegistryAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteDaoRegistryRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: daoRegistryAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"setAddress"`
 */
export const useWriteDaoRegistrySetAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: daoRegistryAbi,
    functionName: 'setAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteDaoRegistryTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: daoRegistryAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daoRegistryAbi}__
 */
export const useSimulateDaoRegistry = /*#__PURE__*/ createUseSimulateContract({
  abi: daoRegistryAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateDaoRegistryRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: daoRegistryAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"setAddress"`
 */
export const useSimulateDaoRegistrySetAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: daoRegistryAbi,
    functionName: 'setAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daoRegistryAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateDaoRegistryTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: daoRegistryAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daoRegistryAbi}__
 */
export const useWatchDaoRegistryEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: daoRegistryAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daoRegistryAbi}__ and `eventName` set to `"AddressSet"`
 */
export const useWatchDaoRegistryAddressSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daoRegistryAbi,
    eventName: 'AddressSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daoRegistryAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchDaoRegistryOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daoRegistryAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link financeAbi}__
 */
export const useReadFinance = /*#__PURE__*/ createUseReadContract({
  abi: financeAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"daoAddress"`
 */
export const useReadFinanceDaoAddress = /*#__PURE__*/ createUseReadContract({
  abi: financeAbi,
  functionName: 'daoAddress',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"investments"`
 */
export const useReadFinanceInvestments = /*#__PURE__*/ createUseReadContract({
  abi: financeAbi,
  functionName: 'investments',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"owner"`
 */
export const useReadFinanceOwner = /*#__PURE__*/ createUseReadContract({
  abi: financeAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"platformFeeBps"`
 */
export const useReadFinancePlatformFeeBps = /*#__PURE__*/ createUseReadContract(
  { abi: financeAbi, functionName: 'platformFeeBps' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"releaseFunds"`
 */
export const useReadFinanceReleaseFunds = /*#__PURE__*/ createUseReadContract({
  abi: financeAbi,
  functionName: 'releaseFunds',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"token"`
 */
export const useReadFinanceToken = /*#__PURE__*/ createUseReadContract({
  abi: financeAbi,
  functionName: 'token',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link financeAbi}__
 */
export const useWriteFinance = /*#__PURE__*/ createUseWriteContract({
  abi: financeAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"registerInvestment"`
 */
export const useWriteFinanceRegisterInvestment =
  /*#__PURE__*/ createUseWriteContract({
    abi: financeAbi,
    functionName: 'registerInvestment',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"releaseNextMilestone"`
 */
export const useWriteFinanceReleaseNextMilestone =
  /*#__PURE__*/ createUseWriteContract({
    abi: financeAbi,
    functionName: 'releaseNextMilestone',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteFinanceRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: financeAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"setDaoAddress"`
 */
export const useWriteFinanceSetDaoAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: financeAbi,
    functionName: 'setDaoAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteFinanceTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: financeAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"withdraw"`
 */
export const useWriteFinanceWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: financeAbi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"withdrawTokens"`
 */
export const useWriteFinanceWithdrawTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: financeAbi,
    functionName: 'withdrawTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link financeAbi}__
 */
export const useSimulateFinance = /*#__PURE__*/ createUseSimulateContract({
  abi: financeAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"registerInvestment"`
 */
export const useSimulateFinanceRegisterInvestment =
  /*#__PURE__*/ createUseSimulateContract({
    abi: financeAbi,
    functionName: 'registerInvestment',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"releaseNextMilestone"`
 */
export const useSimulateFinanceReleaseNextMilestone =
  /*#__PURE__*/ createUseSimulateContract({
    abi: financeAbi,
    functionName: 'releaseNextMilestone',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateFinanceRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: financeAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"setDaoAddress"`
 */
export const useSimulateFinanceSetDaoAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: financeAbi,
    functionName: 'setDaoAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateFinanceTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: financeAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"withdraw"`
 */
export const useSimulateFinanceWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: financeAbi,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link financeAbi}__ and `functionName` set to `"withdrawTokens"`
 */
export const useSimulateFinanceWithdrawTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: financeAbi,
    functionName: 'withdrawTokens',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__
 */
export const useWatchFinanceEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: financeAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"DaoAddressSet"`
 */
export const useWatchFinanceDaoAddressSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'DaoAddressSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"FundsDeposited"`
 */
export const useWatchFinanceFundsDepositedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'FundsDeposited',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"FundsReleased"`
 */
export const useWatchFinanceFundsReleasedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'FundsReleased',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"InvestmentCancelled"`
 */
export const useWatchFinanceInvestmentCancelledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'InvestmentCancelled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"InvestmentRegistered"`
 */
export const useWatchFinanceInvestmentRegisteredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'InvestmentRegistered',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"MilestoneReleased"`
 */
export const useWatchFinanceMilestoneReleasedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'MilestoneReleased',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"NativeFundsWithdrawn"`
 */
export const useWatchFinanceNativeFundsWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'NativeFundsWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchFinanceOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"PlatformFeeTaken"`
 */
export const useWatchFinancePlatformFeeTakenEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'PlatformFeeTaken',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link financeAbi}__ and `eventName` set to `"TokenFundsWithdrawn"`
 */
export const useWatchFinanceTokenFundsWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: financeAbi,
    eventName: 'TokenFundsWithdrawn',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__
 */
export const useReadRayanChainDao = /*#__PURE__*/ createUseReadContract({
  abi: rayanChainDaoAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"MAX_RISK_SCORE"`
 */
export const useReadRayanChainDaoMaxRiskScore =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'MAX_RISK_SCORE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"accControl"`
 */
export const useReadRayanChainDaoAccControl =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'accControl',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"approvalThresholdPercentage"`
 */
export const useReadRayanChainDaoApprovalThresholdPercentage =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'approvalThresholdPercentage',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"financeContract"`
 */
export const useReadRayanChainDaoFinanceContract =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'financeContract',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"hasVoted"`
 */
export const useReadRayanChainDaoHasVoted = /*#__PURE__*/ createUseReadContract(
  { abi: rayanChainDaoAbi, functionName: 'hasVoted' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"nextProposalId"`
 */
export const useReadRayanChainDaoNextProposalId =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'nextProposalId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"owner"`
 */
export const useReadRayanChainDaoOwner = /*#__PURE__*/ createUseReadContract({
  abi: rayanChainDaoAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"participationScores"`
 */
export const useReadRayanChainDaoParticipationScores =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'participationScores',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"proposals"`
 */
export const useReadRayanChainDaoProposals =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'proposals',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"quorumPercentage"`
 */
export const useReadRayanChainDaoQuorumPercentage =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'quorumPercentage',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"stakingContract"`
 */
export const useReadRayanChainDaoStakingContract =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'stakingContract',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"startupAccessTokenAddress"`
 */
export const useReadRayanChainDaoStartupAccessTokenAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'startupAccessTokenAddress',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"votingPeriod"`
 */
export const useReadRayanChainDaoVotingPeriod =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainDaoAbi,
    functionName: 'votingPeriod',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__
 */
export const useWriteRayanChainDao = /*#__PURE__*/ createUseWriteContract({
  abi: rayanChainDaoAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"createFundingProposal"`
 */
export const useWriteRayanChainDaoCreateFundingProposal =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'createFundingProposal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"createTreasuryActionProposal"`
 */
export const useWriteRayanChainDaoCreateTreasuryActionProposal =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'createTreasuryActionProposal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"executeProposal"`
 */
export const useWriteRayanChainDaoExecuteProposal =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'executeProposal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"releaseNextMilestone"`
 */
export const useWriteRayanChainDaoReleaseNextMilestone =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'releaseNextMilestone',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteRayanChainDaoRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"setStartupAccessTokenAddress"`
 */
export const useWriteRayanChainDaoSetStartupAccessTokenAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'setStartupAccessTokenAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"tallyVotes"`
 */
export const useWriteRayanChainDaoTallyVotes =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'tallyVotes',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteRayanChainDaoTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"updateParticipationScore"`
 */
export const useWriteRayanChainDaoUpdateParticipationScore =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'updateParticipationScore',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"updateProposalRiskScore"`
 */
export const useWriteRayanChainDaoUpdateProposalRiskScore =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainDaoAbi,
    functionName: 'updateProposalRiskScore',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"vote"`
 */
export const useWriteRayanChainDaoVote = /*#__PURE__*/ createUseWriteContract({
  abi: rayanChainDaoAbi,
  functionName: 'vote',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__
 */
export const useSimulateRayanChainDao = /*#__PURE__*/ createUseSimulateContract(
  { abi: rayanChainDaoAbi },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"createFundingProposal"`
 */
export const useSimulateRayanChainDaoCreateFundingProposal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'createFundingProposal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"createTreasuryActionProposal"`
 */
export const useSimulateRayanChainDaoCreateTreasuryActionProposal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'createTreasuryActionProposal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"executeProposal"`
 */
export const useSimulateRayanChainDaoExecuteProposal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'executeProposal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"releaseNextMilestone"`
 */
export const useSimulateRayanChainDaoReleaseNextMilestone =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'releaseNextMilestone',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateRayanChainDaoRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"setStartupAccessTokenAddress"`
 */
export const useSimulateRayanChainDaoSetStartupAccessTokenAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'setStartupAccessTokenAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"tallyVotes"`
 */
export const useSimulateRayanChainDaoTallyVotes =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'tallyVotes',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateRayanChainDaoTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"updateParticipationScore"`
 */
export const useSimulateRayanChainDaoUpdateParticipationScore =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'updateParticipationScore',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"updateProposalRiskScore"`
 */
export const useSimulateRayanChainDaoUpdateProposalRiskScore =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'updateProposalRiskScore',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `functionName` set to `"vote"`
 */
export const useSimulateRayanChainDaoVote =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainDaoAbi,
    functionName: 'vote',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainDaoAbi}__
 */
export const useWatchRayanChainDaoEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: rayanChainDaoAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `eventName` set to `"MilestoneReleased"`
 */
export const useWatchRayanChainDaoMilestoneReleasedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainDaoAbi,
    eventName: 'MilestoneReleased',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchRayanChainDaoOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainDaoAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `eventName` set to `"ParticipationScoreUpdated"`
 */
export const useWatchRayanChainDaoParticipationScoreUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainDaoAbi,
    eventName: 'ParticipationScoreUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `eventName` set to `"ProposalCreated"`
 */
export const useWatchRayanChainDaoProposalCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainDaoAbi,
    eventName: 'ProposalCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `eventName` set to `"ProposalExecuted"`
 */
export const useWatchRayanChainDaoProposalExecutedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainDaoAbi,
    eventName: 'ProposalExecuted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `eventName` set to `"ProposalStateChanged"`
 */
export const useWatchRayanChainDaoProposalStateChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainDaoAbi,
    eventName: 'ProposalStateChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainDaoAbi}__ and `eventName` set to `"Voted"`
 */
export const useWatchRayanChainDaoVotedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainDaoAbi,
    eventName: 'Voted',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainTokenAbi}__
 */
export const useReadRayanChainToken = /*#__PURE__*/ createUseReadContract({
  abi: rayanChainTokenAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"allowance"`
 */
export const useReadRayanChainTokenAllowance =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainTokenAbi,
    functionName: 'allowance',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadRayanChainTokenBalanceOf =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainTokenAbi,
    functionName: 'balanceOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"decimals"`
 */
export const useReadRayanChainTokenDecimals =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainTokenAbi,
    functionName: 'decimals',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"name"`
 */
export const useReadRayanChainTokenName = /*#__PURE__*/ createUseReadContract({
  abi: rayanChainTokenAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"owner"`
 */
export const useReadRayanChainTokenOwner = /*#__PURE__*/ createUseReadContract({
  abi: rayanChainTokenAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadRayanChainTokenSymbol = /*#__PURE__*/ createUseReadContract(
  { abi: rayanChainTokenAbi, functionName: 'symbol' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadRayanChainTokenTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: rayanChainTokenAbi,
    functionName: 'totalSupply',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainTokenAbi}__
 */
export const useWriteRayanChainToken = /*#__PURE__*/ createUseWriteContract({
  abi: rayanChainTokenAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteRayanChainTokenApprove =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainTokenAbi,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteRayanChainTokenRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainTokenAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteRayanChainTokenTransfer =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainTokenAbi,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteRayanChainTokenTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainTokenAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteRayanChainTokenTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: rayanChainTokenAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainTokenAbi}__
 */
export const useSimulateRayanChainToken =
  /*#__PURE__*/ createUseSimulateContract({ abi: rayanChainTokenAbi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateRayanChainTokenApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainTokenAbi,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateRayanChainTokenRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainTokenAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateRayanChainTokenTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainTokenAbi,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateRayanChainTokenTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainTokenAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateRayanChainTokenTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: rayanChainTokenAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainTokenAbi}__
 */
export const useWatchRayanChainTokenEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: rayanChainTokenAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchRayanChainTokenApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainTokenAbi,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchRayanChainTokenOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainTokenAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link rayanChainTokenAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchRayanChainTokenTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: rayanChainTokenAbi,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__
 */
export const useReadStaking = /*#__PURE__*/ createUseReadContract({
  abi: stakingAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"delegatedPower"`
 */
export const useReadStakingDelegatedPower = /*#__PURE__*/ createUseReadContract(
  { abi: stakingAbi, functionName: 'delegatedPower' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"delegates"`
 */
export const useReadStakingDelegates = /*#__PURE__*/ createUseReadContract({
  abi: stakingAbi,
  functionName: 'delegates',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"distributeRewards"`
 */
export const useReadStakingDistributeRewards =
  /*#__PURE__*/ createUseReadContract({
    abi: stakingAbi,
    functionName: 'distributeRewards',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"earned"`
 */
export const useReadStakingEarned = /*#__PURE__*/ createUseReadContract({
  abi: stakingAbi,
  functionName: 'earned',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"getStakedAmount"`
 */
export const useReadStakingGetStakedAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: stakingAbi,
    functionName: 'getStakedAmount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"lastUpdateTime"`
 */
export const useReadStakingLastUpdateTime = /*#__PURE__*/ createUseReadContract(
  { abi: stakingAbi, functionName: 'lastUpdateTime' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"owner"`
 */
export const useReadStakingOwner = /*#__PURE__*/ createUseReadContract({
  abi: stakingAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"rewardPerToken"`
 */
export const useReadStakingRewardPerToken = /*#__PURE__*/ createUseReadContract(
  { abi: stakingAbi, functionName: 'rewardPerToken' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"rewardPerTokenStored"`
 */
export const useReadStakingRewardPerTokenStored =
  /*#__PURE__*/ createUseReadContract({
    abi: stakingAbi,
    functionName: 'rewardPerTokenStored',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"rewardRate"`
 */
export const useReadStakingRewardRate = /*#__PURE__*/ createUseReadContract({
  abi: stakingAbi,
  functionName: 'rewardRate',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"rewards"`
 */
export const useReadStakingRewards = /*#__PURE__*/ createUseReadContract({
  abi: stakingAbi,
  functionName: 'rewards',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"rycToken"`
 */
export const useReadStakingRycToken = /*#__PURE__*/ createUseReadContract({
  abi: stakingAbi,
  functionName: 'rycToken',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadStakingTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: stakingAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"userRewardPerTokenPaid"`
 */
export const useReadStakingUserRewardPerTokenPaid =
  /*#__PURE__*/ createUseReadContract({
    abi: stakingAbi,
    functionName: 'userRewardPerTokenPaid',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__
 */
export const useWriteStaking = /*#__PURE__*/ createUseWriteContract({
  abi: stakingAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"claimReward"`
 */
export const useWriteStakingClaimReward = /*#__PURE__*/ createUseWriteContract({
  abi: stakingAbi,
  functionName: 'claimReward',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"delegate"`
 */
export const useWriteStakingDelegate = /*#__PURE__*/ createUseWriteContract({
  abi: stakingAbi,
  functionName: 'delegate',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"fundRewards"`
 */
export const useWriteStakingFundRewards = /*#__PURE__*/ createUseWriteContract({
  abi: stakingAbi,
  functionName: 'fundRewards',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteStakingRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: stakingAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"setRewardRate"`
 */
export const useWriteStakingSetRewardRate =
  /*#__PURE__*/ createUseWriteContract({
    abi: stakingAbi,
    functionName: 'setRewardRate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"stake"`
 */
export const useWriteStakingStake = /*#__PURE__*/ createUseWriteContract({
  abi: stakingAbi,
  functionName: 'stake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteStakingTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: stakingAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"undelegate"`
 */
export const useWriteStakingUndelegate = /*#__PURE__*/ createUseWriteContract({
  abi: stakingAbi,
  functionName: 'undelegate',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"unstake"`
 */
export const useWriteStakingUnstake = /*#__PURE__*/ createUseWriteContract({
  abi: stakingAbi,
  functionName: 'unstake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__
 */
export const useSimulateStaking = /*#__PURE__*/ createUseSimulateContract({
  abi: stakingAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"claimReward"`
 */
export const useSimulateStakingClaimReward =
  /*#__PURE__*/ createUseSimulateContract({
    abi: stakingAbi,
    functionName: 'claimReward',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"delegate"`
 */
export const useSimulateStakingDelegate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: stakingAbi,
    functionName: 'delegate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"fundRewards"`
 */
export const useSimulateStakingFundRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: stakingAbi,
    functionName: 'fundRewards',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateStakingRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: stakingAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"setRewardRate"`
 */
export const useSimulateStakingSetRewardRate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: stakingAbi,
    functionName: 'setRewardRate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"stake"`
 */
export const useSimulateStakingStake = /*#__PURE__*/ createUseSimulateContract({
  abi: stakingAbi,
  functionName: 'stake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateStakingTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: stakingAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"undelegate"`
 */
export const useSimulateStakingUndelegate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: stakingAbi,
    functionName: 'undelegate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link stakingAbi}__ and `functionName` set to `"unstake"`
 */
export const useSimulateStakingUnstake =
  /*#__PURE__*/ createUseSimulateContract({
    abi: stakingAbi,
    functionName: 'unstake',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__
 */
export const useWatchStakingEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: stakingAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__ and `eventName` set to `"Delegated"`
 */
export const useWatchStakingDelegatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: stakingAbi,
    eventName: 'Delegated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchStakingOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: stakingAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__ and `eventName` set to `"RewardClaimed"`
 */
export const useWatchStakingRewardClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: stakingAbi,
    eventName: 'RewardClaimed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__ and `eventName` set to `"RewardDistributed"`
 */
export const useWatchStakingRewardDistributedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: stakingAbi,
    eventName: 'RewardDistributed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__ and `eventName` set to `"RewardFunded"`
 */
export const useWatchStakingRewardFundedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: stakingAbi,
    eventName: 'RewardFunded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__ and `eventName` set to `"RewardRateSet"`
 */
export const useWatchStakingRewardRateSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: stakingAbi,
    eventName: 'RewardRateSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__ and `eventName` set to `"Staked"`
 */
export const useWatchStakingStakedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: stakingAbi,
    eventName: 'Staked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__ and `eventName` set to `"Undelegated"`
 */
export const useWatchStakingUndelegatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: stakingAbi,
    eventName: 'Undelegated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link stakingAbi}__ and `eventName` set to `"Unstaked"`
 */
export const useWatchStakingUnstakedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: stakingAbi,
    eventName: 'Unstaked',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link userProfileAbi}__
 */
export const useReadUserProfile = /*#__PURE__*/ createUseReadContract({
  abi: userProfileAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"metadataURIs"`
 */
export const useReadUserProfileMetadataUrIs =
  /*#__PURE__*/ createUseReadContract({
    abi: userProfileAbi,
    functionName: 'metadataURIs',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"owner"`
 */
export const useReadUserProfileOwner = /*#__PURE__*/ createUseReadContract({
  abi: userProfileAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link userProfileAbi}__
 */
export const useWriteUserProfile = /*#__PURE__*/ createUseWriteContract({
  abi: userProfileAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteUserProfileRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: userProfileAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"setProfileURI"`
 */
export const useWriteUserProfileSetProfileUri =
  /*#__PURE__*/ createUseWriteContract({
    abi: userProfileAbi,
    functionName: 'setProfileURI',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"setProfileURIFor"`
 */
export const useWriteUserProfileSetProfileUriFor =
  /*#__PURE__*/ createUseWriteContract({
    abi: userProfileAbi,
    functionName: 'setProfileURIFor',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteUserProfileTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: userProfileAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link userProfileAbi}__
 */
export const useSimulateUserProfile = /*#__PURE__*/ createUseSimulateContract({
  abi: userProfileAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateUserProfileRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: userProfileAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"setProfileURI"`
 */
export const useSimulateUserProfileSetProfileUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: userProfileAbi,
    functionName: 'setProfileURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"setProfileURIFor"`
 */
export const useSimulateUserProfileSetProfileUriFor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: userProfileAbi,
    functionName: 'setProfileURIFor',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link userProfileAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateUserProfileTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: userProfileAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link userProfileAbi}__
 */
export const useWatchUserProfileEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: userProfileAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link userProfileAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchUserProfileOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: userProfileAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link userProfileAbi}__ and `eventName` set to `"ProfileUpdated"`
 */
export const useWatchUserProfileProfileUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: userProfileAbi,
    eventName: 'ProfileUpdated',
  })
