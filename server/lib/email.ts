import { getSupabaseServiceRoleClient } from "./supabase"
import { APP_DOMAIN } from "./constants"

const getEmailFrom = () => {
  const sender = process.env.EMAIL_FROM
  if (!sender) {
    throw new Error("EMAIL_FROM is not configured")
  }
  return sender
}

type SendVerificationParams = {
  email: string
  token: string
}

export const sendVerificationEmail = async ({ email, token }: SendVerificationParams) => {
  const supabase = getSupabaseServiceRoleClient()
  const from = getEmailFrom()
  const verificationUrl = `${APP_DOMAIN}/auth/verify-email?token=${token}`

  const { error } = await supabase.functions.invoke("send-email", {
    body: {
      from,
      to: email,
      subject: "Verify your Gimme Idea account",
      html: `
        <p>Hi there,</p>
        <p>Thanks for joining Gimme Idea! Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, you can ignore this email.</p>
        <p>— Gimme Idea Team</p>
      `,
    },
  })

  if (error) {
    throw error
  }
}
