'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  Eye,
  ImagePlus,
  Lightbulb,
  MessageCircle,
  Repeat2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { MediaBlock, QuotedEmbed } from '@/components/quoted-embed';
import {
  addComment,
  addQuote,
  commentCount,
  commentKey,
  commentsForPost,
  getQuote,
  getSocialState,
  getViewCount,
  incrementViews,
  isBookmarked,
  isLiked,
  quoteCount,
  quoteKey,
  readMediaFile,
  subscribeSocial,
  toggleBookmark,
  toggleLike,
  type MediaAttachment,
  type QuotePost,
  type QuotedComment,
  type QuotedTarget,
  type SocialComment,
} from '@/lib/social';

const copy = {
  en: {
    guest: 'Guest',
    comment: 'Comment',
    reply: 'Reply',
    quote: 'Quote',
    like: 'Like',
    unlike: 'Unlike',
    views: 'Views',
    save: 'Save',
    unsave: 'Remove bookmark',
    share: 'Share',
    copied: 'Copied',
    post: 'Post',
    close: 'Close',
    commentPrompt: 'Post your reply',
    quotePrompt: "What's your take?",
    quoteTitle: 'Quote this',
    quoteHint: 'This quote lands on Home and stays on this device.',
    quoteComment: 'Quote comment',
    addMedia: 'Add photo or video',
    mediaError: 'Use an image or video under 1.8MB.',
    notFound: 'This post is not on this device.',
    back: 'Back to Home',
    replies: 'Replies',
  },
  vi: {
    guest: 'Khách',
    comment: 'Bình luận',
    reply: 'Trả lời',
    quote: 'Quote',
    like: 'Thích',
    unlike: 'Bỏ thích',
    views: 'Lượt xem',
    save: 'Lưu',
    unsave: 'Bỏ lưu',
    share: 'Chia sẻ',
    copied: 'Đã sao chép',
    post: 'Đăng',
    close: 'Đóng',
    commentPrompt: 'Viết trả lời của bạn',
    quotePrompt: 'Bạn nghĩ gì?',
    quoteTitle: 'Quote bài này',
    quoteHint: 'Quote sẽ xuất hiện trên Home và được lưu trên thiết bị này.',
    quoteComment: 'Quote bình luận',
    addMedia: 'Thêm ảnh hoặc video',
    mediaError: 'Dùng ảnh hoặc video dưới 1.8MB.',
    notFound: 'Bài viết này không có trên thiết bị này.',
    back: 'Về Home',
    replies: 'Trả lời',
  },
} as const;

function formatPostDate(locale: Locale, iso: string) {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function formatCount(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

export function MediaPicker({
  label,
  onPick,
  onError,
}: {
  label: string;
  onPick: (media: MediaAttachment) => void;
  onError: (message: string) => void;
}) {
  const id = useId();
  return (
    <>
      <input
        id={id}
        className="sr-only"
        type="file"
        accept="image/*,video/*"
        onInput={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (!file) return;
          void readMediaFile(file)
            .then(onPick)
            .catch(() => onError(label));
        }}
      />
      <label htmlFor={id} className="knowledge-post-action is-media">
        <ImagePlus size={18} strokeWidth={1.75} />
        <span className="sr-only">{label}</span>
      </label>
    </>
  );
}

export function QuotePostCard({
  locale,
  post,
  variant = 'feed',
}: {
  locale: Locale;
  post: QuotePost;
  variant?: 'feed' | 'thread';
}) {
  const t = copy[locale];
  const router = useRouter();
  const key = quoteKey(post.id);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState(0);
  const [quotes, setQuotes] = useState(0);
  const [quotedPost, setQuotedPost] = useState<QuotePost | null>(null);
  const [shareLabel, setShareLabel] = useState<string>(t.share);
  const [composer, setComposer] = useState<'quote' | null>(null);

  useEffect(() => {
    const sync = () => {
      setSaved(isBookmarked(key));
      setLiked(isLiked(key));
      setViews(getViewCount(key));
      setComments(commentCount(post.id));
      setQuotes(quoteCount(post.id));
      setQuotedPost(post.quotedPostId ? getQuote(post.quotedPostId) : null);
    };
    sync();
    return subscribeSocial(sync);
  }, [key, post.id, post.quotedPostId]);

  const threadHref = `/${locale}/home/${post.id}`;

  const recordView = () => {
    incrementViews(key);
  };

  const openThread = () => {
    recordView();
    router.push(threadHref);
  };

  const share = async () => {
    const url = new URL(threadHref, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ url, text: post.body });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      await navigator.clipboard.writeText(url);
    }
    setShareLabel(t.copied);
    window.setTimeout(() => setShareLabel(t.share), 1500);
  };

  const onCardClick = (event: MouseEvent<HTMLElement>) => {
    if (variant === 'thread') return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button, textarea, input, label, video')) return;
    openThread();
  };

  return (
    <article
      className={`knowledge-post-link knowledge-post knowledge-post-quote quote-post${variant === 'thread' ? ' is-thread' : ''}`}
      onClick={onCardClick}
    >
      <div className="knowledge-post-avatar" aria-hidden="true">
        <span>G</span>
      </div>
      <div className="knowledge-post-main">
        <header className="knowledge-post-header">
          <Link className="knowledge-post-identity" href={threadHref} onClick={recordView}>
            <strong>{t.guest}</strong>
            <span>@guest</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt}>{formatPostDate(locale, post.createdAt)}</time>
          </Link>
          <div className="knowledge-post-tools">
            <button
              type="button"
              className={
                saved ? 'knowledge-post-action is-save is-on' : 'knowledge-post-action is-save'
              }
              aria-pressed={saved}
              aria-label={saved ? t.unsave : t.save}
              onClick={() => setSaved(toggleBookmark(key))}
            >
              <Bookmark size={18} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="knowledge-post-action is-share"
              aria-label={shareLabel}
              onClick={() => void share()}
            >
              <Upload size={18} strokeWidth={1.75} />
            </button>
          </div>
        </header>
        {post.body && (
          <Link className="quote-body quote-post-open" href={threadHref} onClick={recordView}>
            {post.body}
          </Link>
        )}
        {post.media && <MediaBlock media={post.media} />}
        {post.quotedComment && (
          <Link
            className="quoted-embed quoted-comment"
            href={
              post.quotedPostId
                ? `/${locale}/home/${post.quotedPostId}`
                : `/${locale}/home/${post.id}`
            }
            onClick={(event) => event.stopPropagation()}
          >
            <strong>
              {t.guest}
              <span> @guest · {formatPostDate(locale, post.quotedComment.createdAt)}</span>
            </strong>
            <small>{post.quotedComment.body}</small>
          </Link>
        )}
        {quotedPost && !post.quotedComment && <QuotedPostEmbed locale={locale} post={quotedPost} />}
        {post.target && (!quotedPost || post.quotedComment) && (
          <QuotedEmbed locale={locale} target={post.target} />
        )}
        <footer className="knowledge-post-actions">
          <div className="knowledge-post-action-group">
            <button
              type="button"
              className="knowledge-post-action is-comment"
              aria-label={t.comment}
              title={t.comment}
              onClick={() => {
                if (variant === 'feed') {
                  incrementViews(key);
                  router.push(`${threadHref}#reply`);
                  return;
                }
                document.getElementById('reply')?.querySelector('textarea')?.focus();
              }}
            >
              <MessageCircle size={18} strokeWidth={1.75} />
              {comments > 0 && <small>{formatCount(comments)}</small>}
            </button>
            <button
              type="button"
              className="knowledge-post-action is-quote"
              aria-label={t.quote}
              title={t.quote}
              onClick={() => setComposer('quote')}
            >
              <Repeat2 size={18} strokeWidth={1.75} />
              {quotes > 0 && <small>{formatCount(quotes)}</small>}
            </button>
            <button
              type="button"
              className="knowledge-post-action is-views"
              aria-label={t.views}
              onClick={openThread}
            >
              <Eye size={18} strokeWidth={1.75} />
              {views > 0 && <small>{formatCount(views)}</small>}
            </button>
            <button
              type="button"
              className={
                liked ? 'knowledge-post-action is-like is-on' : 'knowledge-post-action is-like'
              }
              aria-pressed={liked}
              aria-label={liked ? t.unlike : t.like}
              onClick={() => setLiked(toggleLike(key))}
            >
              <Lightbulb size={18} strokeWidth={1.75} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </footer>
      </div>
      {composer === 'quote' && (
        <SocialComposer
          locale={locale}
          title={t.quoteTitle}
          target={post.target}
          quotedComment={undefined}
          quotedPostId={post.id}
          onClose={() => setComposer(null)}
        />
      )}
    </article>
  );
}

function QuotedPostEmbed({ locale, post }: { locale: Locale; post: QuotePost }) {
  const t = copy[locale];
  return (
    <div className="quoted-embed quoted-post-embed" onClick={(event) => event.stopPropagation()}>
      <Link className="quoted-embed-copy" href={`/${locale}/home/${post.id}`}>
        <strong>
          {t.guest}
          <span> @guest · {formatPostDate(locale, post.createdAt)}</span>
        </strong>
        {post.body && <small>{post.body}</small>}
      </Link>
      {post.media && <MediaBlock media={post.media} />}
      {post.target && <QuotedEmbed locale={locale} target={post.target} />}
    </div>
  );
}

function flattenCommentThread(comments: SocialComment[]) {
  const commentIds = new Set(comments.map((comment) => comment.id));
  const childrenByParent = new Map<string, SocialComment[]>();
  const roots: SocialComment[] = [];

  for (const comment of comments) {
    if (!comment.parentId || !commentIds.has(comment.parentId)) {
      roots.push(comment);
      continue;
    }
    const children = childrenByParent.get(comment.parentId) ?? [];
    children.push(comment);
    childrenByParent.set(comment.parentId, children);
  }

  const flattened: Array<{ comment: SocialComment; depth: 0 | 1 }> = [];
  const seen = new Set<string>();
  const visit = (comment: SocialComment, depth: 0 | 1) => {
    if (seen.has(comment.id)) return;
    seen.add(comment.id);
    flattened.push({ comment, depth });
    for (const reply of childrenByParent.get(comment.id) ?? []) visit(reply, 1);
  };

  for (const root of roots) visit(root, 0);
  for (const comment of comments) {
    if (!seen.has(comment.id)) visit(comment, 0);
  }
  return flattened;
}

export function QuoteThread({ locale, postId }: { locale: Locale; postId: string }) {
  const t = copy[locale];
  const [post, setPost] = useState<QuotePost | null>(null);
  const [comments, setComments] = useState<SocialComment[]>([]);

  useEffect(() => {
    const sync = () => {
      setPost(getQuote(postId));
      setComments(commentsForPost(postId));
    };
    sync();
    incrementViews(quoteKey(postId));
    return subscribeSocial(sync);
  }, [postId]);

  const threadedComments = useMemo(() => flattenCommentThread(comments), [comments]);

  if (!post) {
    return (
      <section className="app-empty-state">
        <h2>{t.notFound}</h2>
        <Link className="button button-quiet" href={`/${locale}/home`}>
          {t.back}
        </Link>
      </section>
    );
  }

  return (
    <section className="quote-thread">
      <Link className="thread-back" href={`/${locale}/home`}>
        {t.back}
      </Link>
      <QuotePostCard locale={locale} post={post} variant="thread" />
      <h2 className="thread-heading">{t.replies}</h2>
      <div id="reply">
        <CommentComposer locale={locale} postId={post.id} />
      </div>
      <ol className="comment-list">
        {threadedComments.map(({ comment, depth }) => (
          <CommentNode
            key={comment.id}
            locale={locale}
            post={post}
            comment={comment}
            depth={depth}
          />
        ))}
      </ol>
    </section>
  );
}

function CommentNode({
  locale,
  post,
  comment,
  depth,
}: {
  locale: Locale;
  post: QuotePost;
  comment: SocialComment;
  depth: 0 | 1;
}) {
  const t = copy[locale];
  const key = commentKey(comment.id);
  const [liked, setLiked] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    const sync = () => setLiked(isLiked(key));
    sync();
    return subscribeSocial(sync);
  }, [key]);

  return (
    <li className={depth === 0 ? 'comment-node' : 'comment-node is-reply'}>
      <div className="knowledge-post-avatar" aria-hidden="true">
        <span>G</span>
      </div>
      <div className="comment-main">
        <div className="knowledge-post-identity">
          <strong>{t.guest}</strong>
          <span>@guest</span>
          <span aria-hidden="true">·</span>
          <time dateTime={comment.createdAt}>{formatPostDate(locale, comment.createdAt)}</time>
        </div>
        <p>{comment.body}</p>
        <div className="knowledge-post-action-group">
          <button
            type="button"
            className="knowledge-post-action"
            onClick={() => setReplyOpen((value) => !value)}
          >
            <MessageCircle size={16} strokeWidth={1.75} />
            <span className="sr-only">{t.reply}</span>
          </button>
          <button
            type="button"
            className="knowledge-post-action"
            onClick={() => setQuoteOpen(true)}
          >
            <Repeat2 size={16} strokeWidth={1.75} />
            <span className="sr-only">{t.quoteComment}</span>
          </button>
          <button
            type="button"
            className={
              liked ? 'knowledge-post-action is-like is-on' : 'knowledge-post-action is-like'
            }
            aria-pressed={liked}
            onClick={() => setLiked(toggleLike(key))}
          >
            <Lightbulb size={16} strokeWidth={1.75} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
        {replyOpen && (
          <CommentComposer
            locale={locale}
            postId={post.id}
            parentId={comment.id}
            onDone={() => setReplyOpen(false)}
          />
        )}
      </div>
      {quoteOpen && (
        <SocialComposer
          locale={locale}
          title={t.quoteComment}
          target={post.target}
          quotedPostId={post.id}
          quotedComment={{ id: comment.id, body: comment.body, createdAt: comment.createdAt }}
          onClose={() => setQuoteOpen(false)}
        />
      )}
    </li>
  );
}

function CommentComposer({
  locale,
  postId,
  parentId = null,
  onDone,
}: {
  locale: Locale;
  postId: string;
  parentId?: string | null;
  onDone?: () => void;
}) {
  const t = copy[locale];
  const fieldId = useId();
  const [body, setBody] = useState('');

  return (
    <form
      className="comment-composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim()) return;
        addComment(postId, body, parentId);
        setBody('');
        onDone?.();
      }}
    >
      <label className="sr-only" htmlFor={fieldId}>
        {t.commentPrompt}
      </label>
      <textarea
        id={fieldId}
        value={body}
        rows={3}
        placeholder={t.commentPrompt}
        onChange={(event) => setBody(event.target.value)}
      />
      <button type="submit" className="button button-primary" disabled={!body.trim()}>
        {t.reply}
      </button>
    </form>
  );
}

export function SocialComposer({
  locale,
  title,
  target,
  quotedPostId,
  quotedComment,
  onClose,
}: {
  locale: Locale;
  title: string;
  target: QuotedTarget | null;
  quotedPostId?: string;
  quotedComment?: QuotedComment;
  onClose: () => void;
}) {
  const t = copy[locale];
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldId = useId();
  const [body, setBody] = useState('');
  const [media, setMedia] = useState<MediaAttachment | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const previous = document.activeElement;
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  const publish = () => {
    const post = addQuote({
      body,
      target,
      quotedPostId,
      quotedComment,
      media,
    });
    onClose();
    router.push(`/${locale}/home/${post.id}`);
  };

  return (
    <dialog
      ref={dialogRef}
      className="composer-dialog quote-dialog"
      aria-labelledby="quote-composer-title"
      onClick={(event) => event.stopPropagation()}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="composer-header">
        <div>
          <p>{t.quote}</p>
          <h2 id="quote-composer-title">{title}</h2>
        </div>
        <button type="button" aria-label={t.close} onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <form
        className="quote-form"
        onSubmit={(event) => {
          event.preventDefault();
          publish();
        }}
      >
        <label className="sr-only" htmlFor={fieldId}>
          {t.quotePrompt}
        </label>
        <textarea
          id={fieldId}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t.quotePrompt}
          rows={4}
        />
        {media && (
          <div className="quote-form-media">
            <MediaBlock media={media} />
          </div>
        )}
        {quotedComment && (
          <div className="quoted-embed quoted-comment quote-form-embed">
            <strong>
              {t.guest}
              <span> @guest</span>
            </strong>
            <small>{quotedComment.body}</small>
          </div>
        )}
        {target && (
          <div className="quote-form-embed">
            <QuotedEmbed locale={locale} target={target} />
          </div>
        )}
        {error && <p className="quote-hint">{error}</p>}
        <p className="quote-hint">{t.quoteHint}</p>
        <div className="composer-footer">
          <MediaPicker
            label={t.addMedia}
            onPick={(value) => {
              setError('');
              setMedia(value);
            }}
            onError={() => setError(t.mediaError)}
          />
          <button type="button" className="button button-quiet" onClick={onClose}>
            {t.close}
          </button>
          <button type="submit" className="button button-primary">
            {t.post}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<QuotePost[]>([]);
  useEffect(() => {
    const sync = () => setQuotes(getSocialState().quotes);
    sync();
    return subscribeSocial(sync);
  }, []);
  return quotes;
}
