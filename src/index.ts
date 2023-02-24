import { initializeKeypair } from './initializeKeypair'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'

// import { createNewMint, createTokenAccount, mintTokens, transferTokens, burnTokens } from './token.service';
import { createNewMint, createTokenAccount, mintTokens, transferTokens, burnTokens } from './token-instruction.service';

const ADDRESS_RECEIVER = 'Giv8zTCnvxwFHMSnuZ4Q9EoHASzxxwKstuPchGX395Vk'

async function main() {

  const connection = new Connection(clusterApiUrl('devnet'))

  // Creamos u obtenemos la wallet guardada en el .env
  // La misma tendrá la autoridad del token
  const wallet = await initializeKeypair(connection)

  // Creamos nuevo MintAccount (https://docs.metaplex.com/programs/token-metadata/overview)
  const mint = await createNewMint(connection, wallet, wallet.publicKey, wallet.publicKey, 2)

  // Creamos TokenAccount asociado a la wallet
  const tokenAccount = await createTokenAccount(connection, wallet, mint, wallet.publicKey)

  // Minteamos 100 tokens, solo la autoridad del token puede hacerlo
  await mintTokens(connection, wallet, mint, tokenAccount.address, wallet, 100)

  // Enviamos 50 tokens a ADDRESS_RECEIVER
  const receiver = new PublicKey(ADDRESS_RECEIVER)
  const receiverTokenAccount = await createTokenAccount(connection, wallet, mint, receiver)
  await transferTokens(
    connection,
    wallet,
    tokenAccount.address,
    receiverTokenAccount.address,
    wallet.publicKey,
    1,
    mint
  )
}

main()
  .then(() => {
    console.log('Finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
