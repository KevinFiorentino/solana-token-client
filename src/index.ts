import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from "@solana/spl-token"

import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile } from "@metaplex-foundation/js"
import { DataV2, createCreateMetadataAccountV2Instruction, createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata"
import * as fs from "fs"

async function createNewMint(
  connection: web3.Connection,
  payer: web3.Keypair,
  mintAuthority: web3.PublicKey,
  freezeAuthority: web3.PublicKey,
  decimals: number
): Promise<web3.PublicKey> {

  const tokenMint = await token.createMint(connection, payer, mintAuthority, freezeAuthority, decimals);
  console.log(`Token Mint: ${tokenMint}`)

  return tokenMint;
}

async function createTokenAccount(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  owner: web3.PublicKey
) {

  const tokenAccount = await token.getOrCreateAssociatedTokenAccount(connection, payer, mint, owner)
  console.log(`Token Account: ${tokenAccount.address}`)

  return tokenAccount
}

async function mintTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  destination: web3.PublicKey,
  authority: web3.Keypair,
  amount: number
) {
  const mintInfo = await token.getMint(connection, mint)

  const transactionSignature = await token.mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount * 10 ** mintInfo.decimals
  )

  console.log(`Mint Token Transaction: ${transactionSignature}`)
}

async function transferTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  source: web3.PublicKey,
  destination: web3.PublicKey,
  owner: web3.PublicKey,
  amount: number,
  mint: web3.PublicKey
) {
  const mintInfo = await token.getMint(connection, mint)

  const transactionSignature = await token.transfer(
    connection,
    payer,
    source,
    destination,
    owner,
    amount * 10 ** mintInfo.decimals
  )

  console.log(`Transfer Transaction: ${transactionSignature}`)
}

async function burnTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  account: web3.PublicKey,
  mint: web3.PublicKey,
  owner: web3.Keypair,
  amount: number
) {

  const mintInfo = await token.getMint(connection, mint)

  const transactionSignature = await token.burn(
    connection,
    payer,
    account,
    mint,
    owner,
    amount * 10 ** mintInfo.decimals
  )

  console.log(`Burn Transaction: ${transactionSignature}`)
}

async function createTokenMetadata(
  connection: web3.Connection,
  metaplex: Metaplex,
  mint: web3.PublicKey,
  user: web3.Keypair,
  name: string,
  symbol: string,
  description: string
) {

  const buffer = fs.readFileSync("./assets/WTTM.png")
  const file = toMetaplexFile(buffer, "WTTM.png")

  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

  // Upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: name,
      description: description,
      image: imageUri,
    })
  console.log("metadata uri:", uri)

  // Get metadata account address
  const metadataPDA = metaplex.nfts().pdas().metadata({mint})

  // Onchain metadata format
  const tokenMetadata = {
    name: name,
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  } as DataV2

  // Transaction to create metadata account
  const transaction = new web3.Transaction().add(
    createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataPDA,
        mint: mint,
        mintAuthority: user.publicKey,
        payer: user.publicKey,
        updateAuthority: user.publicKey,
      },
      {
        createMetadataAccountArgsV2: {
          data: tokenMetadata,
          isMutable: true,
        },
      }
    )
  )

  const transactionSignature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [user]
  )

  console.log(`Create Metadata Account: ${transactionSignature}`)
}



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

  const MINT_ADDRESS = "GembXivEuz6sBcHPFayKXN3vLGDzYN4uMz15VowLdaSy"

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
    "Pink Floyd",              // Token name
    "WTTM",                    // Token symbol 
    "Welcome to the Machine"   // Token description
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
