export type MediaAttachment = {
  kind: 'image' | 'video';
  src: string;
  name: string;
};

export const POST_MEDIA_LIMITS = {
  maxImages: 10,
  maxImageBytes: 5 * 1024 * 1024,
  maxVideos: 1,
  maxVideoBytes: 25 * 1024 * 1024,
} as const;

export type StoredMediaAttachment = {
  id: string;
  kind: 'image' | 'video';
  name: string;
  size: number;
  mimeType: string;
};

export type LocalKnowledgePost = {
  id: string;
  slug: string;
  kind: 'idea' | 'problem';
  title: string;
  summary: string;
  createdAt: string;
  creator: {
    username: string;
    displayName: string;
    avatarUrl: null;
  };
  primaryProblemSlug: string | null;
  bounty: {
    title: string;
    status: 'unfunded' | 'mock_funded';
    amountRaw: string;
    currency: 'USDC';
    openToHiring: boolean;
  } | null;
  attachments: StoredMediaAttachment[];
};

export type PostMediaValidationCode =
  'unsupported' | 'too_many_images' | 'too_many_videos' | 'image_too_large' | 'video_too_large';

export class PostMediaValidationError extends Error {
  constructor(
    public readonly code: PostMediaValidationCode,
    public readonly fileName?: string,
  ) {
    super(code);
  }
}

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
  knowledgePosts: LocalKnowledgePost[];
};

const STORAGE_KEY = 'gimme-idea-social-v2';
const CHANGE_EVENT = 'gimme-social-change';
const MAX_MEDIA_BYTES = 1_800_000;
const MEDIA_DB_NAME = 'gimme-idea-media-v2';
const MEDIA_STORE_NAME = 'post-media';

function emptyState(): SocialState {
  return {
    bookmarks: [],
    likes: [],
    quotes: [],
    comments: [],
    views: {},
    itemMedia: {},
    knowledgePosts: [],
  };
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
      knowledgePosts: Array.isArray(parsed.knowledgePosts) ? parsed.knowledgePosts : [],
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

export function getLocalKnowledgePosts(kind?: 'idea' | 'problem') {
  const posts = readState().knowledgePosts;
  return kind ? posts.filter((post) => post.kind === kind) : posts;
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

function openMediaDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(MEDIA_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        database.createObjectStore(MEDIA_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open media storage.'));
  });
}

function completeTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Media storage failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Media storage stopped.'));
  });
}

export function validatePostMedia(files: File[]) {
  let imageCount = 0;
  let videoCount = 0;
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      imageCount += 1;
      if (file.size > POST_MEDIA_LIMITS.maxImageBytes) {
        throw new PostMediaValidationError('image_too_large', file.name);
      }
      continue;
    }
    if (file.type.startsWith('video/')) {
      videoCount += 1;
      if (file.size > POST_MEDIA_LIMITS.maxVideoBytes) {
        throw new PostMediaValidationError('video_too_large', file.name);
      }
      continue;
    }
    throw new PostMediaValidationError('unsupported', file.name);
  }
  if (imageCount > POST_MEDIA_LIMITS.maxImages) {
    throw new PostMediaValidationError('too_many_images');
  }
  if (videoCount > POST_MEDIA_LIMITS.maxVideos) {
    throw new PostMediaValidationError('too_many_videos');
  }
}

async function storePostMedia(files: File[]) {
  if (files.length === 0) return [];
  const database = await openMediaDatabase();
  const transaction = database.transaction(MEDIA_STORE_NAME, 'readwrite');
  const store = transaction.objectStore(MEDIA_STORE_NAME);
  const attachments = files.map<StoredMediaAttachment>((file) => {
    const id = crypto.randomUUID();
    store.put(file, id);
    return {
      id,
      kind: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name,
      size: file.size,
      mimeType: file.type,
    };
  });
  await completeTransaction(transaction);
  database.close();
  return attachments;
}

export async function getStoredMediaBlob(id: string) {
  const database = await openMediaDatabase();
  const transaction = database.transaction(MEDIA_STORE_NAME, 'readonly');
  const request = transaction.objectStore(MEDIA_STORE_NAME).get(id);
  const result = await new Promise<Blob | null>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error ?? new Error('Could not read media.'));
  });
  database.close();
  return result;
}

function usdcToRaw(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const [whole = '0', fraction = ''] = normalized.split('.');
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(fraction) || fraction.length > 6) return null;
  return `${whole}${fraction.padEnd(6, '0')}`.replace(/^0+(?=\d)/, '');
}

export async function createLocalKnowledgePost(input: {
  kind: 'idea' | 'problem';
  title: string;
  summary: string;
  primaryProblemSlug?: string | null;
  bountyAmount?: string;
  openToHiring?: boolean;
  files: File[];
}) {
  validatePostMedia(input.files);
  const attachments = await storePostMedia(input.files);
  const id = crypto.randomUUID();
  const bountyRaw = input.kind === 'problem' ? usdcToRaw(input.bountyAmount ?? '') : null;
  const hasFundedBounty = bountyRaw ? BigInt(bountyRaw) > 0n : false;
  const post: LocalKnowledgePost = {
    id,
    slug: `local-${id}`,
    kind: input.kind,
    title: input.title.trim(),
    summary: input.summary.trim(),
    createdAt: new Date().toISOString(),
    creator: { username: 'guest', displayName: 'Guest', avatarUrl: null },
    primaryProblemSlug: input.kind === 'idea' ? (input.primaryProblemSlug ?? null) : null,
    bounty:
      input.kind === 'problem' && (bountyRaw || input.openToHiring)
        ? {
            title: input.title.trim(),
            status: hasFundedBounty ? 'mock_funded' : 'unfunded',
            amountRaw: bountyRaw ?? '0',
            currency: 'USDC',
            openToHiring: Boolean(input.openToHiring),
          }
        : null,
    attachments,
  };
  const state = readState();
  state.knowledgePosts = [post, ...state.knowledgePosts];
  writeState(state);
  return post;
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
