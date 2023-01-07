import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js"
import { createNewMint, createTokenAccount, mintTokens, transferTokens, burnTokens, createTokenMetadata } from './token.service';
import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"

const ADDRESS_RECEIVER = "Giv8zTCnvxwFHMSnuZ4Q9EoHASzxxwKstuPchGX395Vk"

async function main() {

  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))

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
  const receiver = new web3.PublicKey(ADDRESS_RECEIVER)
  const receiverTokenAccount = await createTokenAccount(connection, wallet, mint, receiver)
  await transferTokens(
    connection,
    wallet,
    tokenAccount.address,
    receiverTokenAccount.address,
    wallet.publicKey,
    50,
    mint
  )
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })


/*

Token Mint: ERm5wCe9xmA9fgzfiJpHv54N1TNvQ5w4zfoEt8nz8JV1
Token Account: 7rUsbRnFu8VHUnRCr1NpKr5PdHQkhi3Y9fWUvL97WXKJ
Mint Token Transaction: 2hVDQVmpSYNT8c1wgC5NvD6yJDFRYmF9ekRiV9icj4A4eGkvJxnMWXsz1Ne1xcpyRKvrjfcbE3WFxuPQRHwE91UU
Token Account: 2Vy5Ef4dQDamvYA8CcjwpMRUFAq1rQgPg4mDkufDRhc6
Transfer Transaction: 2DzSEEbvZVhRffvfJ6pQcS3yz6jccCTQ6BUarCk6ecDngioY3hxjBQe7PTX38KCLUfftLVXKDKACDCH19YBJ48Ge
Finished successfully

Token Mint: GembXivEuz6sBcHPFayKXN3vLGDzYN4uMz15VowLdaSy
Token Account: 7Rbmig3fcWUE6LvRv6h1ybZRMR8MbyJCpza3zjDZVuBR
Mint Token Transaction: 4khks3uxvsvcdrVzfhRfktMj2edPZJECBtEfzUzd7gKvWnhZ7GAcW824UD5PdCBwWeXgMGTxCCx1fJeLRASjwuSb
Token Account: 6bp6XBWuCQ78Q5V4zvwLp3ybviXcTBUxpZfy7eszqazB
Transfer Transaction: 2CPM6Qv1byYKVDduj9s2sXJJXcyV2n8bHUuiqno8WKC26KFKJRkNhQCcHPnaHvaspQvYRXpfJhTHs4opud7oh9mE
Finished successfully

*/
