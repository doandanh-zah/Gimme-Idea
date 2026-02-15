
'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle, Send, EyeOff, User, DollarSign, Share2, Pencil, Trash2, X, Check, Loader2, Bookmark, ChevronDown, Archive } from 'lucide-react';
import { BookmarkModal } from './BookmarkModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Comment } from '../lib/types';
import { PaymentModal } from './PaymentModal';
import { useRealtimeComments } from '../hooks/useRealtimeComments';
import { MarkdownContent } from './MarkdownContent';
import { MarkdownGuide } from './MarkdownGuide';
import { AuthorLink, AuthorAvatar } from './AuthorLink';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import { sanitizeText, hasDangerousContent } from '../lib/sanitize';
import { createUniqueSlug } from '../lib/slug-utils';
import AdminDeleteButton from './AdminDeleteButton';
import AdminBadge, { GimmeSenseiBadge } from './AdminBadge';
import { RelatedProjectsModal } from './RelatedProjectsModal';
import { FundingPoolBox } from './FundingPoolBox';

// AI Bot display name
const AI_BOT_NAME = 'Gimme Sensei';

// Reusable Comment/Reply Form Component
interface CommentFormProps {
    user: any;
    text: string;
    setText: (text: string) => void;
    isAnon: boolean;
    setIsAnon: (value: boolean) => void;
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => void;
    placeholder?: string;
    submitLabel?: string;
    showMarkdownGuide?: boolean;
}

const CommentFormBox: React.FC<CommentFormProps> = ({
    user,
    text,
    setText,
    isAnon,
    setIsAnon,
    isSubmitting,
    onSubmit,
    placeholder = "Share your thoughts...",
    submitLabel = "Post",
    showMarkdownGuide = true,
}) => {
    const [showAnonDropdown, setShowAnonDropdown] = useState(false);

    return (
        <form onSubmit={onSubmit} className="flex gap-3">
            {/* Avatar with dropdown */}
            <div className="flex-shrink-0 relative">
                <div className="relative">
                    {isAnon ? (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                            <EyeOff className="w-5 h-5 text-gray-400" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center overflow-hidden border-2 border-[#FFD700]/30">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-white" />
                            )}
                        </div>
                    )}
                    {/* Dropdown arrow button */}
                    <button
                        type="button"
                        onClick={() => setShowAnonDropdown(!showAnonDropdown)}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#1a1a2e] border border-white/20 flex items-center justify-center hover:bg-[#252540] hover:border-white/30 transition-all"
                    >
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                </div>

                {/* Dropdown menu */}
                <AnimatePresence>
                    {showAnonDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-14 left-0 z-50 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[160px]"
                        >
                            <button
                                type="button"
                                onClick={() => { setIsAnon(false); setShowAnonDropdown(false); }}
                                className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-white/5 transition-colors ${!isAnon ? 'bg-white/5 text-[#FFD700]' : 'text-gray-300'}`}
                            >
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-3 h-3 text-white" />
                                    )}
                                </div>
                                <span className="truncate">{user?.username || 'Your name'}</span>
                                {!isAnon && <Check className="w-3.5 h-3.5 ml-auto text-[#FFD700]" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsAnon(true); setShowAnonDropdown(false); }}
                                className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-white/5 transition-colors ${isAnon ? 'bg-white/5 text-[#FFD700]' : 'text-gray-300'}`}
                            >
                                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                    <EyeOff className="w-3 h-3 text-gray-400" />
                                </div>
                                <span>Anonymous</span>
                                {isAnon && <Check className="w-3.5 h-3.5 ml-auto text-[#FFD700]" />}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input area */}
            <div className="flex-grow">
                <div className="relative">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        className="w-full bg-[#12131a] border border-white/10 rounded-2xl px-4 py-3 outline-none text-white text-sm min-h-[80px] focus:border-[#FFD700]/40 transition-all resize-none placeholder:text-gray-600"
                        placeholder={placeholder}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-gray-500">
                        {showMarkdownGuide && <MarkdownGuide />}
                        {isAnon && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <EyeOff className="w-3 h-3" /> Posting anonymously
                            </span>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !text.trim()}
                        className="bg-[#FFD700] text-black px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-1.5 hover:bg-[#FFD700]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                {submitLabel}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

// Reply Form Component
interface ReplyFormProps {
    user: any;
    replyText: string;
    setReplyText: (text: string) => void;
    isAnonReply: boolean;
    setIsAnonReply: (value: boolean) => void;
    isSubmittingReply: boolean;
    handleReplySubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    replyingTo: string;
    isReplyingToAI?: boolean;
}

const ReplyForm: React.FC<ReplyFormProps> = ({
    user,
    replyText,
    setReplyText,
    isAnonReply,
    setIsAnonReply,
    isSubmittingReply,
    handleReplySubmit,
    onCancel,
    replyingTo,
    isReplyingToAI,
}) => {
    const [showAnonDropdown, setShowAnonDropdown] = useState(false);

    return (
        <form onSubmit={handleReplySubmit} className="mt-4 flex gap-3">
            {/* Avatar with dropdown */}
            <div className="flex-shrink-0 relative">
                <div className="relative">
                    {isAnonReply ? (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                            <EyeOff className="w-4 h-4 text-gray-400" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center overflow-hidden border-2 border-[#FFD700]/30">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-white" />
                            )}
                        </div>
                    )}
                    {/* Dropdown arrow button */}
                    <button
                        type="button"
                        onClick={() => setShowAnonDropdown(!showAnonDropdown)}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#1a1a2e] border border-white/20 flex items-center justify-center hover:bg-[#252540] hover:border-white/30 transition-all"
                    >
                        <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                    </button>
                </div>

                {/* Dropdown menu */}
                <AnimatePresence>
                    {showAnonDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-11 left-0 z-50 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[140px]"
                        >
                            <button
                                type="button"
                                onClick={() => { setIsAnonReply(false); setShowAnonDropdown(false); }}
                                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${!isAnonReply ? 'bg-white/5 text-[#FFD700]' : 'text-gray-300'}`}
                            >
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-2.5 h-2.5 text-white" />
                                    )}
                                </div>
                                <span className="truncate">{user?.username || 'You'}</span>
                                {!isAnonReply && <Check className="w-3 h-3 ml-auto text-[#FFD700]" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsAnonReply(true); setShowAnonDropdown(false); }}
                                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${isAnonReply ? 'bg-white/5 text-[#FFD700]' : 'text-gray-300'}`}
                            >
                                <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                    <EyeOff className="w-2.5 h-2.5 text-gray-400" />
                                </div>
                                <span>Anonymous</span>
                                {isAnonReply && <Check className="w-3 h-3 ml-auto text-[#FFD700]" />}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input area */}
            <div className="flex-grow">
                {/* Reply tag */}
                <div className="flex items-center gap-2 text-xs mb-2">
                    <span className="text-gray-500">Replying to</span>
                    <span className={`font-semibold ${isReplyingToAI ? 'text-purple-400' : 'text-[#FFD700]'}`}>
                        @{replyingTo}
                    </span>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="ml-auto p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        title="Cancel reply"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>

                <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-[#12131a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-[#FFD700]/40 outline-none resize-none transition-all placeholder:text-gray-600"
                    placeholder="Write a thoughtful reply..."
                    rows={2}
                    disabled={isSubmittingReply}
                />

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        {isAnonReply && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <EyeOff className="w-2.5 h-2.5" /> Anonymous
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-full transition-colors"
                            disabled={isSubmittingReply}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="text-xs bg-[#FFD700] text-black px-4 py-1.5 rounded-full font-semibold hover:bg-[#FFD700]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            disabled={isSubmittingReply || !replyText.trim()}
                        >
                            {isSubmittingReply ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3 h-3" />
                                    Reply
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

interface IdeaContext {
    title: string;
    problem: string;
    solution: string;
    opportunity?: string;
}

interface CommentItemProps {
    comment: Comment;
    projectId: string;
    isReply?: boolean;
    onTip: (commentId: string, author: string, wallet: string) => void;
    ideaOwnerUsername?: string;
    ideaContext?: IdeaContext;
    parentAIComment?: string; // Content of parent AI comment for context
    parentCommentAuthor?: string; // Username of parent comment author (for showing "replying to @...")
    isParentAI?: boolean; // Whether parent comment is from AI
    activeReplyId: string | null; // Currently active reply form
    setActiveReplyId: (id: string | null) => void; // Function to set active reply
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, projectId, isReply = false, onTip, ideaOwnerUsername, ideaContext, parentAIComment, parentCommentAuthor, isParentAI, activeReplyId, setActiveReplyId }) => {
    const { user, likeComment, dislikeComment, replyComment, fetchProjectById } = useAppStore();
    const [replyText, setReplyText] = useState('');
    const [isAnonReply, setIsAnonReply] = useState(false);
    const [showBurst, setShowBurst] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(comment.likes || 0);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // Check if this comment's reply form is active
    const isReplyFormOpen = activeReplyId === comment.id;

    const isOwnComment = user && !comment.isAnonymous && comment.author?.username === user.username;

    const handleEditSave = async () => {
        if (!editText.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }
        setIsSavingEdit(true);
        try {
            const response = await apiClient.updateComment(comment.id, editText);
            if (response.success) {
                toast.success('Comment updated!');
                setIsEditing(false);
                // Refresh project to get updated comments
                fetchProjectById(projectId);
            } else {
                toast.error(response.error || 'Failed to update comment');
            }
        } catch (error) {
            toast.error('Failed to update comment');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        setIsDeleting(true);
        try {
            const response = await apiClient.deleteComment(comment.id);
            if (response.success) {
                toast.success('Comment deleted');
                // Refresh project to get updated comments
                fetchProjectById(projectId);
            } else {
                toast.error(response.error || 'Failed to delete comment');
            }
        } catch (error) {
            toast.error('Failed to delete comment');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLike = async () => {
        if (!hasLiked) {
            // Optimistic update - immediate feedback
            setHasLiked(true);
            setLocalLikes(prev => prev + 1);
            setShowBurst(true);
            setTimeout(() => setShowBurst(false), 800);

            try {
                await likeComment(projectId, comment.id);
            } catch (error) {
                // Revert on error
                setHasLiked(false);
                setLocalLikes(prev => prev - 1);
            }
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
        if (!replyText.trim()) {
            toast.error("Reply cannot be empty");
            return;
        }

        setIsSubmittingReply(true);
        try {
            await replyComment(projectId, comment.id, replyText, isAnonReply);
            const userQuestion = replyText;
            setReplyText('');
            setActiveReplyId(null); // Close reply form
            toast.success('Reply posted!');

            // If replying to an AI comment, trigger AI auto-reply
            if (comment.is_ai_generated && ideaContext) {
                setIsAIThinking(true);
                try {
                    const response = await apiClient.createAIAutoReply({
                        projectId,
                        parentCommentId: comment.id,
                        userQuestion,
                        previousAIComment: comment.content,
                        ideaContext,
                    });

                    if (response.success && response.data) {
                        // Check if AI skipped the reply (not a question/challenge)
                        if (response.data.skipped) {
                            // Don't show anything - user's comment was posted, AI just didn't need to reply
                        } else {
                            // Refresh to get the new AI reply
                            await fetchProjectById(projectId);
                            toast.success('AI has replied!', { icon: '🤖' });
                        }
                    }
                } catch (aiError) {
                    console.error('AI auto-reply failed:', aiError);
                    // Don't show error - the user's comment was still posted
                } finally {
                    setIsAIThinking(false);
                }
            }
        } catch (error) {
            toast.error('Failed to post reply');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const handleToggleReply = () => {
        if (isReplyFormOpen) {
            setActiveReplyId(null);
            setReplyText('');
        } else {
            setActiveReplyId(comment.id);
        }
    };

    const authorName = comment.isAnonymous ? 'Anonymous' : (comment.author?.username || 'Anonymous');
    const tipsAmount = comment.tipsAmount || comment.tips || 0;
    const timestamp = comment.createdAt || comment.timestamp || '';

    return (
        <div className={`flex gap-3 sm:gap-4 mb-4 sm:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isReply ? 'ml-6 sm:ml-10 mt-3 pl-3 border-l-2 border-white/10' : ''}`}>
            <AuthorAvatar
                username={comment.author?.username || 'Anonymous'}
                avatar={comment.author?.avatar}
                isAnonymous={comment.isAnonymous}
                size={isReply ? "md" : "lg"}
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
                    {!comment.isAnonymous && comment.author?.username && ideaOwnerUsername &&
                        comment.author.username === ideaOwnerUsername && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30 font-medium">
                                Idea Owner
                            </span>
                        )}
                    {/* Gimme Sensei AI Badge */}
                    {comment.is_ai_generated && (
                        <GimmeSenseiBadge />
                    )}
                    <span className="text-xs text-gray-600">{new Date(timestamp).toLocaleDateString()}</span>
                    {tipsAmount > 0 && (
                        <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 flex items-center gap-1">
                            <DollarSign className="w-2 h-2" /> {tipsAmount}
                        </span>
                    )}
                </div>

                {/* Comment Content - Edit or View mode */}
                {isEditing ? (
                    <div className="mb-3">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none"
                            rows={3}
                            disabled={isSavingEdit}
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleEditSave}
                                disabled={isSavingEdit}
                                className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                            >
                                <Check className="w-3 h-3" /> {isSavingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditText(comment.content);
                                }}
                                disabled={isSavingEdit}
                                className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3" /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-300 text-sm leading-relaxed mb-3">
                        {/* Show reply tag if this is a reply */}
                        {isReply && parentCommentAuthor && (
                            <span className={`text-xs mr-1 ${isParentAI ? 'text-purple-400' : 'text-blue-400'}`}>
                                @{parentCommentAuthor}
                            </span>
                        )}
                        <MarkdownContent content={comment.content} />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <motion.button
                        onClick={handleLike}
                        whileTap={{ scale: 0.85 }}
                        className={`flex items-center gap-1.5 transition-all relative ${hasLiked ? 'text-[#FFD700]' : 'hover:text-white'}`}
                    >
                        <motion.div
                            animate={hasLiked ? { rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                        </motion.div>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={localLikes}
                                initial={{ y: -8, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 8, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="min-w-[12px]"
                            >
                                {localLikes}
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
                        onClick={handleToggleReply}
                        className={`flex items-center gap-1 hover:text-white ${isReplyFormOpen ? 'text-white' : ''}`}
                    >
                        <MessageCircle className="w-3 h-3" /> {isReplyFormOpen ? 'Cancel' : 'Reply'}
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

                    {/* Edit/Delete for own comments */}
                    {isOwnComment && !isEditing && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1 hover:text-purple-400 transition-colors"
                            >
                                <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-1 hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-3 h-3" /> {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </>
                    )}
                </div>

                {isReplyFormOpen && (
                    <ReplyForm
                        user={user}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        isAnonReply={isAnonReply}
                        setIsAnonReply={setIsAnonReply}
                        isSubmittingReply={isSubmittingReply}
                        handleReplySubmit={handleReplySubmit}
                        onCancel={() => { setActiveReplyId(null); setReplyText(''); }}
                        replyingTo={comment.is_ai_generated ? AI_BOT_NAME : (comment.isAnonymous ? 'Anonymous' : comment.author?.username || 'Anonymous')}
                        isReplyingToAI={comment.is_ai_generated}
                    />
                )}

                {/* AI Thinking Indicator */}
                {isAIThinking && (
                    <div className="mt-3 ml-12 flex items-center gap-2 text-sm text-purple-400 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                        <span>{AI_BOT_NAME} is thinking...</span>
                    </div>
                )}

                {comment.replies?.map((reply, index, allReplies) => {
                    // For first reply, tag the parent comment author
                    // For subsequent replies, tag the author of the previous reply in the thread
                    let replyToAuthor: string;
                    if (index === 0) {
                        // First reply in thread - tag the parent comment author
                        replyToAuthor = comment.is_ai_generated
                            ? AI_BOT_NAME
                            : (comment.isAnonymous ? 'Anonymous' : (comment.author?.username || 'Anonymous'));
                    } else {
                        // Find the previous reply to determine who this reply is to
                        const prevReply = allReplies[index - 1];
                        replyToAuthor = prevReply.is_ai_generated
                            ? AI_BOT_NAME
                            : (prevReply.isAnonymous ? 'Anonymous' : (prevReply.author?.username || 'Anonymous'));
                    }

                    return (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            projectId={projectId}
                            isReply={true}
                            onTip={onTip}
                            ideaOwnerUsername={ideaOwnerUsername}
                            ideaContext={ideaContext}
                            parentAIComment={comment.is_ai_generated ? comment.content : parentAIComment}
                            parentCommentAuthor={replyToAuthor}
                            isParentAI={comment.is_ai_generated}
                            activeReplyId={activeReplyId}
                            setActiveReplyId={setActiveReplyId}
                        />
                    );
                })}
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
    const { isAdmin } = useAuth();
    const router = useRouter();
    const [commentText, setCommentText] = useState('');
    const [isAnonComment, setIsAnonComment] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

    // Reply form state - only one reply form can be open at a time
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

    // Payment Modal State
    const [showPayment, setShowPayment] = useState(false);
    const [paymentRecipient, setPaymentRecipient] = useState('');
    const [recipientWallet, setRecipientWallet] = useState('');
    const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

    // Bookmark Modal State
    const [showBookmarkModal, setShowBookmarkModal] = useState(false);

    // Related Projects Modal State
    const [showRelatedProjectsModal, setShowRelatedProjectsModal] = useState(false);
    const [relatedProjectsCount, setRelatedProjectsCount] = useState(0);

    const project = selectedProject;

    // Fetch related projects count on mount and when modal closes
    useEffect(() => {
        if (project?.id) {
            fetchRelatedProjectsCount();
        }
    }, [project?.id, showRelatedProjectsModal]); // Refresh when modal closes

    const fetchRelatedProjectsCount = async () => {
        if (!project?.id) return;
        try {
            const response = await apiClient.getRelatedProjects(project.id);
            if (response.success && response.data) {
                const aiCount = response.data.aiDetected?.length || 0;
                const userCount = response.data.userPinned?.length || 0;
                setRelatedProjectsCount(aiCount + userCount);
            }
        } catch (error) {
            console.error('Failed to fetch related projects count:', error);
        }
    };

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
        if (!user) {
            openConnectReminder();
            return;
        }
        if (hasVoted) return; // Prevent double vote

        // Optimistic update
        setHasVoted(true);

        try {
            await voteProject(project.id);
            toast.success('Vote recorded!');
        } catch (error) {
            setHasVoted(false); // Revert on error
            toast.error('Failed to record vote');
        }
    };

    const handleShareToX = () => {
        // Create shareable URL with slug format
        const slug = createUniqueSlug(project.title, project.id);
        const ideaUrl = `${window.location.origin}/idea/${slug}`;

        // Create engaging tweet text
        const tweetText = `💡 Found an interesting idea on @GimmeIdea!\n\n"${project.title}"\n\nWhat do you think? 👇`;

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

        // Sanitize comment
        const sanitizedComment = sanitizeText(commentText, 2000);

        if (isSubmitting || !sanitizedComment) return; // Prevent double submit

        // Check for dangerous content
        if (hasDangerousContent(commentText)) {
            toast.error('Invalid content detected. Please remove any HTML or scripts.');
            return;
        }

        setIsSubmitting(true);
        try {
            await addComment(project.id, sanitizedComment, isAnonComment);
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
                            {/* Like Button - First */}
                            <motion.button
                                onClick={handleVote}
                                whileTap={{ scale: 0.9 }}
                                className="bg-[#FFD700] text-black px-4 sm:px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,215,0,0.3)] text-sm relative overflow-hidden"
                            >
                                <motion.div
                                    animate={{ rotate: hasVoted ? [0, -20, 20, 0] : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                                </motion.div>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={project.votes}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -10, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {project.votes}
                                    </motion.span>
                                </AnimatePresence>
                            </motion.button>

                            {/* Share Button - Second */}
                            <button
                                onClick={handleShareToX}
                                className="bg-[#1DA1F2] text-white px-4 sm:px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(29,161,242,0.3)] text-sm"
                            >
                                <Share2 className="w-4 h-4" /> Share
                            </button>

                            {/* Save Button - Third */}
                            <button
                                onClick={() => {
                                    if (!user) {
                                        openConnectReminder();
                                        return;
                                    }
                                    setShowBookmarkModal(true);
                                }}
                                className="bg-purple-600 text-white px-4 sm:px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(147,51,234,0.3)] text-sm"
                            >
                                <Bookmark className="w-4 h-4" /> Save
                            </button>

                            {/* Related Projects Button */}
                            <button
                                onClick={() => setShowRelatedProjectsModal(true)}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 sm:px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(147,51,234,0.3)] text-sm relative cursor-pointer"
                                title="Find similar projects on the internet"
                            >
                                <Archive className="w-4 h-4" /> Projects
                                {relatedProjectsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#FFD700] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                                        {relatedProjectsCount}
                                    </span>
                                )}
                            </button>

                            {/* Admin Delete Button */}
                            {isAdmin && (
                                <AdminDeleteButton
                                    projectId={project.id}
                                    projectTitle={project.title}
                                    onDeleted={() => router.push('/idea')}
                                    variant="button"
                                />
                            )}
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

                    {/* Funding Pool */}
                    <div className="mb-10">
                        <FundingPoolBox project={project} />
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

                    <div className="mb-10">
                        {!user ? (
                            <div className="text-center py-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                                <p className="text-gray-400 mb-3">Sign in to join the discussion</p>
                                <button onClick={() => openConnectReminder()} className="text-[#FFD700] font-semibold hover:underline">Sign in</button>
                            </div>
                        ) : (
                            <CommentFormBox
                                user={user}
                                text={commentText}
                                setText={setCommentText}
                                isAnon={isAnonComment}
                                setIsAnon={setIsAnonComment}
                                isSubmitting={isSubmitting}
                                onSubmit={handleComment}
                                placeholder="Share your thoughts, questions, or feedback..."
                                submitLabel="Post"
                                showMarkdownGuide={true}
                            />
                        )}
                    </div>

                    <div>
                        {project.comments?.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                projectId={project.id}
                                onTip={openCommentTip}
                                ideaOwnerUsername={project.author.username}
                                ideaContext={{
                                    title: project.title,
                                    problem: project.problem || '',
                                    solution: project.solution || '',
                                    opportunity: project.opportunity,
                                }}
                                activeReplyId={activeReplyId}
                                setActiveReplyId={setActiveReplyId}
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

            <BookmarkModal
                isOpen={showBookmarkModal}
                onClose={() => setShowBookmarkModal(false)}
                projectId={project.id}
                projectTitle={project.title}
            />

            <RelatedProjectsModal
                isOpen={showRelatedProjectsModal}
                onClose={() => setShowRelatedProjectsModal(false)}
                ideaId={project.id}
                ideaTitle={project.title}
                ideaProblem={project.problem || ''}
                ideaSolution={project.solution || ''}
                ideaCategory={project.category}
                ideaTags={project.tags}
            />
        </motion.div>
    );
};
