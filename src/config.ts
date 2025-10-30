
import { PublicKey } from "@solana/web3.js";

export const PRESALE_WALLET_ADDRESS = "B23Lt4oFVzVYsqnUNkyz1yjzbobZXDik3Cbt8PQgDyYX";
export const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=ef62b792-793e-4ecd-a102-d7cb7f1c023f";

export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mainnet

// EXN Token does not have a mint address yet. Distribution will be done later.
// We will track contributions and calculate balances off-chain (client-side).

// NOTE: The EXN_PRICE and HARD_CAP are now managed from the Admin Dashboard and fetched dynamically.
// These values are used as fallbacks only.
export const EXN_PRICE = 0.09;
export const EXN_TOKEN_DECIMALS = 5; // The number of decimals for display purposes

    
