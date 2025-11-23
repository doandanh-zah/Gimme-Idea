
'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { ArrowLeft, ExternalLink, ThumbsUp, ThumbsDown, Send, Shield, Wallet, DollarSign, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentModal } from './PaymentModal';
import toast from 'react-hot-toast';
import { Comment } from '../lib/types';

interface CommentItemProps {
    comment: Comment;
    projectId: string;
    isReply?: boolean;
    onTip: (commentId: string, author: string) => void;
}

// Extracted CommentItem to prevent re-renders and isolate state
const CommentItem: React.FC<CommentItemProps> = ({ 
    comment, 
    projectId, 
    isReply = false,
    onTip
}) => {
    const { user, likeComment, dislikeComment, replyComment } = useAppStore();
    const [replyingTo, setReplyingTo] = useState(false);
    const [replyText, setReplyText] = useState('');
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

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please connect wallet to reply");
            return;
        }
        if (!replyText.trim()) return;
        replyComment(projectId, comment.id, replyText, user.username);
        setReplyText('');
        setReplyingTo(false);
        toast.success('Reply posted!');
    };

    return (
        <div className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isReply ? 'ml-12 mt-4' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-400 flex-shrink-0">
                {comment.author[0].toUpperCase()}
            </div>
            <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{comment.author}</span>
                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    {comment.tips > 0 && (
                        <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 flex items-center gap-1">
                            <DollarSign className="w-2 h-2" /> {comment.tips}
                        </span>
                    )}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">{comment.content}</p>
                
                {/* Actions */}
                <div className="flex items-center gap-4">
                    <motion.button 
                        onClick={handleLike}
                        whileTap={{ scale: 0.8 }}
                        className={`flex items-center gap-1 text-xs transition-colors relative ${hasLiked ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        <ThumbsUp className={`w-3 h-3 ${hasLiked ? 'fill-white text-white' : ''}`} /> 
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
                    
                    <button 
                        onClick={handleDislike}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                        <ThumbsDown className="w-3 h-3" /> {comment.dislikes || 0}
                    </button>
                    
                    {!isReply && (
                        <button 
                            onClick={() => setReplyingTo(!replyingTo)}
                            className={`flex items-center gap-1 text-xs transition-colors ${replyingTo ? 'text-accent' : 'text-gray-500 hover:text-accent'}`}
                        >
                            <MessageCircle className="w-3 h-3" /> Reply
                        </button>
                    )}
                    
                    <button 
                        onClick={() => onTip(comment.id, comment.author)}
                        className="flex items-center gap-1 text-xs text-gold/80 hover:text-gold transition-colors"
                    >
                        <DollarSign className="w-3 h-3" /> Tip USDC
                    </button>
                </div>

                {/* Reply Input */}
                {replyingTo && (
                    <form onSubmit={handleReplySubmit} className="mt-3 flex gap-3 animate-in fade-in slide-in-from-top-1">
                        <input 
                            autoFocus
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50 text-white"
                        />
                        <button type="submit" className="px-3 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200">
                            Reply
                        </button>
                    </form>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2">
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} projectId={projectId} isReply={true} onTip={onTip} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const ProjectDetail = () => {
  const { projects, selectedProjectId, setView, voteProject, addComment, user, connectWallet, tipComment, openUserProfile } = useAppStore();
  const [commentText, setCommentText] = useState('');
  
  // Payment Modal State
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [paymentContext, setPaymentContext] = useState<'project' | 'comment'>('project');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  const project = projects.find(p => p.id === selectedProjectId);

  if (!project) return null;

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast.error("Please connect wallet to comment");
        return;
    }
    if (!commentText.trim()) return;
    try {
      await addComment(project.id, commentText);
      setCommentText('');
      toast.success('Comment posted!');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleVote = async () => {
    try {
      await voteProject(project.id);
      toast.success('Voted!');
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  // Triggered from Project Button
  const openProjectTip = () => {
    setPaymentContext('project');
    setPaymentRecipient(project.title);
    setShowPayment(true);
  };

  // Triggered from Comment Item
  const openCommentTip = (commentId: string, author: string) => {
      if (!user) {
          toast.error("Connect wallet to tip");
          return;
      }
      setSelectedCommentId(commentId);
      setPaymentContext('comment');
      setPaymentRecipient(author);
      setShowPayment(true);
  };

  const handlePaymentConfirm = (amount: number) => {
      if (paymentContext === 'comment' && selectedCommentId) {
          tipComment(project.id, selectedCommentId, amount);
          toast.success(`Tipped ${amount} USDC to ${paymentRecipient}`);
      } else {
          toast.success(`Contributed ${amount} USDC to ${project.title}`);
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-32 pb-20 px-6 max-w-5xl mx-auto min-h-screen"
    >
      {/* Back Button */}
      <button
        onClick={() => setView('projects-dashboard')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Explore
      </button>

      {/* Header Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
         <div className="rounded-2xl overflow-hidden border border-white/10 h-[300px] md:h-[400px] relative group">
            {project.image ? (
               <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
               <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-black" />
            )}
            <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-black/60 backdrop-blur text-white text-xs font-mono rounded-full border border-white/10">
                    {project.stage}
                </span>
            </div>
         </div>

         <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{project.title}</h1>
            
            <div
                className="flex items-center gap-3 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => project.author && openUserProfile(project.author)}
            >
                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                    {project.author?.avatar ? (
                        <img src={project.author.avatar} alt={project.author.username} />
                    ) : (
                        <div className="w-full h-full bg-purple-500" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-bold">{project.author?.username || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400 font-mono">{project.author?.wallet || 'Hidden'}</p>
                </div>
            </div>

            <p className="text-gray-300 text-lg mb-8 leading-relaxed">{project.description}</p>

            <div className="flex flex-wrap gap-4">
                {project.website && (
                    <a 
                        href={project.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-accent transition-all flex items-center gap-2"
                    >
                        Visit Project <ExternalLink className="w-4 h-4" />
                    </a>
                )}
                <button 
                    onClick={openProjectTip}
                    className="px-6 py-3 border border-white/20 rounded-full font-bold hover:bg-white/5 transition-all flex items-center gap-2"
                >
                    <Wallet className="w-4 h-4 text-gold" /> Support / Bounty
                </button>
            </div>
         </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
         <motion.div 
            onClick={handleVote} 
            whileTap={{ scale: 0.95 }}
            className="text-center cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors"
         >
            <ThumbsUp className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <div className="text-2xl font-bold">{project.votes}</div>
            <div className="text-xs text-gray-500 uppercase">Votes</div>
         </motion.div>
         <div className="text-center p-2">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <div className="text-2xl font-bold">{project.feedbackCount}</div>
            <div className="text-xs text-gray-500 uppercase">Feedback</div>
         </div>
         <div className="text-center p-2">
            <Shield className="w-6 h-6 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold">Audit</div>
            <div className="text-xs text-gray-500 uppercase">Status</div>
         </div>
         <div className="text-center p-2 border-l border-white/5">
            <div className="text-gold font-mono text-xl mb-1">
                {project.bounty ? `$${project.bounty} USDC` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 uppercase">Bounty Pool</div>
         </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-3xl">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            Discussion <span className="text-sm font-normal text-gray-500">({project.comments?.length || 0})</span>
        </h3>

        {/* Input */}
        <div className="mb-8 bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
            {!user ? (
                <div className="text-center py-4">
                    <p className="text-gray-400 mb-2">Connect wallet to join the discussion</p>
                    <button onClick={() => connectWallet('Phantom')} className="text-accent hover:underline">Connect Wallet</button>
                </div>
            ) : (
                <form onSubmit={handleComment} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0" />
                    <div className="flex-grow">
                        <textarea 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a constructive comment..."
                            className="w-full bg-transparent border-b border-white/10 focus:border-accent outline-none min-h-[40px] resize-y py-2 transition-colors text-white"
                        />
                        <div className="flex justify-end mt-2">
                            <button type="submit" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                Send <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>

        {/* List */}
        <div className="space-y-6">
            {project.comments && project.comments.length > 0 ? (
                project.comments.map((comment) => (
                    <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        projectId={project.id} 
                        onTip={openCommentTip}
                    />
                ))
            ) : (
                <p className="text-gray-500 text-sm italic">No comments yet. Be the first!</p>
            )}
        </div>
      </div>

      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        recipientName={paymentRecipient}
        context={paymentContext}
        onConfirm={handlePaymentConfirm}
      />
    </motion.div>
  );
};
