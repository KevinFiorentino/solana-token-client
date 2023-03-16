import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { initializeKeypair } from './initializeKeypair'
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

const MINT_ADDRESS = 'BiJFnCBwCtjzRhof98XwBbRmWXfxXxuWjAXPmdpTeeuZ'

// Custom Token example: BiJFnCBwCtjzRhof98XwBbRmWXfxXxuWjAXPmdpTeeuZ

// USDC does not have Metaplex metadata. Why? --> https://solana.stackexchange.com/questions/6182/get-usdc-metadata
// USDC-Dev: Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr

async function main() {

  const connection = new Connection(clusterApiUrl('devnet'))

  const wallet = await initializeKeypair(connection);

  console.log('Token Info:')

  const mint = new PublicKey(MINT_ADDRESS)
  const mintInfo = await getMint(connection, mint)

  console.log('Mint info', mintInfo)
  console.log('Current supply', Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals))

  console.log('---------------')

  console.log('Metadata on-chain:')

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))

  const metadataPda = metaplex.nfts().pdas().metadata({ mint: mint });
  const account = await Metadata.fromAccountAddress(connection, metadataPda);

  console.log('Account', account)
  console.log('Name', account.data.name)
  console.log('Symbol', account.data.symbol)
  console.log('URI', account.data.uri)

  console.log('---------------')

  await fetch(account.data.uri)
    .then(res => res.json())
    .then(m => console.log('Metadata off-chain:', m))
    .catch(err => { throw err });
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
