import { DataV2, createCreateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata'
import { Metaplex, toMetaplexFile } from '@metaplex-foundation/js'
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js'
import {
  getMint, getOrCreateAssociatedTokenAccount, createInitializeMintInstruction, createMintToInstruction, createTransferInstruction, createBurnInstruction,
  TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, MINT_SIZE, MintLayout
} from '@solana/spl-token'
import * as fs from 'fs'

export async function createNewMint(
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,          // Address con permisos para crear nuevos tokens
  freezeAuthority: PublicKey,        // Address con permisos para bloquear la creación de tokens (centralización)
  decimals: number
): Promise<PublicKey> {

  // Source: https://www.programcreek.com/typescript/?api=@solana/spl-token.createInitializeMintInstruction

  const tokenMint = new Keypair();
  const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: tokenMint.publicKey,
      lamports: mintRent,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      tokenMint.publicKey,
      decimals,
      mintAuthority,
      freezeAuthority,
      TOKEN_PROGRAM_ID
    )
  );

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, tokenMint]
  );

  console.log('tokenMint', tokenMint.publicKey.toString())

  return tokenMint.publicKey;
}

export async function createTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
) {

  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, owner)
  console.log(`Token Account: ${tokenAccount.address}`)

  return tokenAccount
}

export async function mintTokens(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  authority: Keypair,
  amount: number
) {

  const mintInfo = await getMint(connection, mint)
  const transaction = new Transaction().add(
    createMintToInstruction(
      mint,
      destination,
      authority.publicKey,
      amount * 10 ** mintInfo.decimals
    )
  );

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  );

  console.log(`Mint Token Transaction: ${transactionSignature}`)
}

export async function transferTokens(
  connection: Connection,
  payer: Keypair,
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: number,
  mint: PublicKey
) {

  const mintInfo = await getMint(connection, mint)
  const transaction = new Transaction().add(
    createTransferInstruction(
      source,                             // Token account address
      destination,                        // Token account address
      owner,
      amount * 10 ** mintInfo.decimals
    )
  );

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  );

  console.log(`Transfer Transaction: ${transactionSignature}`)
}

export async function burnTokens(
  connection: Connection,
  payer: Keypair,
  account: PublicKey,
  mint: PublicKey,
  owner: Keypair,
  amount: number
) {

  const mintInfo = await getMint(connection, mint)
  const transaction = new Transaction().add(
    createBurnInstruction(
      account,
      mint,
      owner.publicKey,
      amount * 10 ** mintInfo.decimals
    )
  );

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  );

  console.log(`Burn Transaction: ${transactionSignature}`)
}

export async function createTokenMetadata(
  connection: Connection,
  metaplex: Metaplex,
  mint: PublicKey,
  user: Keypair,
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
  const transaction = new Transaction().add(
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

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [user]
  )

  console.log(`Create Metadata Account: ${transactionSignature}`)
}
