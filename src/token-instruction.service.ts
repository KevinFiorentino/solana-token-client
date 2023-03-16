import { DataV2, createCreateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex, toMetaplexFile } from '@metaplex-foundation/js';
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js';
import {
  getMint, getAccount, createInitializeMintInstruction, createMintToInstruction, createTransferInstruction, createBurnInstruction,
  getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, MINT_SIZE, MintLayout,
  TokenAccountNotFoundError, TokenInvalidAccountOwnerError
} from '@solana/spl-token';
import * as fs from 'fs';

// Source: https://www.programcreek.com/typescript/?api=@solana/spl-token.createInitializeMintInstruction

/*
  You can sign and send the transaction like this:
  const transactionSigned = await window.solana.signTransaction(transaction);
  const tx = await connection.sendRawTransaction(transactionSigned.serialize());
*/

export async function createNewMint(
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,          // Address with permissions to create new tokens
  freezeAuthority: PublicKey,        // Address with permissions to freeze the creation of new tokens (centralization)
  decimals: number
): Promise<PublicKey> {

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

  console.log('Token Mint:', tokenMint.publicKey.toString());

  return tokenMint.publicKey;
}

export async function createTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
) {

  // ATA = Associated Token Address
  const ATA = await getAssociatedTokenAddress(mint, owner, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

  let account;

  try {
    account = await getAccount(connection, ATA, 'confirmed', TOKEN_PROGRAM_ID);
  }
  catch (error) {
    if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
      try {
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            payer.publicKey,
            ATA,
            owner,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          )
        );
        const transactionSignature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [payer]
        );
      }
      catch (error) {}
      account = await getAccount(connection, ATA, 'confirmed', TOKEN_PROGRAM_ID);
    }
    else {
      throw error;
    }
  }

  console.log(`Token Account: ${account.address}`);

  return account;
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

  const mintInfo = await getMint(connection, mint);
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

  const mintInfo = await getMint(connection, mint);
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
      name: name,
      description: description,
      image: imageUri,
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
  );

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [user]
  );

  console.log(`Create Metadata Account: ${transactionSignature}`);
}
