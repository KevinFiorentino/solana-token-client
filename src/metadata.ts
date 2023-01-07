import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js"
import { createNewMint, createTokenAccount, mintTokens, transferTokens, burnTokens, createTokenMetadata } from './token.service';
import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"


const TOKEN_NAME = 'Pink Floyd'
const TOKEN_SYMBOL = 'WTTM'
const TOKEN_DESCRIPTION = 'Welcome to the Machine'
const TOKEN_IMAGE_URL = './assets/WTTM.png'           // Tamaño aprox. 100x100

const MINT_ADDRESS = ''


async function main() {

  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))

  const wallet = await initializeKeypair(connection)

  // Metaplex setup
  const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(wallet))
  .use(
    bundlrStorage({   // Storage de la imagen
      address: "https://devnet.bundlr.network",
      providerUrl: "https://api.devnet.solana.com",
      timeout: 60000,
    })
  )
  
  // Creamos MetadataAccount del token (https://docs.metaplex.com/programs/token-metadata/overview)
  await createTokenMetadata(
    connection,
    metaplex,
    new web3.PublicKey(MINT_ADDRESS),
    wallet,
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DESCRIPTION,
    TOKEN_IMAGE_URL,
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
