import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface User {
  id: string;
  wallet: string;
  username: string;
  bio?: string;
  avatar?: string;
  reputation_score: number;
  balance: number;
  created_at: string;
}

export interface Project {
  id: string;
  type: 'project' | 'idea';
  author_id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  tags: string[];
  problem?: string;
  solution?: string;
  votes: number;
  feedback_count: number;
  created_at: string;
  author?: User;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  author?: User;
}

// =============================================
// AUTH / USERS
// =============================================

export async function loginWithWallet(walletAddress: string): Promise<User | null> {
  // Check if user exists
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('wallet', walletAddress)
    .single();

  // If not, create new user
  if (!user) {
    const newUser = {
      wallet: walletAddress,
      username: `user_${walletAddress.slice(0, 8)}`,
      reputation_score: 0,
      balance: 0,
    };

    const { data: created, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }
    user = created;
  } else {
    // Update login count
    await supabase
      .from('users')
      .update({ 
        login_count: (user.login_count || 0) + 1,
        last_login_at: new Date().toISOString()
      })
      .eq('id', user.id);
  }

  return user;
}

export async function getCurrentUser(walletAddress: string): Promise<User | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('wallet', walletAddress)
    .single();
  return data;
}

// =============================================
// IDEAS / PROJECTS
// =============================================

export async function getIdeas(limit = 20, search?: string) {
  let query = supabase
    .from('projects')
    .select(`
      *,
      author:users!projects_author_id_fkey(id, wallet, username, avatar)
    `)
    .eq('type', 'idea')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching ideas:', error);
    return [];
  }
  return data || [];
}

export async function getIdeaById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      author:users!projects_author_id_fkey(id, wallet, username, avatar)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching idea:', error);
    return null;
  }
  return data;
}

export async function createIdea(idea: {
  author_id: string;
  title: string;
  description: string;
  category: string;
  problem?: string;
  solution?: string;
  tags?: string[];
}) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...idea,
      type: 'idea',
      stage: 'Idea',
      votes: 0,
      feedback_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating idea:', error);
    throw error;
  }
  return data;
}

export async function voteIdea(projectId: string, userId: string) {
  // Check if already voted
  const { data: existing } = await supabase
    .from('project_votes')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('Already voted');
  }

  // Insert vote
  const { error: voteError } = await supabase
    .from('project_votes')
    .insert({ project_id: projectId, user_id: userId });

  if (voteError) throw voteError;

  // Increment vote count
  const { data, error } = await supabase.rpc('increment_votes', { project_id: projectId });
  
  // Fallback if RPC doesn't exist
  if (error) {
    const { data: project } = await supabase
      .from('projects')
      .select('votes')
      .eq('id', projectId)
      .single();
    
    await supabase
      .from('projects')
      .update({ votes: (project?.votes || 0) + 1 })
      .eq('id', projectId);
  }

  return true;
}

// =============================================
// COMMENTS
// =============================================

export async function getComments(projectId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:users!comments_user_id_fkey(id, wallet, username, avatar)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  return data || [];
}

export async function createComment(comment: {
  project_id: string;
  user_id: string;
  content: string;
}) {
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select(`
      *,
      author:users!comments_user_id_fkey(id, wallet, username, avatar)
    `)
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
  return data;
}

// =============================================
// TRANSACTIONS (Tips)
// =============================================

export async function recordTransaction(tx: {
  tx_hash: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  type: 'tip' | 'bounty' | 'reward';
  project_id?: string;
  user_id: string;
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...tx,
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording transaction:', error);
    throw error;
  }

  // Update recipient balance
  if (tx.to_wallet) {
    const { data: recipient } = await supabase
      .from('users')
      .select('id, balance')
      .eq('wallet', tx.to_wallet)
      .single();

    if (recipient) {
      await supabase
        .from('users')
        .update({ balance: (recipient.balance || 0) + tx.amount })
        .eq('id', recipient.id);
    }
  }

  return data;
}
