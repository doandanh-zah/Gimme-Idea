import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback } from "react";
import { apiClient } from "./api-client";
import bs58 from "bs58";

/**
 * Custom hook for wallet authentication with Sign-In With Solana (SIWS)
 */
export function useWalletAuth() {
  const { publicKey, signMessage, connect, disconnect, wallet, connected } =
    useWallet();

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) {
      throw new Error(
        "Wallet not connected or does not support message signing"
      );
    }

    try {
      // Create message for signing (SIWS pattern)
      const timestamp = new Date().toISOString();
      const message = `Login to GimmeIdea\n\nTimestamp: ${timestamp}\nWallet: ${publicKey.toBase58()}`;

      // Encode message for signing
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const signature = await signMessage(encodedMessage);

      // Convert signature to base58 for backend
      const signatureBase58 = bs58.encode(signature);

      // Send to backend for verification
      const response = await apiClient.login({
        publicKey: publicKey.toBase58(),
        signature: signatureBase58,
        message,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || "Login failed");
      }

      return response.data;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  }, [publicKey, signMessage]);

  const connectAndLogin = useCallback(async () => {
    try {
      // Connect wallet if not already connected
      if (!connected) {
        await connect();
      }

      // Wait for publicKey to be available with timeout
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds total

      while (!publicKey && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      if (!publicKey || !signMessage) {
        throw new Error(
          "Wallet connection timeout or does not support signing"
        );
      }

      // Perform login with signature
      const userData = await login();

      return userData;
    } catch (error: any) {
      console.error("Connect and login error:", error);
      await disconnect();
      throw error;
    }
  }, [connected, connect, login, disconnect, publicKey, signMessage]);

  return {
    publicKey,
    wallet,
    connected,
    login,
    connectAndLogin,
    disconnect,
  };
}
