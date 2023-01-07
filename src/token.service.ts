import { DataV2, createCreateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata'
import { Metaplex, toMetaplexFile } from '@metaplex-foundation/js'
import * as web3 from '@solana/web3.js'
import * as token from '@solana/spl-token'
import * as fs from 'fs'

export async function createNewMint(
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

export async function createTokenAccount(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  owner: web3.PublicKey
) {

  const tokenAccount = await token.getOrCreateAssociatedTokenAccount(connection, payer, mint, owner)
  console.log(`Token Account: ${tokenAccount.address}`)

  return tokenAccount
}

export async function mintTokens(
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

export async function transferTokens(
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

export async function burnTokens(
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

export async function createTokenMetadata(
  connection: web3.Connection,
  metaplex: Metaplex,
  mint: web3.PublicKey,
  user: web3.Keypair,
  name: string,
  symbol: string,
  description: string,
  image_url: string,
) {

  const l = image_url.split('/').length
  const image_name = image_url.split('/')[l - 1]

  const buffer = fs.readFileSync(image_url)
  const file = toMetaplexFile(buffer, image_name)

  const imageUri = await metaplex.storage().upload(file)
  console.log('Image URI:', imageUri)

  // Upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: name,
      description: description,
      image: imageUri,
    })
  console.log('Metadata URI:', uri)

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
