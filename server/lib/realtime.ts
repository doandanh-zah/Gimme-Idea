import { getSupabaseServiceRoleClient } from "./supabase"

type EventPayload = {
  channel: "feedback:new" | "tip:received" | "project:view"
  data: Record<string, unknown>
}

export const emitRealtimeEvent = async ({ channel, data }: EventPayload) => {
  const supabase = getSupabaseServiceRoleClient()
  const { error } = await supabase.functions.invoke("broadcast", {
    body: {
      channel,
      data,
    },
  })

  if (error) {
    throw error
  }
}
