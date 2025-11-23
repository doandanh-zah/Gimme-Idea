import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

@Injectable()
export class SolanaService implements OnModuleInit {
  private connection: Connection;
  private network: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const rpcUrl = this.configService.get<string>('SOLANA_RPC_URL') || 'https://api.devnet.solana.com';
    this.network = this.configService.get<string>('SOLANA_NETWORK') || 'devnet';
    this.connection = new Connection(rpcUrl, 'confirmed');
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
      const publicKeyBytes = new PublicKey(publicKey).toBytes();
      const signatureBytes = bs58.decode(signature);
      const messageBytes = new TextEncoder().encode(message);

      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );
    } catch (error) {
      console.error('Signature verification error:', error);
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
        maxSupportedTransactionVersion: 0
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
        timestamp: transaction.blockTime || Date.now() / 1000
      };
    } catch (error) {
      console.error('Transaction verification error:', error);
      return { isValid: false };
    }
  }

  /**
   * Get Solscan link for transaction
   */
  getSolscanLink(txHash: string): string {
    const baseUrl = this.network === 'mainnet-beta'
      ? 'https://solscan.io/tx/'
      : 'https://solscan.io/tx/';

    const cluster = this.network === 'mainnet-beta' ? '' : '?cluster=devnet';
    return `${baseUrl}${txHash}${cluster}`;
  }

  /**
   * Shorten wallet address for display
   */
  shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }
}
