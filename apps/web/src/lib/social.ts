export type MediaAttachment = {
  kind: 'image' | 'video';
  src: string;
  name: string;
};

export type QuotedTarget = {
  kind: 'idea' | 'problem';
  slug: string;
  href: string;
  title: string;
  summary: string;
  creatorName: string;
  creatorUsername: string | null;
  createdAt: string;
  media?: MediaAttachment | null;
};

export type QuotedComment = {
  id: string;
  body: string;
  createdAt: string;
};

export type QuotePost = {
  id: string;
  body: string;
  createdAt: string;
  target: QuotedTarget | null;
  quotedPostId?: string;
  quotedComment?: QuotedComment;
  media?: MediaAttachment | null;
};

export type SocialComment = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
};

type SocialState = {
  bookmarks: string[];
  likes: string[];
  quotes: QuotePost[];
  comments: SocialComment[];
  views: Record<string, number>;
  itemMedia: Record<string, MediaAttachment>;
};

const STORAGE_KEY = 'gimme-idea-social-v2';
const CHANGE_EVENT = 'gimme-social-change';
const MAX_MEDIA_BYTES = 1_800_000;

function emptyState(): SocialState {
  return { bookmarks: [], likes: [], quotes: [], comments: [], views: {}, itemMedia: {} };
}

function readState(): SocialState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<SocialState>;
    return {
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      likes: Array.isArray(parsed.likes) ? parsed.likes : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      views: parsed.views && typeof parsed.views === 'object' ? parsed.views : {},
      itemMedia: parsed.itemMedia && typeof parsed.itemMedia === 'object' ? parsed.itemMedia : {},
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: SocialState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function itemKey(kind: 'idea' | 'problem', slug: string) {
  return `${kind}:${slug}`;
}

export function quoteKey(id: string) {
  return `quote:${id}`;
}

export function commentKey(id: string) {
  return `comment:${id}`;
}

export function getSocialState() {
  return readState();
}

export function getQuote(id: string) {
  return readState().quotes.find((post) => post.id === id) ?? null;
}

export function subscribeSocial(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function isBookmarked(key: string) {
  return readState().bookmarks.includes(key);
}

export function toggleBookmark(key: string) {
  const state = readState();
  state.bookmarks = state.bookmarks.includes(key)
    ? state.bookmarks.filter((item) => item !== key)
    : [key, ...state.bookmarks];
  writeState(state);
  return state.bookmarks.includes(key);
}

export function isLiked(key: string) {
  return readState().likes.includes(key);
}

export function toggleLike(key: string) {
  const state = readState();
  state.likes = state.likes.includes(key)
    ? state.likes.filter((item) => item !== key)
    : [key, ...state.likes];
  writeState(state);
  return state.likes.includes(key);
}

export function getViewCount(key: string, fallback = 0) {
  return readState().views[key] ?? fallback;
}

export function incrementViews(key: string, fallback = 0) {
  const state = readState();
  state.views[key] = (state.views[key] ?? fallback) + 1;
  writeState(state);
  return state.views[key];
}

export function addQuote(input: {
  body: string;
  target: QuotedTarget | null;
  quotedPostId?: string;
  quotedComment?: QuotedComment;
  media?: MediaAttachment | null;
}) {
  const state = readState();
  const post: QuotePost = {
    id: crypto.randomUUID(),
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
    target: input.target,
    quotedPostId: input.quotedPostId,
    quotedComment: input.quotedComment,
    media: input.media ?? null,
  };
  state.quotes = [post, ...state.quotes];
  writeState(state);
  return post;
}

export function addComment(postId: string, body: string, parentId: string | null = null) {
  const state = readState();
  const comment: SocialComment = {
    id: crypto.randomUUID(),
    postId,
    parentId,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
  state.comments = [...state.comments, comment];
  writeState(state);
  return comment;
}

export function commentsForPost(postId: string) {
  return readState().comments.filter((comment) => comment.postId === postId);
}

export function commentCount(postId: string) {
  return commentsForPost(postId).length;
}

export function quoteCount(postId: string) {
  return readState().quotes.filter((post) => post.quotedPostId === postId).length;
}

export function getItemMedia(key: string) {
  return readState().itemMedia[key] ?? null;
}

export function setItemMedia(key: string, media: MediaAttachment | null) {
  const state = readState();
  if (media) state.itemMedia[key] = media;
  else delete state.itemMedia[key];
  writeState(state);
}

export async function readMediaFile(file: File): Promise<MediaAttachment> {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    throw new Error('Only image and video files are supported.');
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error('Media must be under 1.8MB for this local foundation store.');
  }
  const kind = file.type.startsWith('video/') ? 'video' : 'image';
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
  return { kind, src, name: file.name };
}
