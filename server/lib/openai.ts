import OpenAI from "openai"

let client: OpenAI | null = null

const getOpenAiApiKey = () => {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured")
  }
  return key
}

export const getOpenAIClient = () => {
  if (!client) {
    client = new OpenAI({
      apiKey: getOpenAiApiKey(),
    })
  }
  return client
}
