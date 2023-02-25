import { initializeKeypair } from './initializeKeypair'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'

// import { createNewMint, createTokenAccount, mintTokens, transferTokens, burnTokens } from './token.service';
import { createNewMint, createTokenAccount, mintTokens, transferTokens, burnTokens } from './token-instruction.service';

const ADDRESS_RECEIVER = 'Giv8zTCnvxwFHMSnuZ4Q9EoHASzxxwKstuPchGX395Vk'

async function main() {

  const connection = new Connection(clusterApiUrl('devnet'))

  // Create or get the wallet from .env
  // This wallet will get the token authority
  const wallet = await initializeKeypair(connection)

  // Create new MintAccount (https://docs.metaplex.com/programs/token-metadata/overview)
  const mint = await createNewMint(connection, wallet, wallet.publicKey, wallet.publicKey, 2)

  // Create TokenAccount associated to the wallet
  const tokenAccount = await createTokenAccount(connection, wallet, mint, wallet.publicKey)

  // Mint 100 tokens, only the token authority can do it
  await mintTokens(connection, wallet, mint, tokenAccount.address, wallet, 100)

  // Send 50 tokens to ADDRESS_RECEIVER
  const receiver = new PublicKey(ADDRESS_RECEIVER)
  const receiverTokenAccount = await createTokenAccount(connection, wallet, mint, receiver)
  await transferTokens(
    connection,
    wallet,
    tokenAccount.address,
    receiverTokenAccount.address,
    wallet.publicKey,
    2,
    mint
  )
}

main()
  .then(() => {
    console.log('Finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })
