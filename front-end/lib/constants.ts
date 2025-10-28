export const WALLET_TYPES = [
  { name: "Phantom", icon: "👻" },
  { name: "Solflare", icon: "☀️" },
  { name: "MetaMask", icon: "🦊" },
  { name: "Passkey", icon: "🔑" },
] as const

export const PROJECT_CATEGORIES = [
  "DeFi",
  "NFT",
  "Gaming",
  "Social",
  "Infrastructure",
  "DAO",
  "Metaverse",
  "Other",
] as const

export const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "popular", label: "Most Popular" },
  { value: "top-rated", label: "Top Rated" },
] as const

export const AI_CREDITS_PER_USER = 5
