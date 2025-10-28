import { createClient } from "@supabase/supabase-js"

let serviceClient:
  | ReturnType<typeof createClient<unknown, unknown, unknown>>
  | null = null

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!url || !serviceKey) {
    throw new Error("Supabase credentials are not configured")
  }

  return { url, serviceKey }
}

export const getSupabaseServiceRoleClient = () => {
  if (!serviceClient) {
    const { url, serviceKey } = getSupabaseConfig()
    serviceClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return serviceClient
}
