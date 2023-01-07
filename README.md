# Solana Fungible Token Client

Cliente JS para la creación de tokens fungibles, transferencias y seteo de metadata.

## Overview

- **index.ts**: archivo principal para la creación de tokens
- **initializeKeypair.ts**: inicializador y fondeo de wallet para crear el token
- **metadata.ts**: seteo de metadata en el token luego de crearlo
- **token.service.ts**: servicio con las funciones necesarias para interactuar con tokens

## Create new token

- Configurar el `ADDRESS_RECEIVER` en el `index.ts`, se recomienda colocar la clave publica de una wallet Phantom para visualizar los tokens posteriormente.
- `npm run start`
- Visualizar la wallet anteriormente configurada para visualizar los tokens.

## Set token metadata

- Configurar en `metadata.ts` el nombre, símbolo, descripción e imagen del token, además del `MINT_ADDRESS` obtenido en el paso anterior.
- `npm run metadata`
- Visualizar nuevamente la wallet Phantom, el token ahora debería tener nombre e imagen.
- Buscar con la address del MintAccount en el [Solana Explorer DevNet](https://explorer.solana.com/?cluster=devnet) el token para visualizar la metadata, supply, entre otros datos.
