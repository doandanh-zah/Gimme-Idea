import { NextResponse } from "next/server"

import { ApiError, handleError } from "@/lib/errors"
import { tipVerifySchema } from "@/lib/validation"
import { verifySolanaTransaction } from "@/lib/solana"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { signature } = tipVerifySchema.parse(body)

    const transaction = await verifySolanaTransaction(signature)

    if (!transaction) {
      throw new ApiError(404, "TRANSACTION_NOT_FOUND", "Transaction not found on Solana")
    }

    return NextResponse.json({
      signature,
      slot: transaction.slot,
      err: transaction.meta?.err ?? null,
    })
  } catch (error) {
    return handleError(error)
  }
}
