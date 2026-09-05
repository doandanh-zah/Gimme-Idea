import { validatePostMedia } from './social-media';
export { POST_MEDIA_LIMITS, PostMediaValidationError, validatePostMedia } from './social-media';

export type MediaAttachment = {
  kind: 'image' | 'video';
  src: string;
  name: string;
};

export type StoredMediaAttachment = {
  id: string;
  kind: 'image' | 'video';
  name: string;
  size: number;
  mimeType: string;
};

export type SocialActor = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type LocalKnowledgePost = {
  id: string;
  slug: string;
  kind: 'idea' | 'problem';
  title: string;
  summary: string;
  details?: {
    problem?: string;
    whoHasThisProblem?: string;
    whyItMatters?: string;
    opportunity?: string;
    solution?: string;
    primaryProblemTitle?: string;
    extra?: Record<string, string>;
  };
  createdAt: string;
  creator: SocialActor;
  primaryProblemSlug: string | null;
  bounty: {
    title: string;
    status: 'draft';
    amountRaw: string;
    currency: 'USDC';
    openToHiring: boolean;
  } | null;
  attachments: StoredMediaAttachment[];
};

export type QuotedTarget = {
  kind: 'idea' | 'problem' | 'project' | 'bounty';
  slug: string;
  href: string;
  title: string;
  summary: string;
  creatorName: string;
  creatorUsername: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  attachments?: StoredMediaAttachment[];
  media?: MediaAttachment | null;
};

export type QuotedComment = {
  id: string;
  body: string;
  createdAt: string;
  actor?: SocialActor;
};

export type QuotePost = {
  id: string;
  body: string;
  createdAt: string;
  actor?: SocialActor;
  target: QuotedTarget | null;
  quotedPostId?: string;
  quotedComment?: QuotedComment;
  media?: MediaAttachment | null;
};
import { browserRequest } from './api';
import { getCurrentAccessToken } from './auth';
import { attachUploads, uploadFiles } from './uploads';

export type SocialComment = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  actor?: SocialActor;
  mentionUsername?: string | null;
  media?: MediaAttachment | null;
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
const guestActor: SocialActor = { username: 'guest', displayName: 'Guest', avatarUrl: null };

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

export function itemKey(kind: 'idea' | 'problem' | 'project' | 'bounty', slug: string) {
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

export async function getRemoteQuote(id: string) {
  const value = await browserRequest<{
    id: string;
    body: string;
    createdAt: string;
    actor?: SocialActor;
    target: QuotedTarget | null;
    quotedPostId?: string | null;
    replies?: SocialComment[];
  }>(`/v1/posts/${encodeURIComponent(id)}`);
  if (!value) return null;
  return {
    post: {
      id: value.id,
      body: value.body,
      createdAt: value.createdAt,
      actor: value.actor,
      target: value.target,
      quotedPostId: value.quotedPostId ?? undefined,
    } satisfies QuotePost,
    comments: value.replies ?? [],
  };
}

export function getLocalKnowledgePosts(kind?: 'idea' | 'problem') {
  const posts = readState().knowledgePosts;
  return kind ? posts.filter((post) => post.kind === kind) : posts;
}

export function getLocalKnowledgePost(kind: 'idea' | 'problem', slug: string) {
  return (
    readState().knowledgePosts.find((post) => post.kind === kind && post.slug === slug) ?? null
  );
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

async function resolveEntity(kind: 'idea' | 'problem' | 'project' | 'bounty', slug: string) {
  return browserRequest<Record<string, unknown>>(`/v1/${kind}s/${encodeURIComponent(slug)}`);
}

export async function addQuote(input: {
  body: string;
  target: QuotedTarget | null;
  actor?: SocialActor;
  quotedPostId?: string;
  quotedComment?: QuotedComment;
  media?: MediaAttachment | null;
}) {
  if (input.media) throw new Error('Server media uploads must complete before publishing a quote.');
  if (!input.target) throw new Error('A public quote target is required.');
  const token = await getCurrentAccessToken();
  if (!token) throw new Error('Your authenticated session expired. Sign in again.');
  const target = await resolveEntity(input.target.kind, input.target.slug);
  if (!target || typeof target.id !== 'string')
    throw new Error('The quoted target is unavailable.');
  const stored = await browserRequest<{ id: string; createdAt: string }>('/v1/posts', {
    method: 'POST',
    accessToken: token,
    body: JSON.stringify({
      entityType: input.target.kind,
      entityId: target.id,
      title: `Quote: ${input.target.title}`,
      body: input.body || input.target.summary,
      quotedPostId: input.quotedPostId,
    }),
  });
  if (!stored) throw new Error('Could not publish the quote.');
  const state = readState();
  const post: QuotePost = {
    id: stored.id,
    body: input.body.trim(),
    createdAt: stored.createdAt,
    actor: input.actor ?? guestActor,
    target: input.target,
    quotedPostId: input.quotedPostId,
    quotedComment: input.quotedComment,
    media: input.media ?? null,
  };
  state.quotes = [post, ...state.quotes];
  writeState(state);
  return post;
}

export async function addComment(input: {
  postId: string;
  body: string;
  actor?: SocialActor;
  parentId?: string | null;
  mentionUsername?: string | null;
  media?: MediaAttachment | null;
}) {
  if (input.media) throw new Error('Server media uploads must complete before publishing a reply.');
  const token = await getCurrentAccessToken();
  if (!token) throw new Error('Your authenticated session expired. Sign in again.');
  let stored: { id: string; createdAt: string };
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input.postId)) {
    const value = await browserRequest<{ id: string; createdAt: string }>(
      `/v1/posts/${input.postId}/replies`,
      {
        method: 'POST',
        accessToken: token,
        body: JSON.stringify({ body: input.body, parentReplyId: input.parentId }),
      },
    );
    if (!value) throw new Error('Could not publish the reply.');
    stored = value;
  } else {
    const [kind, slug] = input.postId.split(':') as [
      'idea' | 'problem' | 'project' | 'bounty',
      string,
    ];
    const entity = slug ? await resolveEntity(kind, slug) : null;
    if (!entity || typeof entity.id !== 'string')
      throw new Error('The discussion target is unavailable.');
    const value = await browserRequest<{ id: string; createdAt: string }>('/v1/posts', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({
        entityType: kind,
        entityId: entity.id,
        title: 'Discussion',
        body: input.body,
      }),
    });
    if (!value) throw new Error('Could not publish the discussion.');
    stored = value;
  }
  const state = readState();
  const comment: SocialComment = {
    id: stored.id,
    postId: input.postId,
    parentId: input.parentId ?? null,
    body: input.body.trim(),
    createdAt: stored.createdAt,
    actor: input.actor ?? guestActor,
    mentionUsername: input.mentionUsername ?? null,
    media: input.media ?? null,
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
  creator?: SocialActor;
  details?: LocalKnowledgePost['details'];
  primaryProblemSlug?: string | null;
  bountyAmount?: string;
  openToHiring?: boolean;
  files: File[];
}) {
  validatePostMedia(input.files);
  const token = await getCurrentAccessToken();
  if (!token) throw new Error('Your authenticated session expired. Sign in again.');
  const uploaded = await uploadFiles(input.files, 'public');
  let saved: Record<string, unknown> | null;
  if (input.kind === 'problem') {
    saved = await browserRequest<Record<string, unknown>>('/v1/problems', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({
        title: input.title,
        summary: input.summary,
        description: input.details?.problem ?? input.summary,
        affectedGroups: (input.details?.whoHasThisProblem ?? '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        evidence: [],
        desiredOutcome: input.details?.whyItMatters ?? null,
        constraints: [],
        successMetrics: [],
        visibility: 'public',
      }),
    });
  } else {
    if (!input.primaryProblemSlug) throw new Error('A primary public Problem is required.');
    let problem = await resolveEntity('problem', input.primaryProblemSlug);
    if ((!problem || typeof problem.id !== 'string') && input.details?.primaryProblemTitle) {
      const proposed = input.details.primaryProblemTitle.trim();
      problem = await browserRequest<Record<string, unknown>>('/v1/problems', {
        method: 'POST',
        accessToken: token,
        body: JSON.stringify({
          title: proposed,
          summary: `A creator-proposed problem context: ${proposed}.`,
          description: `This Problem was proposed by the creator as the primary context for a new Idea: ${proposed}.`,
          affectedGroups: [],
          evidence: [],
          constraints: [],
          successMetrics: [],
          visibility: 'public',
        }),
      });
      if (problem && typeof problem.id === 'string')
        await browserRequest(`/v1/problems/${problem.id}/publish`, {
          method: 'POST',
          accessToken: token,
        });
    }
    if (!problem || typeof problem.id !== 'string')
      throw new Error('The primary Problem is unavailable.');
    saved = await browserRequest<Record<string, unknown>>('/v1/ideas', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({
        problemId: problem.id,
        title: input.title,
        summary: input.summary,
        thesis: input.details?.opportunity ?? input.summary,
        solution: input.details?.solution ?? input.summary,
        opportunity: input.details?.opportunity ?? null,
        whyNow: input.details?.whyItMatters ?? null,
        targetUsers: [],
        risks: [],
        validationPlan: null,
        visibility: 'public',
      }),
    });
  }
  if (!saved || typeof saved.id !== 'string' || typeof saved.slug !== 'string')
    throw new Error('The server did not return the published object.');
  await browserRequest(`/v1/${input.kind}s/${saved.id}/publish`, {
    method: 'POST',
    accessToken: token,
  });
  await attachUploads(uploaded, input.kind, saved.id);
  const id = saved.id;
  const bountyRaw = input.kind === 'problem' ? usdcToRaw(input.bountyAmount ?? '') : null;
  const post: LocalKnowledgePost = {
    id,
    slug: saved.slug,
    kind: input.kind,
    title: input.title.trim(),
    summary: input.summary.trim(),
    details: input.details,
    createdAt: new Date().toISOString(),
    creator: input.creator ?? guestActor,
    primaryProblemSlug: input.kind === 'idea' ? (input.primaryProblemSlug ?? null) : null,
    bounty:
      input.kind === 'problem' && (bountyRaw || input.openToHiring)
        ? {
            title: input.title.trim(),
            // A locally entered amount is configuration intent, never proof of escrow funding.
            status: 'draft',
            amountRaw: bountyRaw ?? '0',
            currency: 'USDC',
            openToHiring: Boolean(input.openToHiring),
          }
        : null,
    attachments: uploaded.map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      name: asset.name,
      size: asset.size,
      mimeType: asset.mimeType,
    })),
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
