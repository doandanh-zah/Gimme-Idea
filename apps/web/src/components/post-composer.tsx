'use client';

import { BriefcaseBusiness, ImagePlus, LoaderCircle, Trash2, Video, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import {
  createLocalKnowledgePost,
  PostMediaValidationError,
  validatePostMedia,
} from '@/lib/social';
import { useAuth } from '@/lib/auth';

const composerCopy = {
  en: {
    idea: 'Idea',
    problem: 'Problem',
    postIdea: 'Post idea',
    postProblem: 'Post problem',
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
    localNote: 'This foundation post and its media stay on this device.',
    titleRequired: 'Add a title.',
    descriptionRequired: 'Add a description.',
    problemBodyRequired: 'Describe the problem.',
    whoRequired: 'Add who has this problem.',
    whyRequired: 'Add why it matters.',
    problemRequired: 'Choose a Primary Problem.',
    opportunityRequired: 'Add the opportunity.',
    solutionRequired: 'Add the solution.',
    invalidBounty: 'Use a valid USDC amount with up to 6 decimal places.',
    storageError: 'Could not save this post on the device. Keep the files and try again.',
    unsupported: 'Only image and video files are supported.',
    tooManyImages: 'A post can contain up to 10 images.',
    tooManyVideos: 'A post can contain only 1 video.',
    imageTooLarge: 'Each image must be 5MB or smaller.',
    videoTooLarge: 'The video must be 25MB or smaller.',
  },
  vi: {
    idea: 'Ý tưởng',
    problem: 'Vấn đề',
    postIdea: 'Đăng ý tưởng',
    postProblem: 'Đăng vấn đề',
    title: 'Tiêu đề',
    ideaTitleExample: 'Đặt tên ý tưởng thật rõ ràng',
    problemTitleExample: 'Nêu vấn đề thật rõ ràng',
    description: 'Mô tả 1 câu',
    descriptionExample: 'Giữ đủ ngắn để card post đọc được ngay.',
    problemBody: 'Problem',
    problemBodyExample: 'Chuyện gì đang xảy ra, pain point cụ thể là gì?',
    whoHasThisProblem: 'Who has this problem?',
    whoHasThisProblemExample: 'Nêu user, buyer, operator, cộng đồng hoặc phân khúc thị trường.',
    whyItMatters: 'Why does it matter?',
    whyItMattersExample: 'Nếu không giải quyết thì điều gì hỏng, lãng phí, chậm lại hoặc tốn kém?',
    primaryProblem: 'Vấn đề chính',
    chooseProblem: 'Chọn vấn đề mà ý tưởng này giải quyết',
    createNewProblem: 'Tạo Problem mới',
    newProblemTitle: 'Tiêu đề Problem mới',
    restaurantProblem: 'Lãng phí thực phẩm tại nhà hàng',
    repairProblem: 'Minh bạch sửa chữa cho người thuê nhà',
    opportunity: 'Opportunity',
    opportunityExample: 'Cơ hội gì mở ra nếu vấn đề này được giải quyết?',
    solution: 'Solution',
    solutionExample: 'Mô tả sản phẩm, workflow hoặc cơ chế giải quyết.',
    addMoreDetails: 'Add more details',
    hideMoreDetails: 'Ẩn chi tiết',
    regionMarket: 'Region / Market',
    industry: 'Industry',
    currentWorkaround: 'Current workaround',
    existingSolutions: 'Existing solutions',
    desiredOutcome: 'Desired outcome',
    evidenceSource: 'Evidence / source',
    constraints: 'Constraints',
    knownData: 'Data họ biết',
    howItWorks: 'How it works',
    targetSegment: 'Target segment',
    whyNow: 'Why now',
    businessModel: 'Business model',
    goToMarket: 'Go-to-market',
    technicalApproach: 'Technical approach',
    competitors: 'Competitors',
    risks: 'Risks',
    previousAttempts: 'Previous attempts creator biết',
    dependencies: 'Dependencies',
    successMetrics: 'Success metrics',
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
    localNote: 'Bài foundation và media hiện được lưu trên thiết bị này.',
    titleRequired: 'Hãy nhập tiêu đề.',
    descriptionRequired: 'Hãy nhập mô tả.',
    problemBodyRequired: 'Hãy mô tả Problem.',
    whoRequired: 'Hãy nhập ai đang gặp vấn đề.',
    whyRequired: 'Hãy nhập vì sao đáng quan tâm.',
    problemRequired: 'Hãy chọn Vấn đề chính.',
    opportunityRequired: 'Hãy nhập Opportunity.',
    solutionRequired: 'Hãy nhập Solution.',
    invalidBounty: 'Nhập số USDC hợp lệ với tối đa 6 chữ số thập phân.',
    storageError: 'Không thể lưu bài trên thiết bị. File vẫn được giữ để bạn thử lại.',
    unsupported: 'Chỉ hỗ trợ file ảnh và video.',
    tooManyImages: 'Một bài đăng có tối đa 10 ảnh.',
    tooManyVideos: 'Một bài đăng chỉ có tối đa 1 video.',
    imageTooLarge: 'Mỗi ảnh phải có dung lượng tối đa 5MB.',
    videoTooLarge: 'Video phải có dung lượng tối đa 25MB.',
  },
} as const;

function mediaErrorMessage(locale: Locale, error: unknown) {
  const t = composerCopy[locale];
  if (!(error instanceof PostMediaValidationError)) return t.storageError;
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function PostComposer({
  type,
  locale,
  onClose,
}: {
  type: 'idea' | 'problem' | null;
  locale: Locale;
  onClose: () => void;
}) {
  const t = composerCopy[locale];
  const router = useRouter();
  const auth = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaInputId = useId();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [problemBody, setProblemBody] = useState('');
  const [whoHasThisProblem, setWhoHasThisProblem] = useState('');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [opportunity, setOpportunity] = useState('');
  const [solution, setSolution] = useState('');
  const [primaryProblem, setPrimaryProblem] = useState('');
  const [newPrimaryProblemTitle, setNewPrimaryProblemTitle] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [openToHiring, setOpenToHiring] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [extraDetails, setExtraDetails] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [formError, setFormError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setProblemBody('');
    setWhoHasThisProblem('');
    setWhyItMatters('');
    setOpportunity('');
    setSolution('');
    setPrimaryProblem('');
    setNewPrimaryProblemTitle('');
    setBountyAmount('');
    setOpenToHiring(false);
    setDetailsOpen(false);
    setExtraDetails({});
    setFiles([]);
    setSubmitted(false);
    setSubmitting(false);
    setMediaError('');
    setFormError('');
  };

  const dismiss = () => {
    reset();
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
    submitted && type === 'idea' && !primaryProblem && !newPrimaryProblemTitle.trim()
      ? t.problemRequired
      : '';
  const opportunityError =
    submitted && type === 'idea' && !opportunity.trim() ? t.opportunityRequired : '';
  const solutionError = submitted && type === 'idea' && !solution.trim() ? t.solutionRequired : '';
  const bountyIsValid = !bountyAmount || /^\d+(?:\.\d{1,6})?$/.test(bountyAmount.trim());
  const bountyError = submitted && type === 'problem' && !bountyIsValid ? t.invalidBounty : '';

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
      (type === 'idea' &&
        (!opportunity.trim() ||
          !solution.trim() ||
          (!primaryProblem && !newPrimaryProblemTitle.trim()))) ||
      !bountyIsValid
    ) {
      return;
    }
    const primaryProblemSlug =
      primaryProblem || (newPrimaryProblemTitle.trim() ? slugify(newPrimaryProblemTitle) : null);
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
      });
      const destination = `/${locale}/${type === 'idea' ? 'ideas' : 'problems'}/${post.slug}`;
      dismiss();
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
    ['currentWorkaround', t.currentWorkaround],
    ['existingSolutions', t.existingSolutions],
    ['desiredOutcome', t.desiredOutcome],
    ['evidenceSource', t.evidenceSource],
    ['constraints', t.constraints],
    ['knownData', t.knownData],
  ] as const;
  const ideaExtraFields = [
    ['howItWorks', t.howItWorks],
    ['targetSegment', t.targetSegment],
    ['whyNow', t.whyNow],
    ['businessModel', t.businessModel],
    ['goToMarket', t.goToMarket],
    ['technicalApproach', t.technicalApproach],
    ['competitors', t.competitors],
    ['risks', t.risks],
    ['previousAttempts', t.previousAttempts],
    ['dependencies', t.dependencies],
    ['successMetrics', t.successMetrics],
    ['links', t.links],
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

        <div className="post-composer-body">
          <div className="composer-field">
            <label htmlFor="post-title">{t.title}</label>
            <input
              id="post-title"
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
                  value={primaryProblem}
                  aria-invalid={Boolean(primaryProblemError)}
                  aria-describedby={primaryProblemError ? 'post-primary-problem-error' : undefined}
                  onChange={(event) => {
                    setPrimaryProblem(event.target.value);
                    if (event.target.value) setNewPrimaryProblemTitle('');
                  }}
                >
                  <option value="">{t.chooseProblem}</option>
                  <option value="restaurant-food-waste">{t.restaurantProblem}</option>
                  <option value="tenant-repair-visibility">{t.repairProblem}</option>
                </select>
                <input
                  id="post-new-primary-problem"
                  value={newPrimaryProblemTitle}
                  autoComplete="off"
                  placeholder={t.createNewProblem}
                  aria-label={t.newProblemTitle}
                  onChange={(event) => {
                    setNewPrimaryProblemTitle(event.target.value);
                    if (event.target.value.trim()) setPrimaryProblem('');
                  }}
                />
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
            <fieldset className="composer-problem-options">
              <legend>{t.bounty}</legend>
              <div className="composer-field">
                <label className="sr-only" htmlFor="post-bounty">
                  {t.bounty}
                </label>
                <input
                  id="post-bounty"
                  value={bountyAmount}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="1000"
                  aria-invalid={Boolean(bountyError)}
                  aria-describedby={bountyError ? 'post-bounty-error' : 'post-bounty-hint'}
                  onChange={(event) => setBountyAmount(event.target.value)}
                />
                <small id="post-bounty-hint">{t.bountyHint}</small>
                {bountyError && (
                  <span id="post-bounty-error" className="composer-field-error">
                    {bountyError}
                  </span>
                )}
              </div>
              <label className="composer-checkbox">
                <input
                  type="checkbox"
                  checked={openToHiring}
                  onChange={(event) => setOpenToHiring(event.target.checked)}
                />
                <BriefcaseBusiness size={18} aria-hidden="true" />
                <span>{t.hiring}</span>
              </label>
            </fieldset>
          )}

          <fieldset className="composer-media-fieldset">
            <legend>{t.media}</legend>
            <p>{t.mediaRules}</p>
            <input
              id={mediaInputId}
              className="sr-only"
              type="file"
              accept="image/*,video/*"
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

          <p className="composer-local-note">{t.localNote}</p>
          {formError && (
            <p className="composer-form-error" role="alert">
              {formError}
            </p>
          )}
        </div>

        <div className="composer-footer">
          <button type="button" className="button button-quiet" onClick={dismiss}>
            {t.close}
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
