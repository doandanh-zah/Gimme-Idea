
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Edit2, Save, X, Github, Twitter, Facebook, Send, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import toast from 'react-hot-toast';
import { Project } from '../lib/types';

export const Profile = () => {
  const { user, viewedUser, projects, updateUserProfile, updateProject, deleteProject, openSubmitModal } = useAppStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine which profile to show: the viewedUser (from clicking an author) or the logged-in user
  const displayUser = viewedUser || user;
  const isOwnProfile = user && displayUser && user.username === displayUser.username;

  // Profile Edit Form State
  const [editForm, setEditForm] = useState({
      username: '',
      bio: '',
      twitter: '',
      github: '',
      telegram: '',
      facebook: '',
      avatar: ''
  });

  // Project Edit Form State
  const [projectForm, setProjectForm] = useState({
      title: '',
      description: '',
      website: '',
      bounty: ''
  });

  // Initialize form when displayUser changes
  useEffect(() => {
      if (displayUser) {
          setEditForm({
            username: displayUser.username,
            bio: displayUser.bio || '',
            twitter: displayUser.socials?.twitter || '',
            github: displayUser.socials?.github || '',
            telegram: displayUser.socials?.telegram || '',
            facebook: displayUser.socials?.facebook || '',
            avatar: displayUser.avatar || ''
          });
      }
  }, [displayUser]);

  if (!displayUser) {
      return (
          <div className="min-h-screen flex items-center justify-center pt-20">
              <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
                  <button onClick={() => router.push('/home')} className="text-accent underline">Go Home</button>
              </div>
          </div>
      );
  }

  const userProjects = projects.filter(p => p.author.username === displayUser.username);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Check file size (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
            toast.error('Image size must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Check if base64 string is too large (max ~2MB after encoding)
            // Base64 encoding increases size by ~37%, so 2MB file becomes ~2.7MB as base64
            if (result.length > 2800000) {
                toast.error('Avatar image is too large after encoding. Please use a smaller image.');
                return;
            }
            setEditForm({ ...editForm, avatar: result });
            toast.success('Avatar uploaded! Remember to save your profile.');
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
      if (!isOwnProfile) return;
      try {
          // API expects socialLinks but User type has socials, so we send the correct format to API
          await updateUserProfile({
              username: editForm.username,
              bio: editForm.bio,
              avatar: editForm.avatar,
              socialLinks: {
                  twitter: editForm.twitter,
                  github: editForm.github,
                  telegram: editForm.telegram,
                  facebook: editForm.facebook
              }
          } as any); // Type assertion needed due to API/User type mismatch
          setIsEditing(false);
          toast.success("Profile Updated!");
      } catch (error) {
          toast.error("Failed to update profile. Please try again.");
      }
  };

  const handleCancelProfile = () => {
      if (!user) return;
      setEditForm({
        username: user.username,
        bio: user.bio || '',
        twitter: user.socials?.twitter || '',
        github: user.socials?.github || '',
        telegram: user.socials?.telegram || '',
        facebook: user.socials?.facebook || '',
        avatar: user.avatar || ''
      });
      setIsEditing(false);
  };

  const startEditingProject = (project: Project) => {
      setEditingProject(project);
      setProjectForm({
          title: project.title,
          description: project.description,
          website: project.website || '',
          bounty: project.bounty?.toString() || ''
      });
  };

  const handleDeleteProject = (id: string) => {
      if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
          deleteProject(id);
          toast.success("Project deleted");
      }
  };

  const saveProject = () => {
      if (editingProject) {
          updateProject({
              id: editingProject.id,
              title: projectForm.title,
              description: projectForm.description,
              website: projectForm.website,
              bounty: projectForm.bounty ? Number(projectForm.bounty) : undefined
          });
          setEditingProject(null);
          toast.success("Project Updated!");
      }
  };

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-20 relative"
    >
        {/* Fixed Background */}
        <div className="fixed inset-0 z-[-1] bg-black bg-[radial-gradient(circle_at_50%_0%,#2e1065_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#422006_0%,transparent_50%)]" />

        {/* Banner - Updated Gradient (Purple to Gold) */}
        <div className="h-64 w-full bg-gradient-to-r from-[#9945FF]/40 via-purple-900/40 to-[#FFD700]/20 relative">
            <div className="absolute inset-0 bg-black/20" />
            {/* Back Button if viewing another profile */}
            {!isOwnProfile && (
                <button
                    onClick={() => router.back()}
                    className="absolute top-8 left-8 z-20 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 hover:bg-black/70 transition-colors text-white"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            )}
        </div>

        <div className="max-w-5xl mx-auto px-6 relative -mt-20">
            {/* Header / Info Card */}
            <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-[#0A0A0A] overflow-hidden bg-gray-800 shadow-lg">
                            <img src={isEditing ? editForm.avatar : displayUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Hidden File Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                        />

                        {isEditing && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <Camera className="w-8 h-8 text-white" />
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow w-full">
                        <div className="flex justify-between items-start">
                            <div className="w-full">
                                {isEditing ? (
                                    <div className="space-y-4 max-w-lg">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Username</label>
                                            <input 
                                                value={editForm.username}
                                                onChange={e => setEditForm({...editForm, username: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Bio</label>
                                            <textarea 
                                                value={editForm.bio}
                                                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white h-24 resize-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl font-bold font-display mb-2">{displayUser.username}</h1>
                                        <p className="text-gray-400 font-mono text-sm mb-4 bg-white/5 inline-block px-2 py-1 rounded">{displayUser.wallet}</p>
                                        <p className="text-gray-300 leading-relaxed max-w-2xl mb-6">{displayUser.bio || "No bio yet."}</p>
                                    </>
                                )}
                            </div>

                            {isOwnProfile && !isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-full flex items-center gap-2 text-sm transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit Profile
                                </button>
                            )}
                        </div>

                        {/* Social Links Editing */}
                        {isEditing && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-2xl">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase flex items-center gap-2"><Twitter className="w-3 h-3" /> X (Twitter)</label>
                                    <input 
                                        value={editForm.twitter}
                                        onChange={e => setEditForm({...editForm, twitter: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white text-sm"
                                        placeholder="https://x.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase flex items-center gap-2"><Github className="w-3 h-3" /> GitHub</label>
                                    <input 
                                        value={editForm.github}
                                        onChange={e => setEditForm({...editForm, github: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white text-sm"
                                        placeholder="https://github.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase flex items-center gap-2"><Send className="w-3 h-3" /> Telegram</label>
                                    <input 
                                        value={editForm.telegram}
                                        onChange={e => setEditForm({...editForm, telegram: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white text-sm"
                                        placeholder="t.me/..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase flex items-center gap-2"><Facebook className="w-3 h-3" /> Facebook</label>
                                    <input 
                                        value={editForm.facebook}
                                        onChange={e => setEditForm({...editForm, facebook: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white text-sm"
                                        placeholder="facebook.com/..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Social Links Display */}
                        {!isEditing && (
                            <div className="flex gap-4 mt-2">
                                {displayUser.socials?.twitter && (
                                    <a href={displayUser.socials.twitter} target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-blue-400/20 hover:text-blue-400 transition-colors">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                )}
                                {displayUser.socials?.github && (
                                    <a href={displayUser.socials.github} target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-gray-500/20 hover:text-white transition-colors">
                                        <Github className="w-5 h-5" />
                                    </a>
                                )}
                                {displayUser.socials?.telegram && (
                                    <a href={displayUser.socials.telegram} target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-blue-500/20 hover:text-blue-500 transition-colors">
                                        <Send className="w-5 h-5" />
                                    </a>
                                )}
                                {displayUser.socials?.facebook && (
                                    <a href={displayUser.socials.facebook} target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-blue-600/20 hover:text-blue-600 transition-colors">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        )}

                        {isEditing && (
                            <div className="flex gap-3 mt-8">
                                <button 
                                    onClick={handleSaveProfile}
                                    className="px-8 py-3 bg-[#ffd700] hover:bg-[#ffed4a] text-black rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 transition-all"
                                >
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                                <button 
                                    onClick={handleCancelProfile}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 flex items-center gap-2 transition-colors"
                                >
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/5">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{displayUser.reputation}</div>
                        <div className="text-xs text-gray-500 uppercase">Reputation</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gold">${displayUser.balance}</div>
                        <div className="text-xs text-gray-500 uppercase">Balance</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{userProjects.length}</div>
                        <div className="text-xs text-gray-500 uppercase">Projects</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">12</div>
                        <div className="text-xs text-gray-500 uppercase">Contributions</div>
                    </div>
                </div>
            </div>

            {/* My Projects / User Projects */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">{isOwnProfile ? "My Projects" : `${displayUser.username}'s Projects`}</h2>
                {userProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userProjects.map(project => (
                            <div key={project.id} className="relative group">
                                <ProjectCard project={project} />
                                {/* Actions Overlay - Moved to Bottom Right of the IMAGE to avoid overlapping text */}
                                {isOwnProfile && (
                                    <div className="absolute top-24 right-2 z-20 flex gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditingProject(project);
                                            }}
                                            className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 hover:border-accent transition-all shadow-lg backdrop-blur-sm"
                                            title="Edit"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProject(project.id);
                                            }}
                                            className="p-1.5 bg-black/60 hover:bg-red-900/80 text-white rounded-full border border-white/20 hover:border-red-500 transition-all shadow-lg backdrop-blur-sm"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <p className="text-gray-500 mb-4">No projects deployed yet.</p>
                        {isOwnProfile && (
                            <button onClick={() => openSubmitModal('project')} className="text-accent font-bold hover:underline">Start Building</button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Edit Project Modal */}
        {editingProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#0F0F0F] w-full max-w-lg border border-white/10 rounded-2xl p-6 shadow-2xl relative"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Edit Project</h2>
                        <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Project Title</label>
                            <input 
                                value={projectForm.title}
                                onChange={e => setProjectForm({...projectForm, title: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                            <textarea 
                                value={projectForm.description}
                                onChange={e => setProjectForm({...projectForm, description: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-accent h-32 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Website URL</label>
                            <input 
                                value={projectForm.website}
                                onChange={e => setProjectForm({...projectForm, website: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Bounty (USDC)</label>
                            <input 
                                type="number"
                                value={projectForm.bounty}
                                onChange={e => setProjectForm({...projectForm, bounty: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button 
                            onClick={saveProject}
                            className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-accent transition-colors"
                        >
                            Save Changes
                        </button>
                        <button 
                            onClick={() => setEditingProject(null)}
                            className="px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 text-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </motion.div>
  );
};
