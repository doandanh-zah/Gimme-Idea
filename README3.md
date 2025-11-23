
# Gimme Idea - Backend Integration & Developer Manual

This is a comprehensive guide to connecting the **Gimme Idea** frontend to a real backend (Supabase/NestJS/Express) and the Solana Blockchain.

---

## 📚 Table of Contents
1.  [Database Schema (Supabase)](#1-database-schema-supabase)
2.  [UI Button & API Mapping (Detailed)](#2-ui-button--api-mapping-detailed)
    *   [Authentication & Wallet](#a-authentication--wallet)
    *   [Navigation & Dashboard](#b-navigation--dashboard)
    *   [Project/Idea Submission](#c-projectidea-submission)
    *   [Project Interactions (Vote, Comment, Tip)](#d-project-interactions)
    *   [Profile Management](#e-profile-management)
3.  [Removing Mock Data (Refactoring Store)](#3-removing-mock-data-refactoring-store)
4.  [Real Solana Transactions](#4-real-solana-transactions)
5.  [Solscan Verification](#5-solscan-verification)

---

## 1. Database Schema (Supabase)

Run these SQL commands in your Supabase **SQL Editor** to create the backend structure.

### Users Table
```sql
create table users (
  wallet_address text primary key,
  username text unique not null,
  avatar text,
  bio text,
  reputation int default 0,
  balance decimal default 0, -- Track tips received
  socials jsonb default '{}'::jsonb, -- { "twitter": "...", "github": "..." }
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### Projects Table
```sql
create table projects (
  id uuid default uuid_generate_v4() primary key,
  type text check (type in ('project', 'idea')),
  title text not null,
  description text not null,
  category text not null,
  stage text not null,
  tags text[],
  website text,
  image_url text,
  bounty_amount decimal,
  
  -- Idea Specific Fields
  problem text,
  solution text,
  opportunity text,
  go_market text,
  team_info text,
  is_anonymous boolean default false,

  votes_count int default 0,
  feedback_count int default 0,
  
  author_wallet text references users(wallet_address),
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### Comments & Votes
```sql
create table comments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  author_wallet text references users(wallet_address),
  content text not null,
  parent_id uuid references comments(id), -- For replies
  is_anonymous boolean default false,
  likes_count int default 0,
  tips_amount decimal default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table project_votes (
  project_id uuid references projects(id) on delete cascade,
  user_wallet text references users(wallet_address),
  primary key (project_id, user_wallet)
);
```

---

## 2. UI Button & API Mapping (Detailed)

Use this section to wire up every button in the UI to your backend.

### A. Authentication & Wallet

| UI Component | Button / Action | File | Frontend Logic to Update | Backend Endpoint Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Navbar** | "Connect" | `components/Navbar.tsx` | Triggers `openWalletModal()` | N/A (Client-side modal) |
| **WalletModal** | "Phantom" / "Solflare" | `components/WalletModal.tsx` | `handleConnect(walletName)` currently mocks wait. **Update:** Use `@solana/wallet-adapter` to connect & sign message. | `POST /api/auth/login` <br> Body: `{ wallet: string, signature: string }` |
| **WalletModal** | Close (X) | `components/WalletModal.tsx` | `closeWalletModal()` | N/A |
| **ConnectReminder** | "Connect Wallet" | `components/ConnectReminderModal.tsx` | Triggers `openWalletModal()` | N/A |

### B. Navigation & Dashboard

| UI Component | Button / Action | File | Frontend Logic to Update | Backend Endpoint Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Filter Buttons (DeFi, NFT...) | `components/Dashboard.tsx` | `setCategoryFilter()` filters local array. **Update:** Call API with query params. | `GET /api/projects?type={type}&category={cat}` |
| **Dashboard** | Search Bar | `components/Navbar.tsx` | `setSearchQuery()` filters local array. **Update:** Debounce input and call API. | `GET /api/projects/search?q={query}` |
| **Dashboard** | "Submit Project" | `components/Dashboard.tsx` | `openSubmitModal('project')` | N/A (Opens Modal) |
| **ProjectCard** | Click Card | `components/ProjectCard.tsx` | `navigateToProject(id)` fetches from store. **Update:** Fetch single project details. | `GET /api/projects/:id` |

### C. Project/Idea Submission

| UI Component | Button / Action | File | Frontend Logic to Update | Backend Endpoint Needed |
| :--- | :--- | :--- | :--- | :--- |
| **SubmissionModal** | "Launch Project" / "Publish" | `components/SubmissionModal.tsx` | `handleSubmit` creates mock object. **Update:** Send FormData to API. | `POST /api/projects` |
| **SubmissionModal** | Image Upload Area | `components/SubmissionModal.tsx` | `handleImageUpload` converts to Base64. **Update:** Upload file to storage, get URL. | `POST /api/upload` (Returns URL) |
| **SubmissionModal** | Anonymous Toggle | `components/SubmissionModal.tsx` | Sets `formData.isAnonymous`. | N/A (Handled in POST body) |

### D. Project Interactions

| UI Component | Button / Action | File | Frontend Logic to Update | Backend Endpoint Needed |
| :--- | :--- | :--- | :--- | :--- |
| **ProjectCard** | Thumbs Up Icon | `components/ProjectCard.tsx` | `handleVote` updates local store. **Update:** Call API to toggle vote. | `POST /api/projects/:id/vote` |
| **ProjectDetail** | "Send" (Comment) | `components/ProjectDetail.tsx` | `handleComment` updates local store. **Update:** Call API. | `POST /api/comments` <br> Body: `{ projectId, content, isAnon }` |
| **ProjectDetail** | "Tip USDC" | `components/ProjectDetail.tsx` | Opens `PaymentModal`. | N/A |
| **PaymentModal** | "Send Contribution" | `components/PaymentModal.tsx` | `handlePayment` simulates delay. **Update:** Trigger Solana Wallet Transaction (See Section 4). | `POST /api/transactions/verify` <br> Body: `{ signature, amount }` |
| **CommentItem** | "Reply" | `components/ProjectDetail.tsx` | `handleReplySubmit`. | `POST /api/comments` <br> Body: `{ parentId, content }` |

### E. Profile Management

| UI Component | Button / Action | File | Frontend Logic to Update | Backend Endpoint Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Profile** | "Save Changes" | `components/Profile.tsx` | `handleSaveProfile` updates local user. **Update:** Send JSON to API. | `PUT /api/users/profile` |
| **Profile** | Edit Project (Pencil) | `components/Profile.tsx` | Opens Edit Modal. | N/A |
| **Profile** | Delete Project (Trash) | `components/Profile.tsx` | `handleDeleteProject`. | `DELETE /api/projects/:id` |
| **Profile** | Save Project (Modal) | `components/Profile.tsx` | `saveProject`. | `PATCH /api/projects/:id` |

---

## 3. Removing Mock Data (Refactoring Store)

You need to modify `lib/store.ts` to fetch data instead of using `PROJECTS` from constants.

### Step 1: Remove Static Data
Open `lib/store.ts`. Change the initial state:
```typescript
// OLD
projects: PROJECTS,

// NEW
projects: [],
```

### Step 2: Add API Actions
Add these functions to the `AppState` interface and the `create` store in `lib/store.ts`.

```typescript
  // In AppState interface
  fetchProjects: () => Promise<void>;
  
  // In create() store definition
  fetchProjects: async () => {
    set({ isLoading: true });
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`);
        const data = await res.json();
        set({ projects: data });
    } catch (error) {
        console.error("Failed to fetch projects", error);
    } finally {
        set({ isLoading: false });
    }
  },

  addProject: async (projectData) => {
      // Replace the local add logic
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(projectData)
          });
          const newProject = await res.json();
          set(state => ({ projects: [newProject, ...state.projects] }));
      } catch (error) {
          console.error(error);
      }
  },
  
  // Repeat similar logic for voteProject, addComment, etc.
```

### Step 3: Initialize in App
Open `App.tsx` and fetch data on load:
```typescript
const { fetchProjects } = useAppStore();

useEffect(() => {
    fetchProjects();
}, []);
```

---

## 4. Real Solana Transactions

To make the **PaymentModal** work with real money, you must replace the mock logic in `components/PaymentModal.tsx`.

### Prerequisites
1.  Install Solana libraries: `npm install @solana/web3.js @solana/wallet-adapter-react`
2.  Ensure `WalletProvider` wraps your app (usually in `app/layout.tsx` or `index.tsx`).

### Update `components/PaymentModal.tsx`

Replace the `handlePayment` function with this code:

```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Inside the component
const { connection } = useConnection();
const { publicKey, sendTransaction } = useWallet();

const handlePayment = async () => {
    if (!publicKey) {
        toast.error("Wallet not connected");
        return;
    }

    setProcessing(true);
    setStatus('loading');

    try {
        // 1. Define Recipient (Platform Wallet or Project Author Wallet)
        // Ideally, fetch this from the project data
        const recipientPubKey = new PublicKey("YOUR_PLATFORM_OR_AUTHOR_WALLET_ADDRESS"); 

        // 2. Create Transaction Instruction
        // Note: This example sends SOL. For USDC, you need SPL Token instructions.
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: recipientPubKey,
                lamports: Number(amount) * LAMPORTS_PER_SOL, // Converting amount to lamports
            })
        );

        // 3. Send & Confirm
        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'processed');

        // 4. Verify with Backend
        // You MUST send the signature to your backend to record the vote/tip in the DB
        await fetch('/api/transactions/verify', {
            method: 'POST',
            body: JSON.stringify({ signature, amount, type: context })
        });

        setTxHash(signature);
        setStatus('success');
        
        if (onConfirm) onConfirm(Number(amount));

    } catch (error) {
        console.error("Transaction failed", error);
        setStatus('error');
        setProcessing(false);
    }
};
```

---

## 5. Solscan Verification

When a transaction is successful, the `PaymentModal` displays a "View on Solscan" link.

1.  **The Link Format:** `https://solscan.io/tx/{signature}?cluster=devnet` (Use `cluster=devnet` while testing, remove for Mainnet).
2.  **How to Verify:**
    *   Click the link.
    *   Look at the **"Status"** field: It must say "Success".
    *   Look at **"Instruction Details"**: Check the "Transfer" action.
    *   **From**: The user's wallet.
    *   **To**: The project author's wallet (or your platform wallet).
    *   **Amount**: Should match what the user entered.

---

## Summary Checklist for Backend Dev

1.  [ ] Set up Supabase project and run SQL scripts.
2.  [ ] Create API Server (NestJS/Express) to handle endpoints listed in Section 2.
3.  [ ] Update `store.ts` to fetch from API instead of using `constants.ts`.
4.  [ ] Update `PaymentModal.tsx` with the Solana transaction code provided in Section 4.
5.  [ ] Deploy backend and set `NEXT_PUBLIC_API_URL` in frontend `.env`.
