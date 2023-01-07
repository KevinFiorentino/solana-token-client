import { DataV2, createCreateMetadataAccountV2Instruction, createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata"
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile } from "@metaplex-foundation/js"
import { createNewMint, createTokenAccount, mintTokens, transferTokens, burnTokens, createTokenMetadata } from './token.service';
import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from "@solana/spl-token"
import * as fs from "fs"

const TOKEN_NAME = 'Pink Floyd'
const TOKEN_SYMBOL = 'WTTM'
const TOKEN_DESCRIPTION = 'Welcome to the Machine'

const MINT_ADDRESS = "GembXivEuz6sBcHPFayKXN3vLGDzYN4uMz15VowLdaSy"   // Address principal del token fungible


async function main() {

  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  /* const mint = await createNewMint(connection, user, user.publicKey, user.publicKey, 2)

  const tokenAccount = await createTokenAccount(connection, user, mint, user.publicKey)
  await mintTokens(connection, user, mint, tokenAccount.address, user, 100)

  const receiver = new web3.PublicKey('9BvQr37W6ohEKk3aHrTZ9gRAN2RK1LuUGPmKn5C2H6XC')

  const receiverTokenAccount = await createTokenAccount(connection, user, mint, receiver)
  await transferTokens(
    connection,
    user,
    tokenAccount.address,
    receiverTokenAccount.address,
    user.publicKey,
    50,
    mint
  ) */

  // Metaplex setup
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    )
  
  // Calling the token 
  await createTokenMetadata(
    connection,
    metaplex,
    new web3.PublicKey(MINT_ADDRESS),
    user,
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DESCRIPTION
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
