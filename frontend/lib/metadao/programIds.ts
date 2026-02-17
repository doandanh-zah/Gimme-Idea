import { PublicKey } from '@solana/web3.js';

// Sourced from metaDAOproject/local-futarchy config (mainnet binaries dump)
// NOTE: verify on-chain before production use.
export const METADAO_CONDITIONAL_VAULT_PROGRAM_ID = new PublicKey(
  'VLTX1ishMBbcX3rdBWGssxawAo1Q2X2qxYFYqiGodVg'
);

export const METADAO_AUTOCRAT_V0_PROGRAM_ID = new PublicKey(
  'metaRK9dUBnrAdZN6uUDKvxBVKW5pyCbPVmLtUZwtBp'
);

export const METADAO_OPENBOOK_TWAP_PROGRAM_ID = new PublicKey(
  'twAP5sArq2vDS1mZCT7f4qRLwzTfHvf5Ay5R5Q5df1m'
);
