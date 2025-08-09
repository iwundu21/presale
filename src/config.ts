
import { PublicKey } from "@solana/web3.js";

export const PRESALE_WALLET_ADDRESS = "5Gy5qYXhYs7aPfEztAG6vTPVow5snudPksBvF5DAYLpX";
export const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=ef62b792-793e-4ecd-a102-d7cb7f1c023f";

export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mainnet
export const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // Mainnet

// EXN_MINT is removed as it's a simulated token for now.
// A real mint address would be added here in a production environment.
export const EXN_MINT = new PublicKey("D5h2hJZv4z4K3yK1N1j1f1g1H1c1b1A1g1H1c1b1A1g1");

export const EXN_PRICE = 0.09;
export const SOFT_CAP = 500_000_000;
export const HARD_CAP = 700_000_000;
export const EXN_TOKEN_DECIMALS = 9;
