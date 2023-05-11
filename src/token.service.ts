import { DataV2, createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex, toMetaplexFile } from '@metaplex-foundation/js';
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { Account, createMint, getMint, mintTo, transfer, burn, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as fs from 'fs';

export async function createNewMint(
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,          // Address with permissions to create new tokens
  freezeAuthority: PublicKey,        // Address with permissions to freeze the creation of new tokens (centralization)
  decimals: number
): Promise<PublicKey> {

  const tokenMint = await createMint(connection, payer, mintAuthority, freezeAuthority, decimals);
  console.log(`Token Mint: ${tokenMint}`);

  return tokenMint;
}

export async function createTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<Account> {

  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, owner);
  console.log(`Token Account: ${tokenAccount.address}`);

  return tokenAccount;
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
  const transactionSignature = await mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount * 10 ** mintInfo.decimals
  );

  console.log(`Mint Token Transaction: ${transactionSignature}`);
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
  const transactionSignature = await transfer(
    connection,
    payer,
    source,
    destination,
    owner,
    amount * 10 ** mintInfo.decimals
  );

  console.log(`Transfer Transaction: ${transactionSignature}`);
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
  const transactionSignature = await burn(
    connection,
    payer,
    account,
    mint,
    owner,
    amount * 10 ** mintInfo.decimals
  );

  console.log(`Burn Transaction: ${transactionSignature}`);
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

  const l = image_url.split('/').length;
  const image_name = image_url.split('/')[l - 1];

  const buffer = fs.readFileSync(image_url);
  const file = toMetaplexFile(buffer, image_name);

  const imageUri = await metaplex.storage().upload(file);
  console.log('Image URI:', imageUri);

  // Upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      ipfsImageHash: 'QmevBtvuBezYCHUnmPpvDTjQ6mHANcS4ZnV14MvtYAvzY7',
      image: imageUri,
      type: 'token',
      data: {}
    });
  console.log('Metadata URI:', uri);

  // Get metadata account address
  const metadataPDA = metaplex.nfts().pdas().metadata({mint});

  // Onchain metadata format
  const tokenMetadata = {
    name: name,
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  } as DataV2;

  // Transaction to create metadata account
  const transaction = new Transaction().add(
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mint,
        mintAuthority: user.publicKey,
        payer: user.publicKey,
        updateAuthority: user.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: tokenMetadata,
          isMutable: true,
          collectionDetails: null,
        },
      }
    )
  );

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [user]
  );

  console.log(`Create Metadata Account: ${transactionSignature}`);
}
