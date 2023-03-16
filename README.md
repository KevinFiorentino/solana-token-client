# Solana Fungible Token Client

JS client to create fungible tokens, transfer it and set metadata

## Overview

- **src/index.ts**: principal file to create and transfer tokens
- **src/initializeKeypair.ts**: mock to initialize a wallet with some of SOL
- **src/metadata.ts**: set metadata of previously created token 
- **src/token.service.ts**: simple service with the necessary function to interact with @solana/spl-token
- **src/token-instruction.service.ts**: similar service, but works with an instruction logic to create each transaction

> Use at least NodeJS v18

### 1. Create new token

- Config `ADDRESS_RECEIVER` in `index.ts` file. It is recommended to set the Phantom wallet public key to visualize the tokens subsequently.
- `npm run start`
- Visualize in the Phantom wallet, `ADDRESS_RECEIVER`, the tokens received, without name and logo.

### 2. Set token metadata

- Config in the `metadata.ts` file the name, symbol, description and the token image, besides set the `MINT_ADDRESS` got in the previous step.
- `npm run metadata`
- Visualize the Phantom wallet, `ADDRESS_RECEIVER`, again. The token should have the name and image.
- Visualize the `MINT_ADDRESS` in [Solana Explorer DevNet](https://explorer.solana.com/?cluster=devnet). The token should have metadata, current supply, owner, and among other data.

### 3. Get token metadata

- Config in the `token-info.ts` file the `MINT_ADDRESS` got in the first step.
- `npm run info`
- You can visualize the token information in three parts: the token information, the on-chain metadata, and the off-chain metadata.
