import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// This is a mock of a wallet, if you are building a front-end you can use window.solana or a wallet adapter
export async function initializeKeypair(
  connection: Connection
): Promise<Keypair> {

  if (!process.env.PRIVATE_KEY) {
    console.log('Creating .env file');
    const signer = Keypair.generate();
    fs.writeFileSync('.env', `PRIVATE_KEY=[${signer.secretKey.toString()}]`);
    await airdropSolIfNeeded(signer, connection);

    return signer;
  }

  const secret = JSON.parse(process.env.PRIVATE_KEY ?? '') as number[];
  const secretKey = Uint8Array.from(secret);
  const keypairFromSecretKey = Keypair.fromSecretKey(secretKey);
  await airdropSolIfNeeded(keypairFromSecretKey, connection);

  return keypairFromSecretKey;
}

async function airdropSolIfNeeded(
  signer: Keypair,
  connection: Connection
) {
  const balance = await connection.getBalance(signer.publicKey);
  console.log('Current balance is', balance / LAMPORTS_PER_SOL);

  if (balance < LAMPORTS_PER_SOL) {
    console.log('Airdropping 1 SOL...');
    const airdropSignature = await connection.requestAirdrop(
      signer.publicKey,
      LAMPORTS_PER_SOL
    );

    const latestBlockHash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSignature,
    });

    const newBalance = await connection.getBalance(signer.publicKey);
    console.log('New balance is', newBalance / LAMPORTS_PER_SOL);
  }
}
