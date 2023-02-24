import { Metaplex, bundlrStorage, walletAdapterIdentity, keypairIdentity } from '@metaplex-foundation/js'
import { createTokenMetadata } from './token.service';
import { initializeKeypair } from './initializeKeypair'
import { Connection, PublicKey, clusterApiUrl, Keypair } from '@solana/web3.js'

const TOKEN_NAME = 'Token Name'
const TOKEN_SYMBOL = 'TKN'
const TOKEN_DESCRIPTION = 'My first token!'
const TOKEN_IMAGE_URL = './assets/token-image.png'     // Tamaño aprox. 100x100

const MINT_ADDRESS = 'GA1eaCUTxQ1py7EujsiAm4DDvEfhAq8vsbEQ5Yvh3umx'

async function main() {

  const connection = new Connection(clusterApiUrl('devnet'))

  const wallet = await initializeKeypair(connection)



  // Metaplex setup
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    // .use(walletAdapterIdentity(wallet))
    .use(
      bundlrStorage({   // Storage de la imagen
        address: 'https://devnet.bundlr.network',
        providerUrl: 'https://api.devnet.solana.com',
        timeout: 60000,
      })
    )



  // Creamos MetadataAccount del token (https://docs.metaplex.com/programs/token-metadata/overview)
  await createTokenMetadata(
    connection,
    metaplex,
    new PublicKey(MINT_ADDRESS),
    wallet,
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DESCRIPTION,
    TOKEN_IMAGE_URL,
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
