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
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { MediaBlock, QuotedEmbed } from '@/components/quoted-embed';
import { useAuth } from '@/lib/auth';
import {
  addComment,
  addQuote,
  commentCount,
  commentKey,
  commentsForPost,
  getQuote,
  getRemoteQuote,
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
  type SocialActor,
  type SocialComment,
} from '@/lib/social';
import { formatPostTime } from '@/lib/time';

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

function formatCount(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

function fallbackActor(locale: Locale): SocialActor {
  return { username: 'guest', displayName: copy[locale].guest, avatarUrl: null };
}

function initialsForActor(actor: SocialActor) {
  return (
    actor.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

function renderInlineMarkdown(text: string) {
  const parts: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|@[a-zA-Z0-9_-]+)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith('`')) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(
        <span key={key} className="mention-token">
          {token}
        </span>,
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function MarkdownText({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).filter((block) => block.length > 0);
  if (blocks.length === 0) return null;
  return (
    <div className="markdown-text">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n');
        if (lines.every((line) => line.trim().startsWith('>'))) {
          return (
            <blockquote key={`quote-${blockIndex}`}>
              {lines.map((line, index) => (
                <span key={`${index}-${line}`}>
                  {renderInlineMarkdown(line.replace(/^>\s?/, ''))}
                  {index < lines.length - 1 && <br />}
                </span>
              ))}
            </blockquote>
          );
        }
        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={`list-${blockIndex}`}>
              {lines.map((line, index) => (
                <li key={`${index}-${line}`}>
                  {renderInlineMarkdown(line.replace(/^\s*[-*]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`p-${blockIndex}`}>
            {lines.map((line, index) => (
              <span key={`${index}-${line}`}>
                {renderInlineMarkdown(line)}
                {index < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function MediaPicker({
  label,
  onPick,
  onError,
  disabled = false,
  onRequestAuth,
}: {
  label: string;
  onPick: (media: MediaAttachment) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  onRequestAuth?: () => void;
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
      <label
        htmlFor={id}
        className="knowledge-post-action is-media"
        aria-disabled={disabled}
        onClick={(event) => {
          if (!disabled) return;
          event.preventDefault();
          onRequestAuth?.();
        }}
      >
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
  const auth = useAuth();
  const key = quoteKey(post.id);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState(0);
  const [quotes, setQuotes] = useState(0);
  const [quotedPost, setQuotedPost] = useState<QuotePost | null>(null);
  const [shareLabel, setShareLabel] = useState<string>(t.share);
  const [composer, setComposer] = useState<'quote' | null>(null);
  const actor = post.actor ?? fallbackActor(locale);

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
    if (!auth.requireAuth('share')) return;
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
        <span>{initialsForActor(actor)}</span>
      </div>
      <div className="knowledge-post-main">
        <header className="knowledge-post-header">
          <Link className="knowledge-post-identity" href={threadHref} onClick={recordView}>
            <strong>{actor.displayName}</strong>
            <span>@{actor.username}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt}>{formatPostTime(locale, post.createdAt)}</time>
          </Link>
          <div className="knowledge-post-tools">
            <button
              type="button"
              className={
                saved ? 'knowledge-post-action is-save is-on' : 'knowledge-post-action is-save'
              }
              aria-pressed={saved}
              aria-label={saved ? t.unsave : t.save}
              onClick={() => {
                if (!auth.requireAuth('save')) return;
                setSaved(toggleBookmark(key));
              }}
            >
              <Bookmark size={18} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className={
                shareLabel === t.copied
                  ? 'knowledge-post-action is-share is-copied'
                  : 'knowledge-post-action is-share'
              }
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
              {post.quotedComment.actor?.displayName ?? t.guest}
              <span>
                {' '}
                @{post.quotedComment.actor?.username ?? 'guest'} ·{' '}
                {formatPostTime(locale, post.quotedComment.createdAt)}
              </span>
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
                if (!auth.requireAuth('comment')) return;
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
              onClick={() => {
                if (!auth.requireAuth('quote')) return;
                setComposer('quote');
              }}
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
              onClick={() => {
                if (!auth.requireAuth('like')) return;
                setLiked(toggleLike(key));
              }}
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
  const actor = post.actor ?? fallbackActor(locale);
  return (
    <div className="quoted-embed quoted-post-embed" onClick={(event) => event.stopPropagation()}>
      <Link className="quoted-embed-copy" href={`/${locale}/home/${post.id}`}>
        <strong>
          {actor.displayName}
          <span>
            {' '}
            @{actor.username} · {formatPostTime(locale, post.createdAt)}
          </span>
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
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let remotePost: QuotePost | null = null;
    let remoteComments: SocialComment[] = [];
    let cancelled = false;
    const sync = () => {
      const localPost = getQuote(postId);
      const localComments = commentsForPost(postId);
      setPost(localPost ?? remotePost);
      setComments([
        ...remoteComments,
        ...localComments.filter(
          (local) => !remoteComments.some((remote) => remote.id === local.id),
        ),
      ]);
    };
    sync();
    void getRemoteQuote(postId)
      .then((remote) => {
        if (cancelled || !remote) return;
        remotePost = remote.post;
        remoteComments = remote.comments;
        sync();
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setResolved(true);
      });
    incrementViews(quoteKey(postId));
    const unsubscribe = subscribeSocial(sync);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [postId]);

  const threadedComments = useMemo(() => flattenCommentThread(comments), [comments]);

  if (!post && !resolved) return <section className="app-empty-state" aria-busy="true" />;

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
  const auth = useAuth();
  const key = commentKey(comment.id);
  const [liked, setLiked] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const actor = comment.actor ?? fallbackActor(locale);

  useEffect(() => {
    const sync = () => setLiked(isLiked(key));
    sync();
    return subscribeSocial(sync);
  }, [key]);

  return (
    <li className={depth === 0 ? 'comment-node' : 'comment-node is-reply'}>
      <div className="knowledge-post-avatar" aria-hidden="true">
        <span>{initialsForActor(actor)}</span>
      </div>
      <div className="comment-main">
        <div className="knowledge-post-identity">
          <strong>{actor.displayName}</strong>
          <span>@{actor.username}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={comment.createdAt}>{formatPostTime(locale, comment.createdAt)}</time>
        </div>
        <MarkdownText body={comment.body} />
        {comment.media && <MediaBlock media={comment.media} />}
        <div className="knowledge-post-action-group">
          <button
            type="button"
            className="knowledge-post-action"
            onClick={() => {
              if (!auth.requireAuth('comment')) return;
              setReplyOpen((value) => !value);
            }}
          >
            <MessageCircle size={16} strokeWidth={1.75} />
            <span className="sr-only">{t.reply}</span>
          </button>
          <button
            type="button"
            className="knowledge-post-action"
            onClick={() => {
              if (!auth.requireAuth('quote')) return;
              setQuoteOpen(true);
            }}
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
            onClick={() => {
              if (!auth.requireAuth('like')) return;
              setLiked(toggleLike(key));
            }}
          >
            <Lightbulb size={16} strokeWidth={1.75} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
        {replyOpen && (
          <CommentComposer
            locale={locale}
            postId={post.id}
            parentId={comment.id}
            mentionUsername={actor.username}
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
          quotedComment={{
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt,
            actor,
          }}
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
  mentionUsername = null,
  onDone,
}: {
  locale: Locale;
  postId: string;
  parentId?: string | null;
  mentionUsername?: string | null;
  onDone?: () => void;
}) {
  const t = copy[locale];
  const auth = useAuth();
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialBody = mentionUsername ? `@${mentionUsername} ` : '';
  const [body, setBody] = useState(initialBody);
  const [media, setMedia] = useState<MediaAttachment | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!parentId) return;
    formRef.current?.scrollIntoView({ block: 'nearest' });
    textareaRef.current?.focus();
  }, [parentId]);

  return (
    <form
      ref={formRef}
      className="comment-composer"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!auth.requireAuth('comment')) return;
        if (!body.trim() && !media) return;
        try {
          await addComment({ postId, body, actor: auth.actor, parentId, mentionUsername, media });
          setBody(initialBody);
          setMedia(null);
          setError('');
          onDone?.();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Could not publish the reply.');
        }
      }}
    >
      <label className="sr-only" htmlFor={fieldId}>
        {t.commentPrompt}
      </label>
      <textarea
        ref={textareaRef}
        id={fieldId}
        value={body}
        rows={3}
        placeholder={t.commentPrompt}
        onFocus={(event) => {
          if (auth.isSignedIn) return;
          event.currentTarget.blur();
          auth.requireAuth('comment');
        }}
        onChange={(event) => setBody(event.target.value)}
      />
      {media && (
        <div className="comment-composer-media">
          <MediaBlock media={media} />
          <button type="button" className="button button-quiet" onClick={() => setMedia(null)}>
            {t.close}
          </button>
        </div>
      )}
      {error && (
        <p className="media-error" role="alert">
          {error}
        </p>
      )}
      <div className="comment-composer-actions">
        <MediaPicker
          label={t.addMedia}
          disabled={!auth.isSignedIn}
          onRequestAuth={() => auth.requireAuth('comment')}
          onPick={(value) => {
            setError('');
            setMedia(value);
          }}
          onError={() => setError(t.mediaError)}
        />
        <button type="submit" className="button button-primary" disabled={!body.trim() && !media}>
          {t.reply}
        </button>
      </div>
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
  const auth = useAuth();
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

  const publish = async () => {
    if (!auth.requireAuth('quote')) return;
    try {
      const post = await addQuote({
        body,
        target,
        actor: auth.actor,
        quotedPostId,
        quotedComment,
        media,
      });
      onClose();
      router.push(`/${locale}/home/${post.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not publish the quote.');
    }
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
              {quotedComment.actor?.displayName ?? t.guest}
              <span> @{quotedComment.actor?.username ?? 'guest'}</span>
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
