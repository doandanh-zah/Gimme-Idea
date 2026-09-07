'use client';

import { userErrorMessage } from '@/lib/error-message';

import { ImagePlus, LoaderCircle, Trash2, Video, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import {
  createLocalKnowledgePost,
  type PublishOperation,
  PostMediaValidationError,
  validatePostMedia,
} from '@/lib/social';
import { browserRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const composerCopy = {
  en: {
    idea: 'Idea',
    problem: 'Problem',
    postIdea: 'Create Idea',
    postProblem: 'Create Problem',
    title: 'Title',
    ideaTitleExample: 'Name the idea clearly',
    problemTitleExample: 'State the problem clearly',
    description: '1-line description',
    descriptionExample: 'Keep the post card readable in one sentence.',
    problemBody: 'Problem',
    problemBodyExample: 'What is happening, and what pain point should people understand?',
    whoHasThisProblem: 'Who has this problem?',
    whoHasThisProblemExample: 'Name the user, buyer, operator, community or market segment.',
    whyItMatters: 'Why does it matter?',
    whyItMattersExample:
      'What breaks, gets wasted, slows down or becomes costly if this remains unsolved?',
    primaryProblem: 'Primary Problem',
    chooseProblem: 'Choose the problem this idea addresses',
    createNewProblem: 'Create new problem',
    newProblemTitle: 'New problem title',
    restaurantProblem: 'Restaurant food waste',
    repairProblem: 'Tenant repair visibility',
    opportunity: 'Opportunity',
    opportunityExample: 'What opens up if this problem is solved?',
    solution: 'Solution',
    solutionExample: 'Describe the product, workflow or mechanism.',
    addMoreDetails: 'Add more details',
    hideMoreDetails: 'Hide details',
    regionMarket: 'Region / Market',
    industry: 'Industry',
    currentWorkaround: 'Current workaround',
    existingSolutions: 'Existing solutions',
    desiredOutcome: 'Desired outcome',
    evidenceSource: 'Evidence / source',
    constraints: 'Constraints',
    knownData: 'Data you know',
    howItWorks: 'How it works',
    targetSegment: 'Target segment',
    whyNow: 'Why now',
    businessModel: 'Business model',
    goToMarket: 'Go-to-market',
    technicalApproach: 'Technical approach',
    competitors: 'Competitors',
    risks: 'Risks',
    previousAttempts: 'Previous attempts you know',
    dependencies: 'Dependencies',
    successMetrics: 'Success metrics',
    links: 'GitHub / demo / deck',
    bounty: 'Bounty (USDC)',
    bountyHint: 'Optional. Enter a whole or decimal USDC amount.',
    hiring: 'This Problem is also hiring',
    media: 'Photos and video',
    mediaRules: 'Up to 10 images (5MB each) and 1 video (25MB).',
    chooseMedia: 'Choose photos or video',
    remove: 'Remove',
    close: 'Close',
    publish: 'Post',
    publishing: 'Posting…',
    localNote:
      'Text drafts stay on this device. Posting publishes your content and uploads to the network.',
    titleRequired: 'Add a title.',
    descriptionRequired: 'Add a description.',
    problemBodyRequired: 'Describe the problem.',
    whoRequired: 'Add who has this problem.',
    whyRequired: 'Add why it matters.',
    problemRequired: 'Choose a Primary Problem.',
    opportunityRequired: 'Add the opportunity.',
    solutionRequired: 'Add the solution.',
    invalidBounty: 'Use a valid USDC amount with up to 6 decimal places.',
    storageError: 'Could not publish. Your text is kept; check your connection and try again.',
    unsupported: 'Only image and video files are supported.',
    tooManyImages: 'A post can contain up to 10 images.',
    tooManyVideos: 'A post can contain only 1 video.',
    imageTooLarge: 'Each image must be 5MB or smaller.',
    videoTooLarge: 'The video must be 25MB or smaller.',
  },
  vi: {
    idea: 'Ý tưởng',
    problem: 'Vấn đề',
    postIdea: 'Tạo Ý tưởng',
    postProblem: 'Tạo Vấn đề',
    title: 'Tiêu đề',
    ideaTitleExample: 'Đặt tên ý tưởng thật rõ ràng',
    problemTitleExample: 'Nêu vấn đề thật rõ ràng',
    description: 'Mô tả 1 câu',
    descriptionExample: 'Viết ngắn gọn để người đọc hiểu ngay trong danh sách.',
    problemBody: 'Vấn đề',
    problemBodyExample: 'Chuyện gì đang xảy ra và khó khăn cụ thể là gì?',
    whoHasThisProblem: 'Ai gặp vấn đề này?',
    whoHasThisProblemExample:
      'Nêu người dùng, người mua, người vận hành hoặc cộng đồng đang gặp vấn đề.',
    whyItMatters: 'Vì sao đáng giải quyết?',
    whyItMattersExample: 'Nếu không giải quyết thì điều gì hỏng, lãng phí, chậm lại hoặc tốn kém?',
    primaryProblem: 'Vấn đề chính',
    chooseProblem: 'Chọn vấn đề mà ý tưởng này giải quyết',
    createNewProblem: 'Tạo Problem mới',
    newProblemTitle: 'Tiêu đề Problem mới',
    restaurantProblem: 'Lãng phí thực phẩm tại nhà hàng',
    repairProblem: 'Minh bạch sửa chữa cho người thuê nhà',
    opportunity: 'Cơ hội',
    opportunityExample: 'Cơ hội gì mở ra nếu vấn đề này được giải quyết?',
    solution: 'Giải pháp',
    solutionExample: 'Mô tả sản phẩm, quy trình hoặc cách giải quyết.',
    addMoreDetails: 'Thêm chi tiết',
    hideMoreDetails: 'Ẩn chi tiết',
    regionMarket: 'Khu vực / Thị trường',
    industry: 'Lĩnh vực',
    currentWorkaround: 'Cách xử lý hiện tại',
    existingSolutions: 'Giải pháp hiện có',
    desiredOutcome: 'Kết quả mong muốn',
    evidenceSource: 'Bằng chứng / nguồn',
    constraints: 'Ràng buộc',
    knownData: 'Dữ liệu đã biết',
    howItWorks: 'Cách hoạt động',
    targetSegment: 'Nhóm người dùng',
    whyNow: 'Vì sao là lúc này',
    businessModel: 'Mô hình kinh doanh',
    goToMarket: 'Tiếp cận thị trường',
    technicalApproach: 'Hướng kỹ thuật',
    competitors: 'Đối thủ',
    risks: 'Rủi ro',
    previousAttempts: 'Những cách đã thử',
    dependencies: 'Phụ thuộc',
    successMetrics: 'Tiêu chí thành công',
    links: 'GitHub / demo / deck',
    bounty: 'Bounty (USDC)',
    bountyHint: 'Không bắt buộc. Nhập số USDC nguyên hoặc thập phân.',
    hiring: 'Problem này cũng đang tuyển người',
    media: 'Ảnh và video',
    mediaRules: 'Tối đa 10 ảnh (5MB mỗi ảnh) và 1 video (25MB).',
    chooseMedia: 'Chọn ảnh hoặc video',
    remove: 'Xoá',
    close: 'Đóng',
    publish: 'Đăng',
    publishing: 'Đang đăng…',
    localNote:
      'Bản nháp văn bản lưu trên thiết bị. Khi đăng, nội dung và tệp được xuất bản lên mạng lưới.',
    titleRequired: 'Hãy nhập tiêu đề.',
    descriptionRequired: 'Hãy nhập mô tả.',
    problemBodyRequired: 'Hãy mô tả Problem.',
    whoRequired: 'Hãy nhập ai đang gặp vấn đề.',
    whyRequired: 'Hãy nhập vì sao đáng quan tâm.',
    problemRequired: 'Hãy chọn Vấn đề chính.',
    opportunityRequired: 'Hãy nhập Opportunity.',
    solutionRequired: 'Hãy nhập Solution.',
    invalidBounty: 'Nhập số USDC hợp lệ với tối đa 6 chữ số thập phân.',
    storageError: 'Chưa thể đăng. Nội dung vẫn được giữ; kiểm tra kết nối rồi thử lại.',
    unsupported: 'Chỉ hỗ trợ file ảnh và video.',
    tooManyImages: 'Một bài đăng có tối đa 10 ảnh.',
    tooManyVideos: 'Một bài đăng chỉ có tối đa 1 video.',
    imageTooLarge: 'Mỗi ảnh phải có dung lượng tối đa 5MB.',
    videoTooLarge: 'Video phải có dung lượng tối đa 25MB.',
  },
} as const;

function mediaErrorMessage(locale: Locale, error: unknown) {
  const t = composerCopy[locale];
  if (!(error instanceof PostMediaValidationError)) return userErrorMessage(locale, error);
  const messages = {
    unsupported: t.unsupported,
    too_many_images: t.tooManyImages,
    too_many_videos: t.tooManyVideos,
    image_too_large: t.imageTooLarge,
    video_too_large: t.videoTooLarge,
  } as const;
  const message = messages[error.code];
  return error.fileName ? `${error.fileName}: ${message}` : message;
}

function SelectedMediaPreview({ file }: { file: File }) {
  const source = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => {
    return () => URL.revokeObjectURL(source);
  }, [source]);

  if (file.type.startsWith('video/')) {
    return <video src={source} muted playsInline preload="metadata" />;
  }
  // Local object URLs do not have stable dimensions for next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={source} alt="" />;
}

export function PostComposer({
  type,
  locale,
  onClose,
  initialProblem = '',
}: {
  type: 'idea' | 'problem' | null;
  locale: Locale;
  onClose: () => void;
  initialProblem?: string;
}) {
  const t = composerCopy[locale];
  const router = useRouter();
  const auth = useAuth();
  const draftKey = `gimme-composer:${auth.session?.id ?? 'guest'}:${type}:${initialProblem}`;
  const [draft] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(draftKey) ?? '{}');
    } catch {
      return {};
    }
  });
  const [operation] = useState<PublishOperation>(() => {
    try {
      return JSON.parse(draft.operation ?? '{"uploaded":[]}');
    } catch {
      return { uploaded: [] };
    }
  });
  const [progress, setProgress] = useState('');
  const [draftError, setDraftError] = useState(false);
  const finished = useRef(false);
  const [problemOptions, setProblemOptions] = useState<
    { id: string; slug: string; title: string }[]
  >([]);
  const [problemLoad, setProblemLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [problemRetry, setProblemRetry] = useState(0);
  const [problemQuery, setProblemQuery] = useState('');
  const [problemOffset, setProblemOffset] = useState(0);
  const [hasMoreProblems, setHasMoreProblems] = useState(false);
  const restoredProblem = draft.primaryProblem || initialProblem;
  useEffect(() => {
    if (type !== 'idea') return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the external resource state for a new request.
    setProblemLoad('loading');
    type Option = { id: string; slug: string; title: string };
    void Promise.all([
      browserRequest<Option[]>(`/v1/problems?limit=100&offset=${problemOffset}`, {
        signal: controller.signal,
      }),
      restoredProblem && problemOffset === 0
        ? browserRequest<Option>(`/v1/problems/${encodeURIComponent(restoredProblem)}`, {
            signal: controller.signal,
          })
        : Promise.resolve(null),
    ])
      .then(([rows, selected]) => {
        if (!controller.signal.aborted) {
          setProblemOptions((previous) => {
            const options = [
              ...(problemOffset ? previous : []),
              ...(selected ? [selected] : []),
              ...(rows ?? []),
            ];
            return options.filter(
              (item, index) => options.findIndex((other) => other.id === item.id) === index,
            );
          });
          setHasMoreProblems(rows?.length === 100);
          setProblemLoad('ready');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setProblemLoad('error');
      });
    return () => controller.abort();
  }, [type, problemRetry, problemOffset, restoredProblem]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaInputId = useId();
  const [title, setTitle] = useState(draft.title ?? '');
  const [description, setDescription] = useState(draft.description ?? '');
  const [problemBody, setProblemBody] = useState(draft.problemBody ?? '');
  const [whoHasThisProblem, setWhoHasThisProblem] = useState(draft.whoHasThisProblem ?? '');
  const [whyItMatters, setWhyItMatters] = useState(draft.whyItMatters ?? '');
  const [opportunity, setOpportunity] = useState(draft.opportunity ?? '');
  const [solution, setSolution] = useState(draft.solution ?? '');
  const [primaryProblem, setPrimaryProblem] = useState(draft.primaryProblem || initialProblem);
  const [newPrimaryProblemTitle, setNewPrimaryProblemTitle] = useState('');
  const bountyAmount = '';
  const openToHiring = false;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [extraDetails, setExtraDetails] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(draft.extraDetails ?? '{}');
    } catch {
      return {};
    }
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [formError, setFormError] = useState('');

  const draftText = JSON.stringify({
    title,
    description,
    problemBody,
    whoHasThisProblem,
    whyItMatters,
    opportunity,
    solution,
    primaryProblem,
    extraDetails: JSON.stringify(extraDetails),
    operation: JSON.stringify(operation),
    mediaNames: files.map((file) => file.name).join(', ') || draft.mediaNames || '',
  });
  useEffect(() => {
    if (finished.current) return;
    const timer = setTimeout(() => {
      if (finished.current) return;
      try {
        localStorage.setItem(draftKey, draftText);
        setDraftError(false);
      } catch {
        setDraftError(true);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [draftKey, draftText]);
  const dismiss = () => {
    if (submitting) return;
    try {
      if (!finished.current) localStorage.setItem(draftKey, draftText);
    } catch {
      setDraftError(true);
      return;
    }
    onClose();
  };
  const discard = () => {
    if (submitting) return;
    try {
      localStorage.removeItem(draftKey);
    } catch {
      setDraftError(true);
      return;
    }
    finished.current = true;
    onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (type && !dialog.open) dialog.showModal();
    if (!type && dialog.open) dialog.close();
  }, [type]);

  const titleError = submitted && !title.trim() ? t.titleRequired : '';
  const descriptionError = submitted && !description.trim() ? t.descriptionRequired : '';
  const problemBodyError =
    submitted && type === 'problem' && !problemBody.trim() ? t.problemBodyRequired : '';
  const whoError =
    submitted && type === 'problem' && !whoHasThisProblem.trim() ? t.whoRequired : '';
  const whyError = submitted && type === 'problem' && !whyItMatters.trim() ? t.whyRequired : '';
  const primaryProblemError =
    submitted && type === 'idea' && !primaryProblem ? t.problemRequired : '';
  const opportunityError =
    submitted && type === 'idea' && !opportunity.trim() ? t.opportunityRequired : '';
  const solutionError = submitted && type === 'idea' && !solution.trim() ? t.solutionRequired : '';
  const bountyIsValid = true;

  const addFiles = (incoming: File[]) => {
    const next = [...files, ...incoming];
    try {
      validatePostMedia(next);
      setFiles(next);
      setMediaError('');
    } catch (error) {
      setMediaError(mediaErrorMessage(locale, error));
    }
  };

  const publish = async () => {
    if (!auth.requireAuth('post')) return;
    setSubmitted(true);
    setFormError('');
    if (
      !type ||
      !title.trim() ||
      !description.trim() ||
      (type === 'problem' &&
        (!problemBody.trim() || !whoHasThisProblem.trim() || !whyItMatters.trim())) ||
      (type === 'idea' && (!opportunity.trim() || !solution.trim() || !primaryProblem)) ||
      !bountyIsValid
    ) {
      return;
    }
    const primaryProblemSlug = primaryProblem || null;
    const filteredExtra = Object.fromEntries(
      Object.entries(extraDetails).filter(([, value]) => value.trim()),
    );
    setSubmitting(true);
    try {
      const post = await createLocalKnowledgePost({
        kind: type,
        title,
        summary: description,
        creator: auth.actor,
        details:
          type === 'problem'
            ? {
                problem: problemBody.trim(),
                whoHasThisProblem: whoHasThisProblem.trim(),
                whyItMatters: whyItMatters.trim(),
                extra: filteredExtra,
              }
            : {
                opportunity: opportunity.trim(),
                solution: solution.trim(),
                primaryProblemTitle: newPrimaryProblemTitle.trim() || undefined,
                extra: filteredExtra,
              },
        primaryProblemSlug,
        bountyAmount,
        openToHiring,
        files,
        operation: operation,
        onProgress: (phase, current, total) => {
          const labels =
            locale === 'vi'
              ? {
                  upload: 'Đang tải tệp',
                  create: 'Đang lưu nội dung',
                  attach: 'Đang gắn tệp',
                  publish: 'Đang xuất bản',
                }
              : {
                  upload: 'Uploading files',
                  create: 'Saving content',
                  attach: 'Attaching files',
                  publish: 'Publishing',
                };
          setProgress(`${labels[phase]}${phase === 'upload' ? ` ${current}/${total}` : '…'}`);
          try {
            localStorage.setItem(
              draftKey,
              JSON.stringify({ ...JSON.parse(draftText), operation: JSON.stringify(operation) }),
            );
          } catch {
            setDraftError(true);
          }
        },
      });
      const destination = `/${locale}/${type === 'idea' ? 'ideas' : 'problems'}/${post.slug}`;
      finished.current = true;
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* Published content is safe on the server. */
      }
      onClose();
      router.refresh();
      router.push(destination);
    } catch (error) {
      setFormError(mediaErrorMessage(locale, error));
      setSubmitting(false);
    }
  };

  const setExtra = (key: string, value: string) => {
    setExtraDetails((current) => ({ ...current, [key]: value }));
  };
  const problemExtraFields = [
    ['regionMarket', t.regionMarket],
    ['industry', t.industry],
    ['desiredOutcome', t.desiredOutcome],
    ['evidenceSource', t.evidenceSource],
    ['constraints', t.constraints],
  ] as const;
  const ideaExtraFields = [
    ['targetSegment', t.targetSegment],
    ['whyNow', t.whyNow],
    ['risks', t.risks],
    ['successMetrics', t.successMetrics],
  ] as const;
  const optionalFields = type === 'problem' ? problemExtraFields : ideaExtraFields;

  return (
    <dialog
      ref={dialogRef}
      className="composer-dialog post-composer-dialog"
      aria-labelledby="composer-title"
      onClose={dismiss}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <form
        className="post-composer-form"
        aria-busy={submitting}
        onSubmit={(event) => {
          event.preventDefault();
          void publish();
        }}
      >
        <div className="composer-header">
          <div>
            <p>{type === 'problem' ? t.problem : t.idea}</p>
            <h2 id="composer-title">{type === 'problem' ? t.postProblem : t.postIdea}</h2>
          </div>
          <button type="button" aria-label={t.close} onClick={dismiss}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <fieldset
          className="post-composer-body"
          disabled={submitting || Boolean(operation.saved) || Boolean(operation.createUncertain)}
        >
          <div className="composer-field">
            <label htmlFor="post-title">{t.title}</label>
            <input
              id="post-title"
              required
              minLength={type === 'problem' ? 8 : 5}
              value={title}
              maxLength={120}
              autoComplete="off"
              placeholder={type === 'problem' ? t.problemTitleExample : t.ideaTitleExample}
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? 'post-title-error' : undefined}
              onChange={(event) => setTitle(event.target.value)}
            />
            <small>{title.length}/120</small>
            {titleError && (
              <span id="post-title-error" className="composer-field-error">
                {titleError}
              </span>
            )}
          </div>

          <div className="composer-field">
            <label htmlFor="post-description">{t.description}</label>
            <textarea
              id="post-description"
              required
              minLength={20}
              value={description}
              rows={2}
              maxLength={180}
              placeholder={t.descriptionExample}
              aria-invalid={Boolean(descriptionError)}
              aria-describedby={descriptionError ? 'post-description-error' : undefined}
              onChange={(event) => setDescription(event.target.value)}
            />
            <small>{description.length}/180</small>
            {descriptionError && (
              <span id="post-description-error" className="composer-field-error">
                {descriptionError}
              </span>
            )}
          </div>

          {type === 'problem' && (
            <>
              <div className="composer-field">
                <label htmlFor="post-problem-body">{t.problemBody}</label>
                <textarea
                  id="post-problem-body"
                  required
                  minLength={30}
                  value={problemBody}
                  rows={5}
                  maxLength={1400}
                  placeholder={t.problemBodyExample}
                  aria-invalid={Boolean(problemBodyError)}
                  aria-describedby={problemBodyError ? 'post-problem-body-error' : undefined}
                  onChange={(event) => setProblemBody(event.target.value)}
                />
                <small>{problemBody.length}/1400</small>
                {problemBodyError && (
                  <span id="post-problem-body-error" className="composer-field-error">
                    {problemBodyError}
                  </span>
                )}
              </div>
              <div className="composer-field">
                <label htmlFor="post-who">{t.whoHasThisProblem}</label>
                <textarea
                  id="post-who"
                  required
                  minLength={1}
                  value={whoHasThisProblem}
                  rows={3}
                  maxLength={700}
                  placeholder={t.whoHasThisProblemExample}
                  aria-invalid={Boolean(whoError)}
                  aria-describedby={whoError ? 'post-who-error' : undefined}
                  onChange={(event) => setWhoHasThisProblem(event.target.value)}
                />
                <small>{whoHasThisProblem.length}/700</small>
                {whoError && (
                  <span id="post-who-error" className="composer-field-error">
                    {whoError}
                  </span>
                )}
              </div>
              <div className="composer-field">
                <label htmlFor="post-why">{t.whyItMatters}</label>
                <textarea
                  id="post-why"
                  required
                  minLength={1}
                  value={whyItMatters}
                  rows={3}
                  maxLength={700}
                  placeholder={t.whyItMattersExample}
                  aria-invalid={Boolean(whyError)}
                  aria-describedby={whyError ? 'post-why-error' : undefined}
                  onChange={(event) => setWhyItMatters(event.target.value)}
                />
                <small>{whyItMatters.length}/700</small>
                {whyError && (
                  <span id="post-why-error" className="composer-field-error">
                    {whyError}
                  </span>
                )}
              </div>
            </>
          )}

          {type === 'idea' && (
            <>
              <div className="composer-field">
                <label htmlFor="post-primary-problem">{t.primaryProblem}</label>
                <select
                  id="post-primary-problem"
                  required
                  value={primaryProblem}
                  aria-invalid={Boolean(primaryProblemError)}
                  aria-describedby={primaryProblemError ? 'post-primary-problem-error' : undefined}
                  onChange={(event) => {
                    setPrimaryProblem(event.target.value);
                    if (event.target.value) setNewPrimaryProblemTitle('');
                  }}
                >
                  <option value="">{t.chooseProblem}</option>
                  {problemOptions
                    .filter(
                      (problem) =>
                        problem.slug === primaryProblem ||
                        problem.title
                          .toLocaleLowerCase(locale)
                          .includes(problemQuery.toLocaleLowerCase(locale)),
                    )
                    .map((problem) => (
                      <option key={problem.id} value={problem.slug}>
                        {problem.title}
                      </option>
                    ))}
                </select>
                <label htmlFor="problem-filter">
                  {locale === 'vi' ? 'Tìm vấn đề' : 'Find a Problem'}
                </label>
                <input
                  id="problem-filter"
                  type="search"
                  value={problemQuery}
                  onChange={(event) => setProblemQuery(event.target.value)}
                />
                <p role="status">
                  {problemLoad === 'loading'
                    ? locale === 'vi'
                      ? 'Đang tải vấn đề…'
                      : 'Loading Problems…'
                    : problemLoad === 'error'
                      ? locale === 'vi'
                        ? 'Chưa tải được vấn đề.'
                        : 'Could not load Problems.'
                      : !problemOptions.some((problem) =>
                            problem.title
                              .toLocaleLowerCase(locale)
                              .includes(problemQuery.toLocaleLowerCase(locale)),
                          )
                        ? locale === 'vi'
                          ? 'Không có kết quả phù hợp.'
                          : 'No matching Problems.'
                        : ''}
                </p>
                {hasMoreProblems && problemLoad === 'ready' && (
                  <button type="button" onClick={() => setProblemOffset((value) => value + 100)}>
                    {locale === 'vi' ? 'Tải thêm vấn đề để tìm' : 'Load more Problems to search'}
                  </button>
                )}
                {problemLoad === 'error' && (
                  <button type="button" onClick={() => setProblemRetry((value) => value + 1)}>
                    {locale === 'vi' ? 'Thử lại' : 'Try again'}
                  </button>
                )}
                <p>
                  {locale === 'vi'
                    ? 'Cần vấn đề mới? Lưu bản nháp rồi tạo Vấn đề với mô tả đầy đủ.'
                    : 'Need a new Problem? Save this draft, then create a Problem with a full description.'}
                </p>
                {primaryProblemError && (
                  <span id="post-primary-problem-error" className="composer-field-error">
                    {primaryProblemError}
                  </span>
                )}
              </div>
              <div className="composer-field">
                <label htmlFor="post-opportunity">{t.opportunity}</label>
                <textarea
                  id="post-opportunity"
                  required
                  minLength={20}
                  value={opportunity}
                  rows={4}
                  maxLength={1000}
                  placeholder={t.opportunityExample}
                  aria-invalid={Boolean(opportunityError)}
                  aria-describedby={opportunityError ? 'post-opportunity-error' : undefined}
                  onChange={(event) => setOpportunity(event.target.value)}
                />
                <small>{opportunity.length}/1000</small>
                {opportunityError && (
                  <span id="post-opportunity-error" className="composer-field-error">
                    {opportunityError}
                  </span>
                )}
              </div>
              <div className="composer-field">
                <label htmlFor="post-solution">{t.solution}</label>
                <textarea
                  id="post-solution"
                  required
                  minLength={20}
                  value={solution}
                  rows={4}
                  maxLength={1000}
                  placeholder={t.solutionExample}
                  aria-invalid={Boolean(solutionError)}
                  aria-describedby={solutionError ? 'post-solution-error' : undefined}
                  onChange={(event) => setSolution(event.target.value)}
                />
                <small>{solution.length}/1000</small>
                {solutionError && (
                  <span id="post-solution-error" className="composer-field-error">
                    {solutionError}
                  </span>
                )}
              </div>
            </>
          )}

          <fieldset className="composer-more-details">
            <legend className="sr-only">
              {detailsOpen ? t.hideMoreDetails : t.addMoreDetails}
            </legend>
            <button
              type="button"
              className="composer-more-toggle"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((value) => !value)}
            >
              {detailsOpen ? t.hideMoreDetails : t.addMoreDetails}
            </button>
            {detailsOpen && (
              <div className="composer-optional-grid">
                {optionalFields.map(([key, label]) => (
                  <div className="composer-field" key={key}>
                    <label htmlFor={`post-extra-${key}`}>{label}</label>
                    <textarea
                      id={`post-extra-${key}`}
                      value={extraDetails[key] ?? ''}
                      rows={2}
                      maxLength={700}
                      onChange={(event) => setExtra(key, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {type === 'problem' && (
            <p className="empty-note">
              {locale === 'vi'
                ? 'Thiết lập Bounty là bước riêng sau khi xuất bản vấn đề.'
                : 'Bounty setup is a separate step after publishing the Problem.'}
            </p>
          )}

          <fieldset className="composer-media-fieldset">
            <legend>{t.media}</legend>
            <p>{t.mediaRules}</p>
            <input
              id={mediaInputId}
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
              multiple
              onInput={(event) => {
                const incoming = Array.from(event.currentTarget.files ?? []);
                event.currentTarget.value = '';
                addFiles(incoming);
              }}
            />
            <label className="composer-media-trigger" htmlFor={mediaInputId}>
              <ImagePlus size={19} aria-hidden="true" />
              {t.chooseMedia}
            </label>
            {mediaError && (
              <p className="composer-form-error" role="alert">
                {mediaError}
              </p>
            )}
            {files.length > 0 && (
              <ul className="composer-media-list" aria-label={t.media}>
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}-${index}`}>
                    <div className="composer-media-preview">
                      <SelectedMediaPreview file={file} />
                      {file.type.startsWith('video/') && (
                        <span className="composer-media-kind">
                          <Video size={14} aria-hidden="true" />
                          VIDEO
                        </span>
                      )}
                    </div>
                    <span>
                      <strong>{file.name}</strong>
                      <small>{(file.size / (1024 * 1024)).toFixed(1)} MB</small>
                    </span>
                    <button
                      type="button"
                      aria-label={`${t.remove}: ${file.name}`}
                      onClick={() => {
                        setFiles((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        );
                        setMediaError('');
                      }}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          {draft.mediaNames && !files.length && (
            <p role="status">
              {locale === 'vi' ? 'Hãy chọn lại tệp cho bản nháp: ' : 'Reselect draft files: '}
              {draft.mediaNames}
            </p>
          )}
          {draftError && (
            <p role="alert">
              {locale === 'vi'
                ? 'Không thể lưu bản nháp trên thiết bị. Giữ màn hình này mở hoặc sao chép nội dung.'
                : 'Cannot save this draft on the device. Keep this editor open or copy your text.'}
            </p>
          )}
          {progress && <p role="status">{progress}</p>}
          <p className="composer-local-note">{t.localNote}</p>
          {formError && (
            <p className="composer-form-error" role="alert">
              {formError}
            </p>
          )}
        </fieldset>

        <div className="composer-footer">
          <button
            type="button"
            className="button button-quiet"
            disabled={submitting}
            onClick={discard}
          >
            {locale === 'vi' ? 'Bỏ bản nháp' : 'Discard draft'}
          </button>
          <button
            type="button"
            className="button button-quiet"
            disabled={submitting}
            onClick={dismiss}
          >
            {locale === 'vi' ? 'Lưu nháp và đóng' : 'Save draft and close'}
          </button>
          <button type="submit" className="button button-primary" disabled={submitting}>
            {submitting && (
              <LoaderCircle className="composer-spinner" size={17} aria-hidden="true" />
            )}
            {submitting ? t.publishing : t.publish}
          </button>
        </div>
      </form>
    </dialog>
  );
}
