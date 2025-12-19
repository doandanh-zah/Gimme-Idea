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
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

interface Hackathon {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  status: 'draft' | 'upcoming' | 'active' | 'judging' | 'completed' | 'cancelled';
  prizePool?: string;
  participantsCount: number;
  maxParticipants?: number;
  registrationStart?: string;
  registrationEnd?: string;
  submissionStart?: string;
  submissionEnd?: string;
  judgingStart?: string;
  judgingEnd?: string;
  isFeatured: boolean;
  createdAt: string;
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
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ideas' | 'projects' | 'hackathons' | 'challenges' | 'ai-tools' | 'activity'>('overview');
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
    prizePool: '',
    status: 'draft' as 'draft' | 'upcoming' | 'active' | 'judging' | 'completed' | 'cancelled',
    maxParticipants: 100,
    registrationStart: '',
    registrationEnd: '',
    submissionStart: '',
    submissionEnd: '',
    judgingStart: '',
    judgingEnd: '',
  });

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
      const res = await fetch(`${API_URL}/admin/stats`);
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
      const res = await fetch(`${API_URL}/admin/users`);
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

  // Fetch all projects
  const fetchAllProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await apiClient.getProjects({ limit: 500 });
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
      const res = await fetch(`${API_URL}/admin/hackathons`);
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
      const res = await fetch(`${API_URL}/admin/hackathons/${hackathonId}/submissions`);
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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_URL}/admin/hackathons/${id}`, { method: 'DELETE' });
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
      prizePool: '',
      status: 'draft',
      maxParticipants: 100,
      registrationStart: '',
      registrationEnd: '',
      submissionStart: '',
      submissionEnd: '',
      judgingStart: '',
      judgingEnd: '',
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
    setHackathonForm({
      slug: hackathon.slug,
      title: hackathon.title,
      tagline: hackathon.tagline || '',
      description: hackathon.description || '',
      prizePool: hackathon.prizePool || '',
      status: hackathon.status,
      maxParticipants: hackathon.maxParticipants || 100,
      registrationStart: hackathon.registrationStart?.slice(0, 16) || '',
      registrationEnd: hackathon.registrationEnd?.slice(0, 16) || '',
      submissionStart: hackathon.submissionStart?.slice(0, 16) || '',
      submissionEnd: hackathon.submissionEnd?.slice(0, 16) || '',
      judgingStart: hackathon.judgingStart?.slice(0, 16) || '',
      judgingEnd: hackathon.judgingEnd?.slice(0, 16) || '',
    });
    setShowHackathonForm(true);
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
                className="bg-[#111] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
                      <input
                        type="text"
                        value={hackathonForm.title}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="Gimme Idea Global Hackathon 2025"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Slug *</label>
                      <input
                        type="text"
                        value={hackathonForm.slug}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="global-hackathon-2025"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                      <select
                        value={hackathonForm.status}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, status: e.target.value as any })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="judging">Judging</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tagline</label>
                      <input
                        type="text"
                        value={hackathonForm.tagline}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, tagline: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="Build the future of innovation"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                      <textarea
                        value={hackathonForm.description}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, description: e.target.value })}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none resize-none"
                        placeholder="Describe your hackathon..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Prize Pool</label>
                      <input
                        type="text"
                        value={hackathonForm.prizePool}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, prizePool: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="$10,000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Max Participants</label>
                      <input
                        type="number"
                        value={hackathonForm.maxParticipants}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, maxParticipants: parseInt(e.target.value) || 100 })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="border-t border-white/10 my-4 pt-4">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          Timeline
                        </h4>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Registration Start</label>
                      <input
                        type="datetime-local"
                        value={hackathonForm.registrationStart}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, registrationStart: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Registration End</label>
                      <input
                        type="datetime-local"
                        value={hackathonForm.registrationEnd}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, registrationEnd: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Submission Start</label>
                      <input
                        type="datetime-local"
                        value={hackathonForm.submissionStart}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, submissionStart: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Submission End</label>
                      <input
                        type="datetime-local"
                        value={hackathonForm.submissionEnd}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, submissionEnd: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Judging Start</label>
                      <input
                        type="datetime-local"
                        value={hackathonForm.judgingStart}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, judgingStart: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Judging End</label>
                      <input
                        type="datetime-local"
                        value={hackathonForm.judgingEnd}
                        onChange={(e) => setHackathonForm({ ...hackathonForm, judgingEnd: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
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
