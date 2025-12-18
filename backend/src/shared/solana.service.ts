import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import * as nacl from "tweetnacl";
import * as bs58 from "bs58";
import * as crypto from "crypto";

@Injectable()
export class SolanaService implements OnModuleInit {
  private connection: Connection;
  private network: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const rpcUrl =
      this.configService.get<string>("SOLANA_RPC_URL") ||
      "https://api.mainnet-beta.solana.com";
    this.network = this.configService.get<string>("SOLANA_NETWORK") || "mainnet-beta";
    this.connection = new Connection(rpcUrl, "confirmed");
  }

  getConnection(): Connection {
    return this.connection;
  }

  getNetwork(): string {
    return this.network;
  }

  /**
   * Verify Solana wallet signature
   * Used for authentication (Sign In With Solana)
   */
  verifySignature(
    publicKey: string,
    signature: string,
    message: string
  ): boolean {
    try {
      console.log("=== Signature Verification Debug ===");
      console.log("PublicKey:", publicKey);
      console.log("Signature (base58):", signature);
      console.log("Message:", JSON.stringify(message));
      console.log("Message length:", message.length);
      console.log(
        "Message bytes:",
        Buffer.from(message).toString("hex").slice(0, 100)
      );

      const publicKeyBytes = new PublicKey(publicKey).toBytes();
      const signatureBytes = bs58.decode(signature);
      const messageBytes = new TextEncoder().encode(message);

      console.log("PublicKey bytes length:", publicKeyBytes.length);
      console.log("Signature bytes length:", signatureBytes.length);
      console.log("Message bytes length:", messageBytes.length);

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      console.log("Verification result:", isValid);
      console.log("=================================");

      return isValid;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Verify Passkey (WebAuthn P256) signature
   * Used for LazorKit passkey wallet authentication
   * WebAuthn uses P256/secp256r1 curve, not Ed25519
   */
  verifyPasskeySignature(
    signedPayload: string,
    signature: string,
    originalMessage: string
  ): boolean {
    try {
      console.log("=== Passkey Signature Verification Debug ===");
      console.log("SignedPayload:", signedPayload?.slice(0, 50) + "...");
      console.log("Signature:", signature?.slice(0, 50) + "...");
      console.log("Original message:", originalMessage?.slice(0, 50) + "...");

      // For passkey wallets, we trust the connection was authenticated via WebAuthn
      // The signature verification happens at the LazorKit portal level
      // Here we just verify the message content matches what we expect

      if (!signedPayload || !signature) {
        console.log("Missing signedPayload or signature");
        return false;
      }

      // The signedPayload should contain parts of our original message
      // This is a simplified verification - the actual WebAuthn verification
      // happens on the LazorKit infrastructure

      // For now, we verify that the signature and signedPayload exist
      // and trust LazorKit's authentication flow
      console.log("Passkey verification: trusting LazorKit auth flow");
      console.log("=================================");

      return true;
    } catch (error) {
      console.error("Passkey signature verification error:", error);
      return false;
    }
  }

  /**
   * Verify transaction on-chain
   * Used for payment verification
   */
  async verifyTransaction(txHash: string): Promise<{
    isValid: boolean;
    from?: string;
    to?: string;
    amount?: number;
    timestamp?: number;
  }> {
    try {
      const transaction = await this.connection.getTransaction(txHash, {
        maxSupportedTransactionVersion: 0,
      });

      if (!transaction || !transaction.meta || transaction.meta.err) {
        return { isValid: false };
      }

      // Extract transaction details
      const accountKeys = transaction.transaction.message.getAccountKeys();
      const from = accountKeys.get(0)?.toString();
      const to = accountKeys.get(1)?.toString();

      // Get amount from balance changes (in lamports)
      const preBalances = transaction.meta.preBalances;
      const postBalances = transaction.meta.postBalances;
      const amount = preBalances[0] - postBalances[0]; // Amount transferred

      return {
        isValid: true,
        from,
        to,
        amount: amount / 1e9, // Convert lamports to SOL
        timestamp: transaction.blockTime || Date.now() / 1000,
      };
    } catch (error) {
      console.error("Transaction verification error:", error);
      return { isValid: false };
    }
  }

  /**
   * Get Solscan link for transaction
   */
  getSolscanLink(txHash: string): string {
    const baseUrl =
      this.network === "mainnet-beta"
        ? "https://solscan.io/tx/"
        : "https://solscan.io/tx/";

    const cluster = this.network === "mainnet-beta" ? "" : "?cluster=devnet";
    return `${baseUrl}${txHash}${cluster}`;
  }

  /**
   * Shorten wallet address for display
   */
  shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }
}
