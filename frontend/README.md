
# Gimme Idea - Solana Feedback Platform

## 1. Introduction
**Gimme Idea** is a decentralized platform where Solana developers showcase projects, receive community feedback, audit code, and earn bounties in USDC.

---

## 2. Backend & Database Architecture (Recommended Stack)

To fully support the current frontend features, the following stack is recommended:

*   **Runtime:** Node.js (TypeScript).
*   **Framework:** **NestJS** (Scalable & Typed) or **Express** (Lightweight).
*   **Database:** **PostgreSQL** (Use **Prisma ORM** to map types exactly to Frontend interfaces).
*   **Realtime:** **Socket.io** (For live comments/notifications) or **Supabase Realtime**.

---

## 3. 🗺️ API Specification & Backend Implementation Guide

This section details the backend logic required for every interactive button in the new UI components.

### A. Authentication & User Profile
**UI Components:** `WalletModal.tsx`, `Profile.tsx`, `Navbar.tsx`

*   **Connect Wallet (Login)**
    *   **Frontend Action:** User signs a message via Solana Wallet Adapter.
    *   **Endpoint:** `POST /api/auth/login`
    *   **Payload:** `{ "walletAddress": "...", "signature": "..." }`
    *   **Backend Logic:** 
        1. Verify signature using `@solana/web3.js` (`nacl.sign.detached.verify`).
        2. Find or Create User in DB.
        3. Issue JWT Token.

*   **Save Profile Changes**
    *   **Button:** "Save Changes" (Profile Page)
    *   **Endpoint:** `PUT /api/users/profile`
    *   **Payload:**
        ```json
        {
          "username": "sol_builder",
          "bio": "Building DeFi protocols...",
          "avatar": "base64_string...", 
          "socials": { "twitter": "...", "github": "..." }
        }
        ```

### B. Project & Idea Submission (Wallet Gated)
**UI Component:** `SubmissionModal.tsx`, `ConnectReminderModal.tsx`

*   **Wallet Gating:** 
    The frontend enforces wallet connection via `ConnectReminderModal`. The backend **MUST** verify the presence of a valid `Authorization` header (JWT) for all submission endpoints.
    
    *   **Endpoint:** `POST /api/projects`
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Payload:**
        ```json
        {
          "type": "project", // or "idea"
          "title": "SolStream Protocol",
          "description": "Full description...",
          "category": "DeFi", 
          "stage": "Prototype",
          "tags": ["Rust", "ZK"],
          "website": "https://...",
          "bounty": 500, // Optional (USDC)
          "image": "base64_string...",
          // Idea specific fields
          "problem": "...",
          "solution": "...",
          "isAnonymous": false
        }
        ```
    *   **Error Handling:** If token is missing, return `401 Unauthorized`.

### C. Financial Interactions (USDC Transactions)
**UI Components:** `PaymentModal.tsx`, `Donate.tsx`

The frontend simulates the transaction or uses Wallet Adapter to send SOL/SPL tokens. The backend must **verify** these transactions on-chain.

*   **Button:** "Send Donation" (Donate Page)
    *   **Requirement:** User must be connected. Frontend now enforces this via `ConnectReminderModal`.
    *   **Frontend Action:** Sends USDC to Platform Wallet.
    *   **Endpoint:** `POST /api/donations/verify`
    *   **Payload:** 
        ```json
        { 
          "txHash": "signature_string...", 
          "amount": 50, 
          "fromWallet": "User_Address" 
        }
        ```
    *   **Backend Logic:** 
        1. `connection.getParsedTransaction(txHash)`.
        2. Verify receiver == Platform Wallet Address.
        3. Verify amount >= payload amount.
        4. Record in `Donations` table and update `Leaderboard`.

*   **Button:** "Tip USDC" (Comment Section)
    *   **Frontend Action:** Sends USDC to Comment Author.
    *   **Endpoint:** `POST /api/tips/verify`
    *   **Payload:** `{ "txHash": "...", "amount": 5, "commentId": "...", "toUserWallet": "..." }`
    *   **Logic:** Verify transaction. Increase `tips` counter on the Comment record. Send notification to recipient.

### D. Engagement & Social
**UI Components:** `ProjectDetail.tsx`, `IdeaDetail.tsx`

*   **Button:** "Send" (Post Comment/Reply)
    *   **Endpoint:** `POST /api/comments`
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Payload:** 
        ```json
        { 
          "projectId": "...", 
          "content": "...", 
          "isAnonymous": false, 
          "parentId": "optional_comment_id" 
        }
        ```
    *   **Realtime:** Emit `new_comment` event via Socket.io to all users viewing the project.

*   **Button:** "Thumbs Up" (Vote Project)
    *   **Endpoint:** `POST /api/projects/:id/vote`
    *   **Logic:** One vote per user per project. Store in `ProjectVotes` table.

---

## 4. Transaction Verification Code Snippet (Node.js)

Use this snippet in your backend to verify USDC transfers:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

const SOLANA_RPC = 'https://api.devnet.solana.com'; 
const USDC_MINT = '4zMMC9...'; // Devnet or Mainnet USDC Mint Address
const connection = new Connection(SOLANA_RPC);

async function verifyTransaction(txHash: string, expectedAmount: number, expectedReceiver: string) {
    try {
        const tx = await connection.getParsedTransaction(txHash, { commitment: 'confirmed' });
        if (!tx) throw new Error("Transaction not found");

        // Logic to parse inner instructions for SPL Token Transfer
        // 1. Find instruction where programId == Token Program
        // 2. Check destination == expectedReceiver associated token account
        // 3. Check amount == expectedAmount
        
        return true; 
    } catch (e) {
        console.error(e);
        return false;
    }
}
```

## 5. Deployment Environment Variables

*   **Frontend:**
    *   `NEXT_PUBLIC_API_URL`: Backend URL.
    *   `NEXT_PUBLIC_RPC_URL`: Solana RPC Endpoint.
*   **Backend:**
    *   `DATABASE_URL`: Postgres Connection String.
    *   `JWT_SECRET`: Auth Secret.
    *   `PLATFORM_WALLET_ADDRESS`: Wallet to receive donations.

---
*Created by Gimme Idea Team*
