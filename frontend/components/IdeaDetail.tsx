
'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle, Send, EyeOff, User, DollarSign, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Comment } from '../lib/types';
import { PaymentModal } from './PaymentModal';
import { useRealtimeComments } from '../hooks/useRealtimeComments';
import { AICommentBadge } from './AICommentBadge';
import { MarkdownContent } from './MarkdownContent';
import { MarkdownGuide } from './MarkdownGuide';
import { AuthorLink, AuthorAvatar } from './AuthorLink';

interface CommentItemProps {
    comment: Comment;
    projectId: string;
    isReply?: boolean;
    onTip: (commentId: string, author: string, wallet: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, projectId, isReply = false, onTip }) => {
    const { user, likeComment, dislikeComment, replyComment } = useAppStore();
    const [replyingTo, setReplyingTo] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isAnonReply, setIsAnonReply] = useState(false);
    const [showBurst, setShowBurst] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);

    const handleLike = () => {
        if (!hasLiked) {
             likeComment(projectId, comment.id);
             setHasLiked(true);
             setShowBurst(true);
             setTimeout(() => setShowBurst(false), 800);
        }
    };

    const handleDislike = () => {
        dislikeComment(projectId, comment.id);
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please connect wallet to reply");
            return;
        }
        try {
            await replyComment(projectId, comment.id, replyText, isAnonReply);
            setReplyText('');
            setReplyingTo(false);
            toast.success('Reply posted!');
        } catch (error) {
            toast.error('Failed to post reply');
        }
    };

    const authorName = comment.isAnonymous ? 'Anonymous' : (comment.author?.username || 'Anonymous');
    const tipsAmount = comment.tipsAmount || comment.tips || 0;
    const timestamp = comment.createdAt || comment.timestamp || '';

    return (
        <div className={`flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isReply ? 'ml-12 mt-4' : ''}`}>
                    <AuthorAvatar
                        username={comment.author?.username || 'Anonymous'}
                        avatar={comment.author?.avatar}
                        isAnonymous={comment.isAnonymous}
                        size="lg"
                    />
            <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <AuthorLink
                        username={comment.author?.username || 'Anonymous'}
                        avatar={comment.author?.avatar}
                        isAnonymous={comment.isAnonymous}
                        showAvatar={false}
                        className="font-bold text-sm"
                    />
                    {comment.is_ai_generated && (
                        <AICommentBadge model={comment.ai_model} />
                    )}
                    <span className="text-xs text-gray-600">{new Date(timestamp).toLocaleDateString()}</span>
                    {tipsAmount > 0 && (
                        <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 flex items-center gap-1">
                            <DollarSign className="w-2 h-2" /> {tipsAmount}
                        </span>
                    )}
                </div>
                <div className="text-gray-300 text-sm leading-relaxed mb-3">
                    <MarkdownContent content={comment.content} />
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <motion.button 
                        onClick={handleLike}
                        whileTap={{ scale: 0.8 }}
                        className={`flex items-center gap-1 transition-colors relative ${hasLiked ? 'text-gold' : 'hover:text-white'}`}
                    >
                        <ThumbsUp className={`w-3 h-3 ${hasLiked ? 'fill-current' : ''}`} /> 
                        <AnimatePresence mode="wait">
                             <motion.span 
                                key={comment.likes} 
                                initial={{y: -5, opacity: 0}} 
                                animate={{y:0, opacity:1}}
                             >
                                {comment.likes || 0}
                             </motion.span>
                        </AnimatePresence>
                        
                        {/* Burst Animation */}
                        {showBurst && (
                            <>
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={`burst-${i}`}
                                        className="absolute top-1/2 left-0 w-1 h-1 rounded-full pointer-events-none"
                                        style={{ backgroundColor: i % 2 === 0 ? '#FFD700' : '#FFF' }}
                                        initial={{ scale: 0, x: 0, y: 0 }}
                                        animate={{ 
                                            scale: [1, 0],
                                            x: Math.cos(i * 45 * (Math.PI / 180)) * 24,
                                            y: Math.sin(i * 45 * (Math.PI / 180)) * 24 - 10,
                                        }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                    />
                                ))}
                            </>
                        )}
                    </motion.button>

                    {comment.dislikes !== undefined && (
                        <button onClick={handleDislike} className="flex items-center gap-1 hover:text-red-400">
                            <ThumbsDown className="w-3 h-3" /> {comment.dislikes || 0}
                        </button>
                    )}

                    <button 
                        onClick={() => setReplyingTo(!replyingTo)} 
                        className={`flex items-center gap-1 hover:text-white ${replyingTo ? 'text-white' : ''}`}
                    >
                        <MessageCircle className="w-3 h-3" /> Reply
                    </button>

                    <button
                        onClick={() => {
                            const wallet = comment.author?.wallet || '';
                            onTip(comment.id, authorName, wallet);
                        }}
                        className="flex items-center gap-1 text-gold/80 hover:text-gold transition-colors"
                        disabled={comment.isAnonymous || !comment.author?.wallet}
                    >
                        <DollarSign className="w-3 h-3" /> Tip SOL
                    </button>
                </div>

                {replyingTo && (
                    <form onSubmit={handleReplySubmit} className="mt-3 bg-white/5 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                        <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-white text-sm"
                            placeholder="Write a reply..."
                        />
                         <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                             <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                                <input type="checkbox" checked={isAnonReply} onChange={e => setIsAnonReply(e.target.checked)} />
                                Reply Anonymously
                             </label>
                             <button type="submit" className="text-xs bg-white text-black px-3 py-1 rounded font-bold hover:bg-gray-200">Post</button>
                         </div>
                    </form>
                )}

                {comment.replies?.map(reply => (
                    <CommentItem key={reply.id} comment={reply} projectId={projectId} isReply={true} onTip={onTip} />
                ))}
            </div>
        </div>
    );
};

export const IdeaDetail = () => {
  const {
    selectedProject,
    voteProject,
    addComment,
    user,
    openConnectReminder,
    tipComment,
    handleRealtimeNewComment,
    handleRealtimeUpdateComment,
    handleRealtimeDeleteComment,
  } = useAppStore();
  const router = useRouter();
  const [commentText, setCommentText] = useState('');
  const [isAnonComment, setIsAnonComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Modal State
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [recipientWallet, setRecipientWallet] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  const project = selectedProject;

  // Subscribe to realtime comment updates for this project
  useRealtimeComments({
    projectId: project?.id || '',
    onNewComment: (comment) => {
      if (project?.id) {
        handleRealtimeNewComment(project.id, comment);
      }
    },
    onUpdateComment: (comment) => {
      if (project?.id) {
        handleRealtimeUpdateComment(project.id, comment);
      }
    },
    onDeleteComment: (commentId) => {
      if (project?.id) {
        handleRealtimeDeleteComment(project.id, commentId);
      }
    },
  });

  if (!project) return null;

  const handleVote = async () => {
      try {
        await voteProject(project.id);
        toast.success('Vote recorded!');
      } catch (error) {
        toast.error('Failed to record vote');
      }
  };

  const handleShareToX = () => {
      // Create shareable URL with proper routing
      const ideaUrl = `${window.location.origin}/idea/${project.id}`;

      // Create tweet text
      const tweetText = `Check out this idea on Gimme Idea: "${project.title}"\n\n${project.description?.substring(0, 100)}${project.description?.length > 100 ? '...' : ''}\n\n`;

      // Create Twitter intent URL
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(ideaUrl)}`;

      // Open in new window
      window.open(twitterUrl, '_blank', 'width=550,height=420');
      toast.success('Opening Twitter...');
  };

  const handleComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) {
          openConnectReminder();
          return;
      }
      if (isSubmitting || !commentText.trim()) return; // Prevent double submit

      setIsSubmitting(true);
      try {
        await addComment(project.id, commentText, isAnonComment);
        setCommentText('');
        toast.success('Comment added');
      } catch (error) {
        toast.error('Failed to add comment');
      } finally {
        setIsSubmitting(false);
      }
  };

  const openCommentTip = (commentId: string, author: string, wallet: string) => {
      if (!user) {
          toast.error("Connect wallet to tip");
          return;
      }
      setSelectedCommentId(commentId);
      setPaymentRecipient(author);
      setRecipientWallet(wallet);
      setShowPayment(true);
  };

  const handlePaymentConfirm = (amount: number) => {
      if (selectedCommentId) {
          tipComment(project.id, selectedCommentId, amount);
          toast.success(`Tipped ${amount} SOL to ${paymentRecipient}`);
      }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-24 sm:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
            {/* Nav */}
            <button onClick={() => router.push('/idea')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 sm:mb-8 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Ideas
            </button>

            {/* Header */}
            <div className="mb-8 sm:mb-12">
                <div className="flex flex-col gap-4 mb-6">
                     <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold leading-tight">{project.title}</h1>
                     <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                         <button
                            onClick={handleShareToX}
                            className="bg-[#1DA1F2] text-white px-4 sm:px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(29,161,242,0.3)] text-sm"
                         >
                             <Share2 className="w-4 h-4" /> Share
                         </button>
                         <button
                            onClick={handleVote}
                            className="bg-[#FFD700] text-black px-4 sm:px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,215,0,0.3)] text-sm"
                         >
                             <ThumbsUp className="w-4 h-4" /> {project.votes}
                         </button>
                     </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8 border-b border-white/10 pb-6 sm:pb-8">
                     <AuthorLink
                         username={project.author?.username || 'Anonymous'}
                         avatar={project.author?.avatar}
                         isAnonymous={project.isAnonymous || !project.author}
                         showAvatar={true}
                         avatarSize="md"
                     />
                     <span>•</span>
                     <span>{project.category}</span>
                     <span>•</span>
                     <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Content Blocks */}
                <div className="space-y-12">
                     <section>
                         <h3 className="text-xl font-bold text-[#FFD700] mb-4 font-mono uppercase tracking-wider">The Problem</h3>
                         <div className="text-lg text-gray-200 leading-relaxed">
                             <MarkdownContent content={project.problem} />
                         </div>
                     </section>
                     
                     <section>
                         <h3 className="text-xl font-bold text-[#FFD700] mb-4 font-mono uppercase tracking-wider">The Solution</h3>
                         <div className="p-6 bg-white/5 border-l-4 border-[#FFD700] rounded-r-xl">
                            <div className="text-lg text-white leading-relaxed">
                                <MarkdownContent content={project.solution} />
                            </div>
                         </div>
                     </section>

                     <section>
                         <h3 className="text-sm font-bold text-gray-500 mb-2 font-mono uppercase">Opportunity</h3>
                         <div className="text-gray-300">
                             {project.opportunity ? <MarkdownContent content={project.opportunity} /> : "Not specified."}
                         </div>
                     </section>
                </div>
            </div>

            {/* Comments */}
            <div className="border-t border-white/10 pt-12">
                <h3 className="text-2xl font-bold mb-8">Discussion ({project.comments?.length || 0})</h3>
                
                <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 mb-10">
                    {!user ? (
                         <div className="text-center py-4">
                             <p className="text-gray-400 mb-2">Sign in to join the discussion</p>
                             <button onClick={() => openConnectReminder()} className="text-[#FFD700] underline">Sign in</button>
                         </div>
                    ) : (
                        <form onSubmit={handleComment}>
                            <textarea 
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                className="w-full bg-transparent border-b border-white/10 outline-none text-white min-h-[80px] mb-4"
                                placeholder="Add your insight or question..."
                            />
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                                        <div className={`w-4 h-4 border rounded ${isAnonComment ? 'bg-[#FFD700] border-[#FFD700]' : 'border-gray-500'}`}>
                                            {isAnonComment && <EyeOff className="w-3 h-3 text-black" />}
                                        </div>
                                        <input type="checkbox" checked={isAnonComment} onChange={e => setIsAnonComment(e.target.checked)} className="hidden" />
                                        Comment Anonymously
                                    </label>
                                    <MarkdownGuide />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !commentText.trim()}
                                    className="bg-white text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send'} <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div>
                    {project.comments?.map(comment => (
                        <CommentItem 
                            key={comment.id} 
                            comment={comment} 
                            projectId={project.id} 
                            onTip={openCommentTip}
                        />
                    ))}
                </div>
            </div>
        </div>

        <PaymentModal
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            recipientName={paymentRecipient}
            recipientWallet={recipientWallet}
            context={'comment'}
            onConfirm={handlePaymentConfirm}
        />
    </motion.div>
  );
};
