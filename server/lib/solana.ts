import { Connection, PublicKey } from "@solana/web3.js"

const getConnection = () => {
  const endpoint = process.env.SOLANA_RPC_URL
  if (!endpoint) {
    throw new Error("SOLANA_RPC_URL is not configured")
  }
  return new Connection(endpoint, "confirmed")
}

export const verifySolanaTransaction = async (signature: string) => {
  const connection = getConnection()
  const transaction = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  })

  if (!transaction) {
    return null
  }

  return transaction
}

export const validateWalletAddress = (address: string) => {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}
