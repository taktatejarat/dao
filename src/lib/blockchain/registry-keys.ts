import { keccak256, toBytes } from 'viem';

// These keys must exactly match the values defined in the DAORegistry.sol contract
export const REGISTRY_KEYS = {
    DAO: keccak256(toBytes("RAYAN_CHAIN_DAO")),
    TOKEN: keccak256(toBytes("RAYAN_CHAIN_TOKEN")),
    FINANCE: keccak256(toBytes("FINANCE")),
    STAKING: keccak256(toBytes("STAKING")),
    ACC_CONTROL: keccak256(toBytes("ACC_CONTROL")),
    USER_PROFILE: keccak256(toBytes("USER_PROFILE")),
} as const;