# Gimme Idea - Site Demo

A simplified demo version of Gimme Idea platform with core functionalities.

## Features

### ✅ Core Features
1. **Connect Wallet** (via Lazorkit passkey)
2. **Create/Submit Ideas**
3. **View Ideas List**
4. **Tip Ideas** (SOL transactions)
5. **Vote on Ideas**
6. **Comment on Ideas**

### 🏗️ Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Wallet**: Lazorkit (Passkey-based smart wallet)
- **Blockchain**: Solana (Devnet)
- **Database**: Supabase (PostgreSQL)

## Getting Started

### 1. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema in `database/sitedemo_schema.sql`
3. Copy your project URL and anon key from Settings > API

### 2. Setup Frontend

```bash
cd sitedemo/frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

Open [http://localhost:3002](http://localhost:3002)

## Project Structure

```
sitedemo/
├── database/
│   └── sitedemo_schema.sql  # Database schema + RLS policies
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Home page with ideas list
│   │   ├── layout.tsx       # Root layout
│   │   └── idea/[id]/       # Idea detail page
│   ├── components/
│   │   ├── Navbar.tsx       # Navigation with wallet connect
│   │   ├── IdeaCard.tsx     # Idea card component
│   │   ├── CreateIdeaModal.tsx
│   │   ├── TipModal.tsx     # SOL tip modal
│   │   └── WalletButton.tsx
│   ├── contexts/
│   │   └── WalletContext.tsx # Lazorkit wallet provider
│   └── lib/
│       ├── supabase.ts      # Supabase client & queries
│       └── api.ts           # API wrapper
└── README.md
```

## Environment Variables

```env
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Solana (optional - defaults to devnet)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.devnet.lazorkit.com/
```

## How It Works

1. **Authentication**: Users connect via Lazorkit passkey wallet. The wallet address is used as unique identifier in Supabase.

2. **Create Ideas**: Connected users can submit new ideas with title, description, problem, solution, and tags.

3. **Vote**: Users can vote once per idea. Votes are tracked to prevent duplicates.

4. **Tip**: Users can send SOL tips directly to idea creators via Solana transactions. Transactions are recorded in Supabase.

5. **Comments**: Users can discuss ideas through comments.
