'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  Plus, 
  Calendar, 
  Trophy, 
  Users, 
  Settings,
  Activity,
  Trash2,
  Edit,
  Eye,
  Clock,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Lock,
  KeyRound,
  Lightbulb,
  Search,
  Bot,
  RefreshCw,
  CheckCircle,
  XCircle,
  Star,
  Award,
  Target,
  FileText,
  ExternalLink,
  Save,
  X,
  ChevronDown,
  Medal,
  Wallet,
  Mail,
  Ban,
  UserCheck,
  UserX,
  Crown,
  TrendingUp,
  DollarSign,
  Swords,
  BarChart3,
  Download,
  Image as ImageIcon,
  CalendarDays,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import BN from 'bn.js';
import { makeFutarchyClient } from '@/lib/metadao/client';
import { META_MINT, MAINNET_USDC, PriceMath } from '@metadaoproject/futarchy/v0.7';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminBadge from '@/components/AdminBadge';
import toast from 'react-hot-toast';

// Access code for admin panel
const ADMIN_ACCESS_CODE = 'gmi@2025--';
const ACCESS_STORAGE_KEY = 'gmi_admin_access';

interface Idea {
  id: string;
  title: string;
  description?: string;
  category: string;
  votes: number;
  feedbackCount: number;
  createdAt: string;
  author?: {
    username: string;
    wallet: string;
  };
  hasAIFeedback?: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  createdAt: string;
  admin?: {
    username: string;
    avatar: string;
  };
}

interface HackathonRound {
  id: string;
  roundNumber: number;
  title: string;
  description?: string;
  roundType: 'idea' | 'pitching' | 'final';
  mode: 'online' | 'offline' | 'hybrid';
  teamsAdvancing?: number;
  bonusTeams?: number;
  startDate: string;
  endDate: string;
  resultsDate?: string;
  status: 'upcoming' | 'active' | 'judging' | 'completed';
}

interface Hackathon {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  status: 'draft' | 'upcoming' | 'active' | 'judging' | 'completed' | 'cancelled';
  prizePool?: string;
  participantsCount: number;
  teamsCount?: number;
  maxParticipants?: number;
  registrationStart?: string;
  registrationEnd?: string;
  submissionStart?: string;
  submissionEnd?: string;
  judgingStart?: string;
  judgingEnd?: string;
  isFeatured: boolean;
  createdAt: string;
  rounds?: HackathonRound[];
}

interface Submission {
  id: string;
  hackathonId: string;
  projectId: string;
  userId: string;
  score?: number;
  scoreBreakdown?: {
    innovation: number;
    execution: number;
    impact: number;
    presentation: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'winner' | 'finalist';
  submittedAt: string;
  project?: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
  };
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface User {
  id: string;
  wallet?: string;
  email?: string;
  username: string;
  avatar?: string;
  bio?: string;
  isAdmin: boolean;
  isBanned: boolean;
  projectsCount: number;
  ideasCount: number;
  totalVotes: number;
  totalDonationsReceived: number;
  lastLoginAt?: string;
  createdAt: string;
}

interface Challenge {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  prizePool?: string;
  participantsCount: number;
  deadline?: string;
  createdAt: string;
}

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalIdeas: number;
  totalHackathons: number;
  totalChallenges: number;
  totalDonations: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsers: number;
}

// Access Code Gate Component
function AccessCodeGate({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    setTimeout(() => {
      if (code === ADMIN_ACCESS_CODE) {
        sessionStorage.setItem(ACCESS_STORAGE_KEY, btoa(Date.now().toString()));
        onSuccess();
      } else {
        setError('Invalid access code');
        setCode('');
      }
      setIsChecking(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm mx-4"
      >
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-white text-center mb-2">
            Restricted Area
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            Enter access code to continue
          </p>

          <form onSubmit={handleSubmit}>
            <div className="relative mb-4">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Access code"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                autoFocus
                disabled={isChecking}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isChecking || !code}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Access
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const wallet = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ideas' | 'projects' | 'hackathons' | 'challenges' | 'ai-tools' | 'activity'>('overview');

  // MetaDAO per-idea DAO creation
  const [creatingDaoIdeaId, setCreatingDaoIdeaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [backfillResult, setBackfillResult] = useState<any>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  
  // Users states
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Projects states
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // System stats
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  
  // Hackathon states
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [showHackathonForm, setShowHackathonForm] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState<Hackathon | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  // Rounds management
  const [showRoundsModal, setShowRoundsModal] = useState(false);
  const [editingRound, setEditingRound] = useState<HackathonRound | null>(null);
  const [selectedHackathonRounds, setSelectedHackathonRounds] = useState<HackathonRound[]>([]);
  const [selectedHackathonForRounds, setSelectedHackathonForRounds] = useState<Hackathon | null>(null);
  const [isLoadingRounds, setIsLoadingRounds] = useState(false);
  const [isSavingRounds, setIsSavingRounds] = useState(false);
  const [roundForm, setRoundForm] = useState({
    title: '',
    description: '',
    roundType: 'idea' as 'idea' | 'pitching' | 'final',
    mode: 'online' as 'online' | 'offline' | 'hybrid',
    teamsAdvancing: 10,
    bonusTeams: 5,
    startDate: '',
    endDate: '',
    resultsDate: '',
    status: 'upcoming' as 'upcoming' | 'active' | 'judging' | 'completed',
  });
  const [isSavingRound, setIsSavingRound] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    innovation: 0,
    execution: 0,
    impact: 0,
    presentation: 0,
    notes: ''
  });
  const [hackathonForm, setHackathonForm] = useState({
    slug: '',
    title: '',
    tagline: '',
    description: '',
    coverImage: '', // 1x3 banner image
    mode: 'online' as 'online' | 'offline' | 'hybrid',
    maxParticipants: 100,
    // Prize configuration
    prizeCount: 3 as 3 | 5,
    currency: 'VND' as 'VND' | 'USD',
    prizes: [
      { rank: 1, amount: '', title: '1st Place' },
      { rank: 2, amount: '', title: '2nd Place' },
      { rank: 3, amount: '', title: '3rd Place' },
    ] as { rank: number; amount: string; title: string }[],
    // Round 1 (Idea) configuration
    round1: {
      startDate: '',
      endDate: '',
      resultsDate: '',
      mode: 'online' as 'online' | 'offline' | 'hybrid',
    },
    // Round 2 (Pitching) configuration
    round2: {
      startDate: '',
      endDate: '',
      resultsDate: '',
      mode: 'online' as 'online' | 'offline' | 'hybrid',
      teamsAdvancing: 20,
      // Submission requirements when online
      submissions: {
        pitchDeck: { required: true, link: '' }, // Google Drive
        pitchingVideo: { required: false, link: '' }, // Loom
        technicalDemo: { required: false, link: '' }, // YouTube
        mvp: { required: false, link: '' }, // Product link
      },
    },
    // Round 3 (Final) configuration
    round3: {
      startDate: '',
      endDate: '',
      resultsDate: '',
      mode: 'offline' as 'online' | 'offline' | 'hybrid',
      teamsAdvancing: 5,
      // Submission requirements when online
      submissions: {
        pitchDeck: { required: true, link: '' }, // Google Drive
        pitchingVideo: { required: true, link: '' }, // Loom
        technicalDemo: { required: false, link: '' }, // YouTube
        mvp: { required: true, link: '' }, // Product link
      },
    },
    // Idea Phase Prizes (Top 10)
    ideaPrizeCount: 10 as 5 | 10,
    ideaPrizes: [
      { rank: 1, amount: '', title: 'Best Idea #1' },
      { rank: 2, amount: '', title: 'Best Idea #2' },
      { rank: 3, amount: '', title: 'Best Idea #3' },
      { rank: 4, amount: '', title: 'Best Idea #4' },
      { rank: 5, amount: '', title: 'Best Idea #5' },
      { rank: 6, amount: '', title: 'Best Idea #6' },
      { rank: 7, amount: '', title: 'Best Idea #7' },
      { rank: 8, amount: '', title: 'Best Idea #8' },
      { rank: 9, amount: '', title: 'Best Idea #9' },
      { rank: 10, amount: '', title: 'Best Idea #10' },
    ] as { rank: number; amount: string; title: string }[],
    // Top ideas advancing to round 2
    ideasAdvancing: 50,
    // Judging criteria (30% community, 70% judges)
    judgingCriteria: {
      communityWeight: 30, // 30% community votes/engagement
      judgeWeight: 70, // 70% judge scores
      judgeCategories: [
        { name: 'Innovation', weight: 25 },
        { name: 'Feasibility', weight: 25 },
        { name: 'Impact', weight: 25 },
        { name: 'Presentation', weight: 25 },
      ] as { name: string; weight: number }[],
    },
    // Schedule/Events
    schedule: [] as { title: string; date: string; link: string; type: 'workshop' | 'mentoring' | 'ceremony' | 'other' }[],
    // Partner hackathons
    partnerHackathons: [] as { name: string; link: string }[],
    // Timeline (auto-calculate status based on dates)
    registrationStart: '',
    registrationEnd: '',
  });
  
  // imgbb upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Check if user has valid access token
  useEffect(() => {
    const storedAccess = sessionStorage.getItem(ACCESS_STORAGE_KEY);
    if (storedAccess) {
      try {
        const timestamp = parseInt(atob(storedAccess));
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setHasAccess(true);
        } else {
          sessionStorage.removeItem(ACCESS_STORAGE_KEY);
        }
      } catch {
        sessionStorage.removeItem(ACCESS_STORAGE_KEY);
      }
    }
    setCheckingAccess(false);
  }, []);

  // Check if user is admin in database
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        setIsAdmin(false);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${API_URL}/admin/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          }
        });
        const data = await res.json();
        setIsAdmin(data.success && data.data?.isAdmin === true);
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsAdmin(false);
      }
      setCheckingAdmin(false);
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!hasAccess) return;
      
      setIsLoading(true);
      try {
        const [ideasRes, activityRes, hackathonsRes, statsRes] = await Promise.all([
          apiClient.getProjects({ type: 'idea', limit: 100 }),
          apiClient.getAdminActivityLog(20),
          fetchAdminHackathons(),
          fetchSystemStats(),
        ]);

        if (ideasRes.success && ideasRes.data) {
          setIdeas(ideasRes.data as any);
        }
        if (activityRes.success && activityRes.data) {
          setActivityLog(activityRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hasAccess]);

  // Fetch system stats
  const fetchSystemStats = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSystemStats(data.data);
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return { success: false };
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch all projects (type = 'project' only, not ideas)
  const fetchAllProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await apiClient.getProjects({ type: 'project', limit: 500 });
      if (res.success && res.data) {
        setProjects(res.data as any);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Toggle user ban status
  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/users/${userId}/${action}`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`User ${action}ned successfully`);
        fetchUsers();
      } else {
        toast.error(data.message || `Failed to ${action} user`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  // Toggle admin status
  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    const action = currentlyAdmin ? 'remove admin' : 'make admin';
    if (!confirm(`Are you sure you want to ${action}?`)) return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/users/${userId}/admin`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentlyAdmin })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Admin status updated`);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update admin status');
      }
    } catch (error) {
      toast.error('Failed to update admin status');
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    
    try {
      const res = await apiClient.deleteProject(projectId);
      if (res.success) {
        toast.success('Project deleted');
        fetchAllProjects();
      } else {
        toast.error('Failed to delete project');
      }
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  // Fetch hackathons from admin API
  const fetchAdminHackathons = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/hackathons`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setHackathons(data.data);
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch hackathons:', error);
      return { success: false };
    }
  };

  // Fetch submissions for a hackathon
  const fetchSubmissions = async (hackathonId: string) => {
    setIsLoadingSubmissions(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/hackathons/${hackathonId}/submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Fetch rounds for a hackathon
  const fetchHackathonRounds = async (hackathonId: string) => {
    setIsLoadingRounds(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/hackathons/${hackathonId}/rounds`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedHackathonRounds(data.data);
      } else {
        // Initialize default 3 rounds if none exist
        setSelectedHackathonRounds([
          { id: '', roundNumber: 1, title: 'Round 1: Idea Submission', description: 'Submit your innovative idea', roundType: 'idea', mode: 'online', teamsAdvancing: 50, startDate: '', endDate: '', status: 'upcoming' },
          { id: '', roundNumber: 2, title: 'Round 2: Pitching', description: 'Pitch your solution to judges', roundType: 'pitching', mode: 'online', teamsAdvancing: 20, startDate: '', endDate: '', status: 'upcoming' },
          { id: '', roundNumber: 3, title: 'Round 3: Final Demo', description: 'Present working MVP', roundType: 'final', mode: 'offline', teamsAdvancing: 5, startDate: '', endDate: '', status: 'upcoming' },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch rounds:', error);
      // Initialize default 3 rounds on error
      setSelectedHackathonRounds([
        { id: '', roundNumber: 1, title: 'Round 1: Idea Submission', description: 'Submit your innovative idea', roundType: 'idea', mode: 'online', teamsAdvancing: 50, startDate: '', endDate: '', status: 'upcoming' },
        { id: '', roundNumber: 2, title: 'Round 2: Pitching', description: 'Pitch your solution to judges', roundType: 'pitching', mode: 'online', teamsAdvancing: 20, startDate: '', endDate: '', status: 'upcoming' },
        { id: '', roundNumber: 3, title: 'Round 3: Final Demo', description: 'Present working MVP', roundType: 'final', mode: 'offline', teamsAdvancing: 5, startDate: '', endDate: '', status: 'upcoming' },
      ]);
    } finally {
      setIsLoadingRounds(false);
    }
  };

  // Save rounds for a hackathon
  const handleSaveRounds = async () => {
    if (!selectedHackathonForRounds) return;
    setIsSavingRounds(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/hackathons/${selectedHackathonForRounds.id}/rounds`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rounds: selectedHackathonRounds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Rounds updated successfully!');
        setShowRoundsModal(false);
        setSelectedHackathonForRounds(null);
      } else {
        toast.error(data.message || 'Failed to save rounds');
      }
    } catch (error) {
      toast.error('Failed to save rounds');
    } finally {
      setIsSavingRounds(false);
    }
  };

  // Open rounds modal
  const openRoundsModal = (hackathon: any) => {
    setSelectedHackathonForRounds(hackathon);
    fetchHackathonRounds(hackathon.id);
    setShowRoundsModal(true);
  };

  // Update round field
  const updateRoundField = (roundNumber: number, field: keyof HackathonRound, value: any) => {
    setSelectedHackathonRounds(prev => 
      prev.map(round => 
        round.roundNumber === roundNumber ? { ...round, [field]: value } : round
      )
    );
  };

  // Create/Update hackathon
  const handleSaveHackathon = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const method = editingHackathon ? 'PATCH' : 'POST';
      const url = editingHackathon 
        ? `${API_URL}/admin/hackathons/${editingHackathon.id}`
        : `${API_URL}/admin/hackathons`;
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(hackathonForm),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(editingHackathon ? 'Hackathon updated!' : 'Hackathon created!');
        setShowHackathonForm(false);
        setEditingHackathon(null);
        resetHackathonForm();
        fetchAdminHackathons();
      } else {
        toast.error(data.message || 'Failed to save hackathon');
      }
    } catch (error) {
      toast.error('Failed to save hackathon');
    }
  };

  // Delete hackathon
  const handleDeleteHackathon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hackathon? This cannot be undone.')) return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/hackathons/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Hackathon deleted!');
        fetchAdminHackathons();
        if (selectedHackathon?.id === id) {
          setSelectedHackathon(null);
        }
      } else {
        toast.error(data.message || 'Failed to delete hackathon');
      }
    } catch (error) {
      toast.error('Failed to delete hackathon');
    }
  };

  // Score submission
  const handleScoreSubmission = async () => {
    if (!selectedSubmission) return;
    
    const totalScore = Math.round(
      (scoreForm.innovation + scoreForm.execution + scoreForm.impact + scoreForm.presentation) / 4
    );
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/submissions/${selectedSubmission.id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: totalScore,
          scoreBreakdown: {
            innovation: scoreForm.innovation,
            execution: scoreForm.execution,
            impact: scoreForm.impact,
            presentation: scoreForm.presentation,
          },
          adminNotes: scoreForm.notes,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Submission scored!');
        setShowScoreModal(false);
        setSelectedSubmission(null);
        resetScoreForm();
        if (selectedHackathon) {
          fetchSubmissions(selectedHackathon.id);
        }
      } else {
        toast.error(data.message || 'Failed to score submission');
      }
    } catch (error) {
      toast.error('Failed to score submission');
    }
  };

  // Update submission status (winner, finalist, etc)
  const handleUpdateSubmissionStatus = async (submissionId: string, status: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/admin/submissions/${submissionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to ${status}!`);
        if (selectedHackathon) {
          fetchSubmissions(selectedHackathon.id);
        }
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetHackathonForm = () => {
    setHackathonForm({
      slug: '',
      title: '',
      tagline: '',
      description: '',
      coverImage: '',
      mode: 'online',
      maxParticipants: 100,
      prizeCount: 3,
      currency: 'VND',
      prizes: [
        { rank: 1, amount: '', title: '1st Place' },
        { rank: 2, amount: '', title: '2nd Place' },
        { rank: 3, amount: '', title: '3rd Place' },
      ],
      round1: {
        startDate: '',
        endDate: '',
        resultsDate: '',
        mode: 'online',
      },
      round2: {
        startDate: '',
        endDate: '',
        resultsDate: '',
        mode: 'online',
        teamsAdvancing: 20,
        submissions: {
          pitchDeck: { required: true, link: '' },
          pitchingVideo: { required: false, link: '' },
          technicalDemo: { required: false, link: '' },
          mvp: { required: false, link: '' },
        },
      },
      round3: {
        startDate: '',
        endDate: '',
        resultsDate: '',
        mode: 'offline',
        teamsAdvancing: 5,
        submissions: {
          pitchDeck: { required: true, link: '' },
          pitchingVideo: { required: true, link: '' },
          technicalDemo: { required: false, link: '' },
          mvp: { required: true, link: '' },
        },
      },
      ideaPrizeCount: 10,
      ideaPrizes: [
        { rank: 1, amount: '', title: 'Best Idea #1' },
        { rank: 2, amount: '', title: 'Best Idea #2' },
        { rank: 3, amount: '', title: 'Best Idea #3' },
        { rank: 4, amount: '', title: 'Best Idea #4' },
        { rank: 5, amount: '', title: 'Best Idea #5' },
        { rank: 6, amount: '', title: 'Best Idea #6' },
        { rank: 7, amount: '', title: 'Best Idea #7' },
        { rank: 8, amount: '', title: 'Best Idea #8' },
        { rank: 9, amount: '', title: 'Best Idea #9' },
        { rank: 10, amount: '', title: 'Best Idea #10' },
      ],
      ideasAdvancing: 50,
      judgingCriteria: {
        communityWeight: 30,
        judgeWeight: 70,
        judgeCategories: [
          { name: 'Innovation', weight: 25 },
          { name: 'Feasibility', weight: 25 },
          { name: 'Impact', weight: 25 },
          { name: 'Presentation', weight: 25 },
        ],
      },
      schedule: [],
      partnerHackathons: [],
      registrationStart: '',
      registrationEnd: '',
    });
  };

  const resetScoreForm = () => {
    setScoreForm({
      innovation: 0,
      execution: 0,
      impact: 0,
      presentation: 0,
      notes: ''
    });
  };

  const openEditHackathon = (hackathon: Hackathon) => {
    setEditingHackathon(hackathon);
    const h = hackathon as any;
    // For now, just load basic info - full edit form will fetch more details
    setHackathonForm({
      slug: hackathon.slug,
      title: hackathon.title,
      tagline: hackathon.tagline || '',
      description: hackathon.description || '',
      coverImage: h.coverImage || '',
      mode: h.mode || 'online',
      maxParticipants: hackathon.maxParticipants || 100,
      prizeCount: h.prizeCount || 3,
      currency: h.currency || 'VND',
      prizes: h.prizes || [
        { rank: 1, amount: '', title: '1st Place' },
        { rank: 2, amount: '', title: '2nd Place' },
        { rank: 3, amount: '', title: '3rd Place' },
      ],
      round1: h.round1 || { startDate: '', endDate: '', resultsDate: '', mode: 'online' },
      round2: h.round2 || { 
        startDate: '', endDate: '', resultsDate: '', mode: 'online', teamsAdvancing: 20,
        submissions: {
          pitchDeck: { required: true, link: '' },
          pitchingVideo: { required: false, link: '' },
          technicalDemo: { required: false, link: '' },
          mvp: { required: false, link: '' },
        },
      },
      round3: h.round3 || { 
        startDate: '', endDate: '', resultsDate: '', mode: 'offline', teamsAdvancing: 5,
        submissions: {
          pitchDeck: { required: true, link: '' },
          pitchingVideo: { required: true, link: '' },
          technicalDemo: { required: false, link: '' },
          mvp: { required: true, link: '' },
        },
      },
      ideaPrizeCount: h.ideaPrizeCount || 10,
      ideaPrizes: h.ideaPrizes || [
        { rank: 1, amount: '', title: 'Best Idea #1' },
        { rank: 2, amount: '', title: 'Best Idea #2' },
        { rank: 3, amount: '', title: 'Best Idea #3' },
        { rank: 4, amount: '', title: 'Best Idea #4' },
        { rank: 5, amount: '', title: 'Best Idea #5' },
        { rank: 6, amount: '', title: 'Best Idea #6' },
        { rank: 7, amount: '', title: 'Best Idea #7' },
        { rank: 8, amount: '', title: 'Best Idea #8' },
        { rank: 9, amount: '', title: 'Best Idea #9' },
        { rank: 10, amount: '', title: 'Best Idea #10' },
      ],
      ideasAdvancing: h.ideasAdvancing || 50,
      judgingCriteria: h.judgingCriteria || {
        communityWeight: 30,
        judgeWeight: 70,
        judgeCategories: [
          { name: 'Innovation', weight: 25 },
          { name: 'Feasibility', weight: 25 },
          { name: 'Impact', weight: 25 },
          { name: 'Presentation', weight: 25 },
        ],
      },
      schedule: h.schedule || [],
      partnerHackathons: h.partnerHackathons || [],
      registrationStart: hackathon.registrationStart?.slice(0, 16) || '',
      registrationEnd: hackathon.registrationEnd?.slice(0, 16) || '',
    });
    setShowHackathonForm(true);
  };

  // Upload image to imgbb
  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // imgbb API key from environment variable
      const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
      
      if (!IMGBB_API_KEY) {
        toast.error('imgbb API key not configured');
        console.error('Missing NEXT_PUBLIC_IMGBB_API_KEY environment variable');
        setIsUploadingImage(false);
        return;
      }
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      console.log('imgbb response:', data); // Debug log
      
      if (data.success && data.data?.url) {
        setHackathonForm(prev => ({ ...prev, coverImage: data.data.url }));
        toast.success('Image uploaded successfully!');
      } else {
        console.error('imgbb error:', data);
        toast.error(data.error?.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Check console for details.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const openScoreModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    if (submission.scoreBreakdown) {
      setScoreForm({
        innovation: submission.scoreBreakdown.innovation,
        execution: submission.scoreBreakdown.execution,
        impact: submission.scoreBreakdown.impact,
        presentation: submission.scoreBreakdown.presentation,
        notes: ''
      });
    } else {
      resetScoreForm();
    }
    setShowScoreModal(true);
  };

  const updateIdeaFundingPool = async (ideaId: string, patch: any) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${API_URL}/admin/projects/${ideaId}/funding-pool`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
      body: JSON.stringify(patch),
    });
    return res.json();
  };

  const handleCreateMetaDaoForIdea = async (ideaId: string) => {
    if (!wallet.publicKey) {
      toast.error('Connect wallet to create DAO');
      return;
    }

    // MetaDAO futarchy program is mainnet-first. Prevent confusing devnet failures.
    const solanaNetwork = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';
    if (solanaNetwork !== 'mainnet-beta') {
      toast.error('Create DAO is only supported on mainnet-beta right now');
      return;
    }

    try {
      setCreatingDaoIdeaId(ideaId);

      const futarchy = makeFutarchyClient(connection as any, wallet);

      // Quick pre-check: Create DAO needs SOL for account rent + tx fee.
      const balanceLamports = await connection.getBalance(wallet.publicKey, 'confirmed');
      const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
      if (balanceSol < 0.05) {
        toast.error(`Insufficient SOL to create DAO (need ~0.05+ SOL, current ${balanceSol.toFixed(4)} SOL)`);
        return;
      }

      // Default params (aligned with MetaDAO tests; no liquidity provision in MVP)
      const nonce = new BN(Date.now());
      const oneBuck = PriceMath.getAmmPrice(1, 6, 6);

      const ixBuilder = futarchy.initializeDaoIx({
        baseMint: META_MINT,
        quoteMint: MAINNET_USDC,
        params: {
          secondsPerProposal: 60 * 60 * 24 * 3,
          twapStartDelaySeconds: 60 * 60 * 24,
          twapInitialObservation: oneBuck,
          twapMaxObservationChangePerUpdate: oneBuck.divn(100),
          minQuoteFutarchicLiquidity: new BN(10_000),
          minBaseFutarchicLiquidity: new BN(10_000),
          passThresholdBps: 300,
          nonce,
          initialSpendingLimit: null,
          baseToStake: new BN(0),
          teamSponsoredPassThresholdBps: 300,
          teamAddress: wallet.publicKey,
        },
        provideLiquidity: false,
      });

      const tx: Transaction = await (ixBuilder as any).transaction();
      tx.feePayer = wallet.publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;

      // Simulate first to surface logs (wallet-adapter often throws "Unexpected error" without details)
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signTransaction');
      }
      const signed = await wallet.signTransaction(tx);
      // web3.js v1.98: for legacy Transaction, simulateTransaction only accepts (tx, signers?, includeAccounts?)
      // Passing a config object throws "Invalid arguments".
      const sim = await connection.simulateTransaction(signed as any);
      if (sim.value.err) {
        console.error('[Create DAO] Simulation error:', sim.value.err);
        console.error('[Create DAO] Simulation logs:', sim.value.logs);

        const logs = sim.value.logs || [];
        const compactReason =
          logs.find((l: string) => /insufficient|custom program error|failed/i.test(l)) ||
          logs.find((l: string) => /Error|error/i.test(l));

        toast.error(compactReason ? `Create DAO failed: ${compactReason}` : 'Create DAO failed (simulation). Check console for logs.');
        return;
      }

      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
        maxRetries: 3,
      });
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      // Derive DAO PDA (matches SDK derivation)
      const { getDaoAddr } = await import('@metadaoproject/futarchy/v0.7');
      const [dao] = getDaoAddr({ nonce, daoCreator: wallet.publicKey });

      // Persist: reuse existing governance fields for MetaDAO
      const save = await updateIdeaFundingPool(ideaId, {
        poolStatus: 'pool_open',
        governanceRealmAddress: dao.toBase58(), // MetaDAO DAO address
        governanceTreasuryAddress: dao.toBase58(), // treasury owner (derive USDC ATA)
        supportFeeBps: 0,
        supportFeeCapUsdc: 0,
      });

      if (!save.success) {
        toast.error(save.error || 'DAO created but failed to save to DB');
      } else {
        toast.success('MetaDAO DAO created + pool opened');
        // Refresh ideas list (simple re-fetch)
        const ideasRes = await apiClient.getProjects({ type: 'idea', limit: 100 });
        if (ideasRes.success && ideasRes.data) setIdeas(ideasRes.data as any);
      }
    } catch (e: any) {
      console.error('[Create DAO] Error:', e);
      // Try to surface extra info from common Solana errors
      const msg =
        e?.message ||
        e?.error?.message ||
        (typeof e === 'string' ? e : 'Failed to create MetaDAO DAO');
      if (e?.logs) console.error('[Create DAO] logs:', e.logs);
      toast.error(msg);
    } finally {
      setCreatingDaoIdeaId(null);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    
    try {
      const res = await apiClient.deleteProject(id);
      if (res.success) {
        setIdeas(ideas.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete idea:', error);
    }
  };

  const handleBackfillAI = async () => {
    setIsBackfilling(true);
    setBackfillResult(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/ai/backfill-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setBackfillResult(data);
    } catch (error) {
      setBackfillResult({ success: false, error: 'Failed to backfill' });
    } finally {
      setIsBackfilling(false);
    }
  };

  if (checkingAccess || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessCodeGate onSuccess={() => setHasAccess(true)} />;
  }

  // Must be logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm mx-4"
        >
          <div className="bg-[#111] border border-red-500/20 rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Authentication Required</h1>
            <p className="text-sm text-gray-500 mb-6">
              You must be logged in to access the admin panel.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Must be admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm mx-4"
        >
          <div className="bg-[#111] border border-red-500/20 rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
                <Ban className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 mb-6">
              You do not have admin privileges to access this panel.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const filteredIdeas = ideas.filter(idea => 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.wallet?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ideasWithAI = ideas.filter(i => i.feedbackCount > 0).length;
  const ideasWithoutAI = ideas.length - ideasWithAI;

  const stats = [
    { label: 'Total Users', value: systemStats?.totalUsers || users.length, icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    { label: 'Total Projects', value: systemStats?.totalProjects || projects.length, icon: FileText, color: 'text-green-400', bgColor: 'bg-green-500/10' },
    { label: 'Total Ideas', value: systemStats?.totalIdeas || ideas.length, icon: Lightbulb, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    { label: 'Hackathons', value: hackathons.length, icon: Trophy, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    { label: 'New Today', value: systemStats?.newUsersToday || 0, icon: TrendingUp, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
    { label: 'Active Users', value: systemStats?.activeUsers || 0, icon: UserCheck, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <AdminBadge variant="inline" />
            </div>
            <p className="text-gray-400">
              Welcome back, <span className="text-white font-medium">{user?.username || 'Admin'}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111] border border-white/5 rounded-xl p-4"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'ideas', label: 'Ideas', icon: Lightbulb },
            { id: 'projects', label: 'Projects', icon: FileText },
            { id: 'hackathons', label: 'Hackathons', icon: Trophy },
            { id: 'challenges', label: 'Challenges', icon: Swords },
            { id: 'ai-tools', label: 'AI Tools', icon: Bot },
            { id: 'activity', label: 'Activity', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                // Fetch data when switching to specific tabs
                if (tab.id === 'users' && users.length === 0) fetchUsers();
                if (tab.id === 'projects' && projects.length === 0) fetchAllProjects();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => { setActiveTab('users'); fetchUsers(); }}
                className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-blue-500/50 transition-colors group"
              >
                <Users className="w-8 h-8 text-blue-400 mb-2" />
                <div className="text-white font-medium group-hover:text-blue-400">Manage Users</div>
                <div className="text-xs text-gray-500">{systemStats?.totalUsers || 0} total</div>
              </button>
              <button
                onClick={() => { setActiveTab('projects'); fetchAllProjects(); }}
                className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-green-500/50 transition-colors group"
              >
                <FileText className="w-8 h-8 text-green-400 mb-2" />
                <div className="text-white font-medium group-hover:text-green-400">View Projects</div>
                <div className="text-xs text-gray-500">{systemStats?.totalProjects || 0} total</div>
              </button>
              <button
                onClick={() => setActiveTab('hackathons')}
                className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-purple-500/50 transition-colors group"
              >
                <Trophy className="w-8 h-8 text-purple-400 mb-2" />
                <div className="text-white font-medium group-hover:text-purple-400">Hackathons</div>
                <div className="text-xs text-gray-500">{hackathons.length} total</div>
              </button>
              <button
                onClick={() => setActiveTab('ai-tools')}
                className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-amber-500/50 transition-colors group"
              >
                <Bot className="w-8 h-8 text-amber-400 mb-2" />
                <div className="text-white font-medium group-hover:text-amber-400">AI Tools</div>
                <div className="text-xs text-gray-500">{ideasWithoutAI} pending</div>
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {activityLog.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Activity className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <div className="text-sm text-white capitalize">{log.action.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {activityLog.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>

              {/* System Health */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  System Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">New Users Today</span>
                    <span className="text-cyan-400 font-medium">{systemStats?.newUsersToday || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">New Users This Week</span>
                    <span className="text-blue-400 font-medium">{systemStats?.newUsersThisWeek || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Users (7 days)</span>
                    <span className="text-green-400 font-medium">{systemStats?.activeUsers || 0}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">AI Coverage</span>
                      <span className="text-amber-400 font-medium">
                        {ideas.length > 0 ? Math.round((ideasWithAI / ideas.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full transition-all" 
                        style={{ width: `${ideas.length > 0 ? (ideasWithAI / ideas.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Ideas */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Recent Ideas
                </h3>
                <div className="space-y-3">
                  {ideas.slice(0, 5).map((idea) => (
                    <div key={idea.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <div className="flex-grow min-w-0">
                        <div className="font-medium text-white mb-1 truncate">{idea.title}</div>
                        <div className="text-xs text-gray-500">{idea.category}</div>
                      </div>
                      <Link href={`/idea/${idea.id}`} className="p-2 hover:bg-white/10 rounded-lg flex-shrink-0">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Link>
                    </div>
                  ))}
                  {ideas.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No ideas yet</p>
                  )}
                </div>
              </div>

              {/* Active Hackathons */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  Hackathons
                </h3>
                <div className="space-y-3">
                  {hackathons.slice(0, 5).map((h) => (
                    <div key={h.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <div className="flex-grow min-w-0">
                        <div className="font-medium text-white mb-1 truncate">{h.title}</div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          h.status === 'active' ? 'bg-green-500/10 text-green-400' :
                          h.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400' :
                          h.status === 'judging' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {h.status}
                        </span>
                      </div>
                      <Link href={`/hackathons/${h.slug}`} className="p-2 hover:bg-white/10 rounded-lg flex-shrink-0">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </Link>
                    </div>
                  ))}
                  {hackathons.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No hackathons yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ideas Tab */}
        {activeTab === 'ideas' && (
          <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ideas..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Title</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Category</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Votes</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Feedback</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIdeas.map((idea) => (
                    <tr key={idea.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white truncate max-w-xs">{idea.title}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{idea.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{idea.votes}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{idea.feedbackCount}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCreateMetaDaoForIdea(idea.id)}
                            disabled={creatingDaoIdeaId === idea.id}
                            className="px-3 py-2 text-xs font-bold rounded-lg bg-[#FFD700] text-black hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Create MetaDAO DAO + open pool"
                          >
                            {creatingDaoIdeaId === idea.id ? 'Creating…' : 'Create DAO'}
                          </button>
                          <Link href={`/idea/${idea.id}`} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Tools Tab */}
        {activeTab === 'ai-tools' && (
          <div className="space-y-6">
            <div className="bg-[#111] border border-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Backfill AI Feedback</h3>
              <p className="text-gray-400 mb-4">
                Generate AI feedback for all ideas that don't have it yet. This will use the OpenAI API.
              </p>
              <button
                onClick={handleBackfillAI}
                disabled={isBackfilling}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {isBackfilling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Run Backfill
                  </>
                )}
              </button>

              {backfillResult && (
                <div className={`mt-4 p-4 rounded-lg ${backfillResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  {backfillResult.success ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-medium text-green-400">Backfill Complete</span>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>Processed: {backfillResult.data?.processed || 0}</p>
                        <p>Success: {backfillResult.data?.success || 0}</p>
                        <p>Failed: {backfillResult.data?.failed || 0}</p>
                        <p>Skipped: {backfillResult.data?.skipped || 0}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">{backfillResult.error || 'Failed'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-[#111] border border-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ideas Without AI Feedback</h3>
              <div className="space-y-2">
                {ideas.filter(i => i.feedbackCount === 0).slice(0, 10).map((idea) => (
                  <div key={idea.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white truncate">{idea.title}</span>
                    <Link href={`/idea/${idea.id}`} className="text-purple-400 text-sm hover:underline">
                      View
                    </Link>
                  </div>
                ))}
                {ideas.filter(i => i.feedbackCount === 0).length === 0 && (
                  <p className="text-gray-500 text-center py-4">All ideas have AI feedback!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Users ({users.length})
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none w-64"
                    />
                  </div>
                  <button
                    onClick={fetchUsers}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">User</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email/Wallet</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Projects</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Joined</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            {users.length === 0 ? 'No users found. Click refresh to load.' : 'No matching users.'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                                  {u.avatar ? (
                                    <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    u.username?.charAt(0).toUpperCase() || '?'
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-white flex items-center gap-2">
                                    {u.username || 'Anonymous'}
                                    {u.isAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                {u.email && (
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Mail className="w-3.5 h-3.5" />
                                    {u.email}
                                  </div>
                                )}
                                {u.wallet && (
                                  <div className="flex items-center gap-1 text-gray-500 text-xs font-mono">
                                    <Wallet className="w-3 h-3" />
                                    {u.wallet.slice(0, 4)}...{u.wallet.slice(-4)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {u.projectsCount || 0}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {u.isBanned ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                    <Ban className="w-3 h-3" /> Banned
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                    <UserCheck className="w-3 h-3" /> Active
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/profile/${u.id}`}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                                  title="View Profile"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                                  className={`p-2 rounded-lg ${u.isAdmin ? 'text-amber-400 hover:bg-amber-500/10' : 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'}`}
                                  title={u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                >
                                  <Crown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleBan(u.id, u.isBanned)}
                                  className={`p-2 rounded-lg ${u.isBanned ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'}`}
                                  title={u.isBanned ? 'Unban User' : 'Ban User'}
                                >
                                  {u.isBanned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  All Projects ({projects.length})
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects..."
                      className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none w-64"
                    />
                  </div>
                  <button
                    onClick={fetchAllProjects}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingProjects ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isLoadingProjects ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Project</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Type</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Category</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Author</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Votes</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Created</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                            {projects.length === 0 ? 'No projects found. Click refresh to load.' : 'No matching projects.'}
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((p) => (
                          <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-6 py-4">
                              <div className="font-medium text-white truncate max-w-xs">{p.title}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                p.type === 'idea' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {p.type || 'project'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">{p.category || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{p.author?.username || 'Unknown'}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{p.votes || 0}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={p.type === 'idea' ? `/idea/${p.id}` : `/projects/${p.id}`}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteProject(p.id)}
                                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="bg-[#111] border border-white/5 rounded-xl p-12 text-center">
            <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Challenges</h3>
            <p className="text-gray-400 mb-4">
              Challenge management will be available here once your teammate completes the Challenge feature.
            </p>
            <p className="text-sm text-gray-500">
              Similar to Hackathons, you'll be able to create, edit, and manage challenges from this panel.
            </p>
          </div>
        )}

        {/* Hackathons Tab */}
        {activeTab === 'hackathons' && (
          <div className="space-y-6">
            {/* Hackathon List */}
            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Hackathons ({hackathons.length})
                </h3>
                <button
                  onClick={() => {
                    setEditingHackathon(null);
                    resetHackathonForm();
                    setShowHackathonForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Hackathon
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Title</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Prize Pool</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Participants</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Created</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hackathons.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No hackathons yet. Create your first one!
                        </td>
                      </tr>
                    ) : (
                      hackathons.map((hackathon) => (
                        <tr key={hackathon.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="font-medium text-white truncate max-w-xs">{hackathon.title}</div>
                            <div className="text-xs text-gray-500">/{hackathon.slug}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              hackathon.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              hackathon.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              hackathon.status === 'judging' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              hackathon.status === 'completed' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              hackathon.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                              {hackathon.status === 'active' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                              {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{hackathon.prizePool || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{hackathon.participantsCount || 0}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(hackathon.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedHackathon(hackathon);
                                  fetchSubmissions(hackathon.id);
                                }}
                                className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"
                                title="View Submissions"
                              >
                                <Medal className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openRoundsModal(hackathon)}
                                className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg"
                                title="Manage Rounds"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                              <Link href={`/hackathons/${hackathon.slug}`} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => openEditHackathon(hackathon)}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteHackathon(hackathon.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Hackathon Submissions */}
            {selectedHackathon && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111] border border-white/5 rounded-xl overflow-hidden"
              >
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      Submissions for "{selectedHackathon.title}"
                    </h3>
                    <p className="text-sm text-gray-500">
                      {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedHackathon(null)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isLoadingSubmissions ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No submissions yet for this hackathon
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Project</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Submitter</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Score</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Submitted</th>
                          <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((submission) => (
                          <tr key={submission.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-6 py-4">
                              <div className="font-medium text-white truncate max-w-xs">
                                {submission.project?.title || 'Unknown Project'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {submission.user?.username || 'Unknown'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                submission.status === 'winner' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                submission.status === 'finalist' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                submission.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                submission.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              }`}>
                                {submission.status === 'winner' && <Trophy className="w-3 h-3" />}
                                {submission.status === 'finalist' && <Star className="w-3 h-3" />}
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {submission.score !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{submission.score}/100</span>
                                  {submission.scoreBreakdown && (
                                    <div className="text-xs text-gray-500">
                                      (I:{submission.scoreBreakdown.innovation} E:{submission.scoreBreakdown.execution} 
                                      Im:{submission.scoreBreakdown.impact} P:{submission.scoreBreakdown.presentation})
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">Not scored</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openScoreModal(submission)}
                                  className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"
                                  title="Score"
                                >
                                  <Target className="w-4 h-4" />
                                </button>
                                <div className="relative group">
                                  <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                  <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg py-1 min-w-[140px] hidden group-hover:block z-10">
                                    <button
                                      onClick={() => handleUpdateSubmissionStatus(submission.id, 'approved')}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-white/5 hover:text-green-400 flex items-center gap-2"
                                    >
                                      <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                      onClick={() => handleUpdateSubmissionStatus(submission.id, 'finalist')}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-white/5 hover:text-purple-400 flex items-center gap-2"
                                    >
                                      <Star className="w-4 h-4" /> Finalist
                                    </button>
                                    <button
                                      onClick={() => handleUpdateSubmissionStatus(submission.id, 'winner')}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-white/5 hover:text-amber-400 flex items-center gap-2"
                                    >
                                      <Trophy className="w-4 h-4" /> Winner
                                    </button>
                                    <button
                                      onClick={() => handleUpdateSubmissionStatus(submission.id, 'rejected')}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-white/5 hover:text-red-400 flex items-center gap-2"
                                    >
                                      <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                  </div>
                                </div>
                                {submission.project && (
                                  <Link
                                    href={`/projects/${submission.projectId}`}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Partner Hackathons Section */}
            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Partner Hackathons
                </h3>
                <p className="text-sm text-gray-500">
                  External hackathons linked from partner organizations
                </p>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-4">
                  Partner hackathons are displayed as secondary cards on the hackathons page. 
                  You can add them when creating/editing a hackathon in the "Partner Hackathons" section.
                </p>
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Current Partner Links</h4>
                  {hackathons.filter(h => (h as any).partnerHackathons?.length > 0).length === 0 ? (
                    <p className="text-sm text-gray-500">No partner hackathons added to any event yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {hackathons.filter(h => (h as any).partnerHackathons?.length > 0).map(h => (
                        <div key={h.id} className="border-b border-white/10 pb-3 last:border-0">
                          <p className="text-xs text-gray-500 mb-1">Partners for: {h.title}</p>
                          <div className="flex flex-wrap gap-2">
                            {((h as any).partnerHackathons || []).map((p: any, idx: number) => (
                              <a
                                key={idx}
                                href={p.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs hover:bg-cyan-500/20 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {p.name || p.link}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hackathon Form Modal */}
        <AnimatePresence>
          {showHackathonForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowHackathonForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#111] z-10">
                  <h2 className="text-xl font-bold text-white">
                    {editingHackathon ? 'Edit Hackathon' : 'Create Hackathon'}
                  </h2>
                  <button
                    onClick={() => setShowHackathonForm(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Cover Image Upload with imgbb */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Cover Image (1200x400 recommended - 3:1 ratio)
                    </label>
                    <div className="relative">
                      {hackathonForm.coverImage ? (
                        <div className="relative rounded-xl overflow-hidden aspect-[3/1]">
                          <img
                            src={hackathonForm.coverImage}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setHackathonForm({ ...hackathonForm, coverImage: '' })}
                            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/50 rounded-lg text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-white/20 rounded-xl aspect-[3/1] flex items-center justify-center hover:border-purple-500/50 transition-colors cursor-pointer">
                          <div className="text-center">
                            {isUploadingImage ? (
                              <>
                                <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-spin" />
                                <p className="text-sm text-gray-400">Uploading...</p>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-400 mb-2">Click to upload or drag & drop</p>
                                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            }}
                            disabled={isUploadingImage}
                          />
                        </label>
                      )}
                    </div>
                    {/* URL input as fallback */}
                    {!hackathonForm.coverImage && !isUploadingImage && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Or paste URL:</span>
                        <input
                          type="text"
                          placeholder="https://..."
                          onChange={(e) => setHackathonForm({ ...hackathonForm, coverImage: e.target.value })}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
                      <input
                        type="text"
                        value={hackathonForm.title}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="DSUC Hackathon: Solana for Education"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Slug *</label>
                      <input
                        type="text"
                        value={hackathonForm.slug}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="dsuc-hackathon-solana-edu"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Mode *</label>
                      <select
                        value={hackathonForm.mode}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, mode: e.target.value as any })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="online">🌐 Online</option>
                        <option value="offline">📍 Offline</option>
                        <option value="hybrid">🔀 Hybrid</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tagline</label>
                      <input
                        type="text"
                        value={hackathonForm.tagline}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, tagline: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="Build the future of education on Solana"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                      <textarea
                        value={hackathonForm.description}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, description: e.target.value })}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"
                        placeholder="Describe your hackathon..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Max Participants</label>
                      <input
                        type="number"
                        value={hackathonForm.maxParticipants}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, maxParticipants: parseInt(e.target.value) || 100 })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Registration Timeline */}
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      Registration Period
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Start</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.registrationStart}
                          onChange={(e) => setHackathonForm({ ...hackathonForm, registrationStart: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">End</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.registrationEnd}
                          onChange={(e) => setHackathonForm({ ...hackathonForm, registrationEnd: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Status sẽ tự động cập nhật: Draft → Upcoming → Active → Completed dựa trên thời gian
                    </p>
                  </div>

                  {/* Final Prizes */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        Final Prizes (Round 3)
                      </h4>
                      <div className="flex items-center gap-3">
                        <select
                          value={hackathonForm.prizeCount}
                          onChange={(e) => {
                            const count = parseInt(e.target.value) as 3 | 5;
                            const newPrizes = count === 5 ? [
                              ...hackathonForm.prizes,
                              { rank: 4, amount: '', title: '4th Place' },
                              { rank: 5, amount: '', title: '5th Place' },
                            ].slice(0, 5) : hackathonForm.prizes.slice(0, 3);
                            setHackathonForm({ ...hackathonForm, prizeCount: count, prizes: newPrizes });
                          }}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                        >
                          <option value={3}>3 Prizes</option>
                          <option value={5}>5 Prizes</option>
                        </select>
                        <select
                          value={hackathonForm.currency}
                          onChange={(e) => setHackathonForm({ ...hackathonForm, currency: e.target.value as 'VND' | 'USD' })}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                        >
                          <option value="VND">🇻🇳 VND</option>
                          <option value="USD">🇺🇸 USD</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {hackathonForm.prizes.map((prize, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                            idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                            idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                            'bg-white/10 text-gray-400'
                          }`}>
                            {prize.rank}
                          </span>
                          <input
                            type="text"
                            value={prize.title}
                            onChange={(e) => {
                              const newPrizes = [...hackathonForm.prizes];
                              newPrizes[idx].title = e.target.value;
                              setHackathonForm({ ...hackathonForm, prizes: newPrizes });
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                            placeholder="Prize title"
                          />
                          <div className="relative">
                            <input
                              type="text"
                              value={prize.amount}
                              onChange={(e) => {
                                const newPrizes = [...hackathonForm.prizes];
                                newPrizes[idx].amount = e.target.value;
                                setHackathonForm({ ...hackathonForm, prizes: newPrizes });
                              }}
                              className="w-40 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm pr-14"
                              placeholder="Amount"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                              {hackathonForm.currency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Round 1: Idea Phase */}
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-green-400" />
                      Round 1: Idea Submission (Online)
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.round1.startDate}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round1: { ...hackathonForm.round1, startDate: e.target.value }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.round1.endDate}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round1: { ...hackathonForm.round1, endDate: e.target.value }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Results Announcement</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.round1.resultsDate}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round1: { ...hackathonForm.round1, resultsDate: e.target.value }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Ideas Advancing to Round 2</label>
                      <input
                        type="number"
                        value={hackathonForm.ideasAdvancing}
                        onChange={(e) => setHackathonForm({
                          ...hackathonForm,
                          ideasAdvancing: parseInt(e.target.value) || 50
                        })}
                        className="w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Round 2: Pitching */}
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      Round 2: Pitching
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Mode</label>
                        <select
                          value={hackathonForm.round2.mode}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round2: { ...hackathonForm.round2, mode: e.target.value as any }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="online">🌐 Online</option>
                          <option value="offline">📍 Offline</option>
                          <option value="hybrid">🔀 Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Teams Advancing to Final</label>
                        <input
                          type="number"
                          value={hackathonForm.round2.teamsAdvancing}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round2: { ...hackathonForm.round2, teamsAdvancing: parseInt(e.target.value) || 20 }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.round2.startDate}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round2: { ...hackathonForm.round2, startDate: e.target.value }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.round2.endDate}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round2: { ...hackathonForm.round2, endDate: e.target.value }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Results Announcement</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.round2.resultsDate}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round2: { ...hackathonForm.round2, resultsDate: e.target.value }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    {/* Submission Requirements for Round 2 (when online/hybrid) */}
                    {(hackathonForm.round2.mode === 'online' || hackathonForm.round2.mode === 'hybrid') && (
                      <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <h5 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                          📎 Submission Requirements
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={hackathonForm.round2.submissions.pitchDeck.required}
                              onChange={(e) => setHackathonForm({
                                ...hackathonForm,
                                round2: {
                                  ...hackathonForm.round2,
                                  submissions: {
                                    ...hackathonForm.round2.submissions,
                                    pitchDeck: { ...hackathonForm.round2.submissions.pitchDeck, required: e.target.checked }
                                  }
                                }
                              })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-white">📄 Pitch Deck</span>
                              <span className="text-xs text-gray-500 block">Google Drive link</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={hackathonForm.round2.submissions.pitchingVideo.required}
                              onChange={(e) => setHackathonForm({
                                ...hackathonForm,
                                round2: {
                                  ...hackathonForm.round2,
                                  submissions: {
                                    ...hackathonForm.round2.submissions,
                                    pitchingVideo: { ...hackathonForm.round2.submissions.pitchingVideo, required: e.target.checked }
                                  }
                                }
                              })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-white">🎥 Pitching Video</span>
                              <span className="text-xs text-gray-500 block">Loom link</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={hackathonForm.round2.submissions.technicalDemo.required}
                              onChange={(e) => setHackathonForm({
                                ...hackathonForm,
                                round2: {
                                  ...hackathonForm.round2,
                                  submissions: {
                                    ...hackathonForm.round2.submissions,
                                    technicalDemo: { ...hackathonForm.round2.submissions.technicalDemo, required: e.target.checked }
                                  }
                                }
                              })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-white">💻 Technical Demo</span>
                              <span className="text-xs text-gray-500 block">YouTube link</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={hackathonForm.round2.submissions.mvp.required}
                              onChange={(e) => setHackathonForm({
                                ...hackathonForm,
                                round2: {
                                  ...hackathonForm.round2,
                                  submissions: {
                                    ...hackathonForm.round2.submissions,
                                    mvp: { ...hackathonForm.round2.submissions.mvp, required: e.target.checked }
                                  }
                                }
                              })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-white">🚀 MVP / Product</span>
                              <span className="text-xs text-gray-500 block">Product link</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Round 3: Final */}
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      Round 3: Final Demo
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Mode</label>
                        <select
                          value={hackathonForm.round3.mode}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round3: { ...hackathonForm.round3, mode: e.target.value as any }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="online">🌐 Online</option>
                          <option value="offline">📍 Offline</option>
                          <option value="hybrid">🔀 Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Final Teams</label>
                        <input
                          type="number"
                          value={hackathonForm.round3.teamsAdvancing}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round3: { ...hackathonForm.round3, teamsAdvancing: parseInt(e.target.value) || 5 }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.round3.startDate}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round3: { ...hackathonForm.round3, startDate: e.target.value }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.round3.endDate}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round3: { ...hackathonForm.round3, endDate: e.target.value }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Results Announcement</label>
                        <input
                          type="datetime-local"
                          value={hackathonForm.round3.resultsDate}
                          onChange={(e) => setHackathonForm({
                            ...hackathonForm,
                            round3: { ...hackathonForm.round3, resultsDate: e.target.value }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    {/* Submission Requirements for Round 3 (when online/hybrid) */}
                    {(hackathonForm.round3.mode === 'online' || hackathonForm.round3.mode === 'hybrid') && (
                      <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <h5 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                          📎 Submission Requirements
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={hackathonForm.round3.submissions.pitchDeck.required}
                              onChange={(e) => setHackathonForm({
                                ...hackathonForm,
                                round3: {
                                  ...hackathonForm.round3,
                                  submissions: {
                                    ...hackathonForm.round3.submissions,
                                    pitchDeck: { ...hackathonForm.round3.submissions.pitchDeck, required: e.target.checked }
                                  }
                                }
                              })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-white">📄 Pitch Deck</span>
                              <span className="text-xs text-gray-500 block">Google Drive link</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={hackathonForm.round3.submissions.pitchingVideo.required}
                              onChange={(e) => setHackathonForm({
                                ...hackathonForm,
                                round3: {
                                  ...hackathonForm.round3,
                                  submissions: {
                                    ...hackathonForm.round3.submissions,
                                    pitchingVideo: { ...hackathonForm.round3.submissions.pitchingVideo, required: e.target.checked }
                                  }
                                }
                              })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-white">🎥 Pitching Video</span>
                              <span className="text-xs text-gray-500 block">Loom link</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={hackathonForm.round3.submissions.technicalDemo.required}
                              onChange={(e) => setHackathonForm({
                                ...hackathonForm,
                                round3: {
                                  ...hackathonForm.round3,
                                  submissions: {
                                    ...hackathonForm.round3.submissions,
                                    technicalDemo: { ...hackathonForm.round3.submissions.technicalDemo, required: e.target.checked }
                                  }
                                }
                              })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-white">💻 Technical Demo</span>
                              <span className="text-xs text-gray-500 block">YouTube link</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={hackathonForm.round3.submissions.mvp.required}
                              onChange={(e) => setHackathonForm({
                                ...hackathonForm,
                                round3: {
                                  ...hackathonForm.round3,
                                  submissions: {
                                    ...hackathonForm.round3.submissions,
                                    mvp: { ...hackathonForm.round3.submissions.mvp, required: e.target.checked }
                                  }
                                }
                              })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-white">🚀 MVP / Product</span>
                              <span className="text-xs text-gray-500 block">Product link</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Idea Phase Prizes - Top 10 */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-green-400" />
                        Top Idea Prizes (Round 1)
                      </h4>
                      <select
                        value={hackathonForm.ideaPrizeCount}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) as 5 | 10;
                          setHackathonForm({
                            ...hackathonForm,
                            ideaPrizeCount: count,
                            ideaPrizes: hackathonForm.ideaPrizes.slice(0, count)
                          });
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                      >
                        <option value={5}>Top 5 Ideas</option>
                        <option value={10}>Top 10 Ideas</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {hackathonForm.ideaPrizes.slice(0, hackathonForm.ideaPrizeCount).map((prize, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">
                            {prize.rank}
                          </span>
                          <input
                            type="text"
                            value={prize.title}
                            onChange={(e) => {
                              const newPrizes = [...hackathonForm.ideaPrizes];
                              newPrizes[idx].title = e.target.value;
                              setHackathonForm({ ...hackathonForm, ideaPrizes: newPrizes });
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                            placeholder="Prize title"
                          />
                          <div className="relative">
                            <input
                              type="text"
                              value={prize.amount}
                              onChange={(e) => {
                                const newPrizes = [...hackathonForm.ideaPrizes];
                                newPrizes[idx].amount = e.target.value;
                                setHackathonForm({ ...hackathonForm, ideaPrizes: newPrizes });
                              }}
                              className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm pr-12"
                              placeholder="Amount"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                              {hackathonForm.currency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Judging Criteria - 30% Community + 70% Judges */}
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      Judging Criteria
                    </h4>
                    
                    {/* Weight Distribution */}
                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Score Distribution</span>
                        <span className="text-xs text-gray-500">Total: 100%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">👥 Community/System</span>
                            <span className="text-sm text-purple-400 font-bold">{hackathonForm.judgingCriteria.communityWeight}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={hackathonForm.judgingCriteria.communityWeight}
                            onChange={(e) => {
                              const community = parseInt(e.target.value);
                              setHackathonForm({
                                ...hackathonForm,
                                judgingCriteria: {
                                  ...hackathonForm.judgingCriteria,
                                  communityWeight: community,
                                  judgeWeight: 100 - community
                                }
                              });
                            }}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Votes, engagement, comments...</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">⚖️ Judges Panel</span>
                            <span className="text-sm text-amber-400 font-bold">{hackathonForm.judgingCriteria.judgeWeight}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={hackathonForm.judgingCriteria.judgeWeight}
                            onChange={(e) => {
                              const judge = parseInt(e.target.value);
                              setHackathonForm({
                                ...hackathonForm,
                                judgingCriteria: {
                                  ...hackathonForm.judgingCriteria,
                                  judgeWeight: judge,
                                  communityWeight: 100 - judge
                                }
                              });
                            }}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Expert evaluation scores</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Judge Categories */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Judge Scoring Categories (Total of weights should = 100%)</label>
                      <div className="space-y-2">
                        {hackathonForm.judgingCriteria.judgeCategories.map((criteria, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <input
                              type="text"
                              value={criteria.name}
                              onChange={(e) => {
                                const newCriteria = [...hackathonForm.judgingCriteria.judgeCategories];
                                newCriteria[idx].name = e.target.value;
                                setHackathonForm({
                                  ...hackathonForm,
                                  judgingCriteria: { ...hackathonForm.judgingCriteria, judgeCategories: newCriteria }
                                });
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="Criteria name"
                            />
                            <div className="relative w-24">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={criteria.weight}
                                onChange={(e) => {
                                  const newCriteria = [...hackathonForm.judgingCriteria.judgeCategories];
                                  newCriteria[idx].weight = parseInt(e.target.value) || 0;
                                  setHackathonForm({
                                    ...hackathonForm,
                                    judgingCriteria: { ...hackathonForm.judgingCriteria, judgeCategories: newCriteria }
                                  });
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm pr-8"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-400" />
                        Schedule & Events
                      </h4>
                      <button
                        onClick={() => setHackathonForm({
                          ...hackathonForm,
                          schedule: [...hackathonForm.schedule, { title: '', date: '', link: '', type: 'workshop' }]
                        })}
                        className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                      >
                        <Plus className="w-4 h-4" />
                        Add Event
                      </button>
                    </div>
                    {hackathonForm.schedule.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No events added. Click "Add Event" to create workshop, mentoring session, etc.</p>
                    ) : (
                      <div className="space-y-3">
                        {hackathonForm.schedule.map((event, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <select
                              value={event.type}
                              onChange={(e) => {
                                const newSchedule = [...hackathonForm.schedule];
                                newSchedule[idx].type = e.target.value as any;
                                setHackathonForm({ ...hackathonForm, schedule: newSchedule });
                              }}
                              className="bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-white text-sm"
                            >
                              <option value="workshop">🎓 Workshop</option>
                              <option value="mentoring">👨‍🏫 Mentoring</option>
                              <option value="ceremony">🎉 Ceremony</option>
                              <option value="other">📅 Other</option>
                            </select>
                            <input
                              type="text"
                              value={event.title}
                              onChange={(e) => {
                                const newSchedule = [...hackathonForm.schedule];
                                newSchedule[idx].title = e.target.value;
                                setHackathonForm({ ...hackathonForm, schedule: newSchedule });
                              }}
                              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="Event title"
                            />
                            <input
                              type="datetime-local"
                              value={event.date}
                              onChange={(e) => {
                                const newSchedule = [...hackathonForm.schedule];
                                newSchedule[idx].date = e.target.value;
                                setHackathonForm({ ...hackathonForm, schedule: newSchedule });
                              }}
                              className="bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-white text-sm"
                            />
                            <input
                              type="text"
                              value={event.link}
                              onChange={(e) => {
                                const newSchedule = [...hackathonForm.schedule];
                                newSchedule[idx].link = e.target.value;
                                setHackathonForm({ ...hackathonForm, schedule: newSchedule });
                              }}
                              className="w-40 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="Luma/Meet link"
                            />
                            <button
                              onClick={() => {
                                const newSchedule = hackathonForm.schedule.filter((_, i) => i !== idx);
                                setHackathonForm({ ...hackathonForm, schedule: newSchedule });
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Partner Hackathons */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        Partner Hackathons
                      </h4>
                      <button
                        onClick={() => setHackathonForm({
                          ...hackathonForm,
                          partnerHackathons: [...hackathonForm.partnerHackathons, { name: '', link: '' }]
                        })}
                        className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                      >
                        <Plus className="w-4 h-4" />
                        Add Partner
                      </button>
                    </div>
                    {hackathonForm.partnerHackathons.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No partner hackathons. Add links to related hackathons.</p>
                    ) : (
                      <div className="space-y-3">
                        {hackathonForm.partnerHackathons.map((partner, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <input
                              type="text"
                              value={partner.name}
                              onChange={(e) => {
                                const newPartners = [...hackathonForm.partnerHackathons];
                                newPartners[idx].name = e.target.value;
                                setHackathonForm({ ...hackathonForm, partnerHackathons: newPartners });
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="Partner hackathon name"
                            />
                            <input
                              type="text"
                              value={partner.link}
                              onChange={(e) => {
                                const newPartners = [...hackathonForm.partnerHackathons];
                                newPartners[idx].link = e.target.value;
                                setHackathonForm({ ...hackathonForm, partnerHackathons: newPartners });
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="https://..."
                            />
                            <button
                              onClick={() => {
                                const newPartners = hackathonForm.partnerHackathons.filter((_, i) => i !== idx);
                                setHackathonForm({ ...hackathonForm, partnerHackathons: newPartners });
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-[#111]">
                  <button
                    onClick={() => setShowHackathonForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveHackathon}
                    disabled={!hackathonForm.title || !hackathonForm.slug}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingHackathon ? 'Update' : 'Create'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Modal */}
        <AnimatePresence>
          {showScoreModal && selectedSubmission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowScoreModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    Score Submission
                  </h2>
                  <button
                    onClick={() => setShowScoreModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="p-3 bg-white/5 rounded-lg mb-4">
                    <div className="font-medium text-white">{selectedSubmission.project?.title || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">by {selectedSubmission.user?.username}</div>
                  </div>

                  {['innovation', 'execution', 'impact', 'presentation'].map((field) => (
                    <div key={field}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-400 capitalize">{field}</label>
                        <span className="text-white font-medium">{scoreForm[field as keyof typeof scoreForm]}/100</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scoreForm[field as keyof typeof scoreForm] as number}
                        onChange={(e) => setScoreForm({ ...scoreForm, [field]: parseInt(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                    </div>
                  ))}

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Total Score</span>
                      <span className="text-xl font-bold text-white">
                        {Math.round((scoreForm.innovation + scoreForm.execution + scoreForm.impact + scoreForm.presentation) / 4)}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Notes (optional)</label>
                    <textarea
                      value={scoreForm.notes}
                      onChange={(e) => setScoreForm({ ...scoreForm, notes: e.target.value })}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none resize-none"
                      placeholder="Add any notes about this submission..."
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                  <button
                    onClick={() => setShowScoreModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScoreSubmission}
                    className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save Score
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rounds Management Modal */}
        <AnimatePresence>
          {showRoundsModal && selectedHackathonForRounds && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
              onClick={() => setShowRoundsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl my-8"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-cyan-400" />
                        Manage Rounds
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Configure rounds for "{selectedHackathonForRounds.title}"
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRoundsModal(false)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {isLoadingRounds ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedHackathonRounds.map((round) => (
                        <div
                          key={round.roundNumber}
                          className="bg-white/5 border border-white/10 rounded-xl p-6"
                        >
                          {/* Round Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                              round.roundType === 'idea' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              round.roundType === 'pitching' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}>
                              {round.roundNumber}
                            </div>
                            <div className="flex-grow">
                              <input
                                type="text"
                                value={round.title}
                                onChange={(e) => updateRoundField(round.roundNumber, 'title', e.target.value)}
                                className="bg-transparent text-lg font-semibold text-white w-full focus:outline-none border-b border-transparent hover:border-white/20 focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              round.status === 'active' ? 'bg-green-500/10 text-green-400' :
                              round.status === 'completed' ? 'bg-purple-500/10 text-purple-400' :
                              round.status === 'judging' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                            </span>
                          </div>

                          {/* Round Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Round Type */}
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Round Type</label>
                              <select
                                value={round.roundType}
                                onChange={(e) => updateRoundField(round.roundNumber, 'roundType', e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              >
                                <option value="idea">Idea Submission</option>
                                <option value="pitching">Pitching</option>
                                <option value="final">Final Demo</option>
                              </select>
                            </div>

                            {/* Mode */}
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Mode</label>
                              <select
                                value={round.mode}
                                onChange={(e) => updateRoundField(round.roundNumber, 'mode', e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              >
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                                <option value="hybrid">Hybrid</option>
                              </select>
                            </div>

                            {/* Status */}
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Status</label>
                              <select
                                value={round.status}
                                onChange={(e) => updateRoundField(round.roundNumber, 'status', e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              >
                                <option value="upcoming">Upcoming</option>
                                <option value="active">Active</option>
                                <option value="judging">Judging</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>

                            {/* Start Date */}
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                              <input
                                type="datetime-local"
                                value={round.startDate ? new Date(round.startDate).toISOString().slice(0, 16) : ''}
                                onChange={(e) => updateRoundField(round.roundNumber, 'startDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              />
                            </div>

                            {/* End Date */}
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">End Date</label>
                              <input
                                type="datetime-local"
                                value={round.endDate ? new Date(round.endDate).toISOString().slice(0, 16) : ''}
                                onChange={(e) => updateRoundField(round.roundNumber, 'endDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                              />
                            </div>

                            {/* Teams Advancing */}
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Teams Advancing</label>
                              <input
                                type="number"
                                min="1"
                                value={round.teamsAdvancing || ''}
                                onChange={(e) => updateRoundField(round.roundNumber, 'teamsAdvancing', parseInt(e.target.value) || 0)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                placeholder="Number of teams"
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div className="mt-4">
                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                            <textarea
                              value={round.description || ''}
                              onChange={(e) => updateRoundField(round.roundNumber, 'description', e.target.value)}
                              rows={2}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none"
                              placeholder="Describe what happens in this round..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowRoundsModal(false)}
                    className="px-5 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRounds}
                    disabled={isSavingRounds}
                    className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingRounds ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save Rounds
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-[#111] border border-white/5 rounded-xl p-6">
            <div className="space-y-4">
              {activityLog.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
                  <Activity className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="flex-grow">
                    <div className="text-sm text-white capitalize">{log.action.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {activityLog.length === 0 && (
                <p className="text-gray-500 text-center py-4">No activity yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
