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

const composerCopy = {
  en: {
    idea: 'Idea',
    problem: 'Problem',
    postIdea: 'Post idea',
    postProblem: 'Post problem',
    title: 'Title',
    ideaTitleExample: 'Name the idea clearly',
    problemTitleExample: 'State the problem clearly',
    description: 'Description',
    descriptionExample: 'Explain the core signal, context and intended outcome.',
    primaryProblem: 'Primary Problem',
    chooseProblem: 'Choose the problem this idea addresses',
    restaurantProblem: 'Restaurant food waste',
    repairProblem: 'Tenant repair visibility',
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
    problemRequired: 'Choose a Primary Problem.',
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
    description: 'Mô tả',
    descriptionExample: 'Giải thích tín hiệu chính, bối cảnh và kết quả mong muốn.',
    primaryProblem: 'Vấn đề chính',
    chooseProblem: 'Chọn vấn đề mà ý tưởng này giải quyết',
    restaurantProblem: 'Lãng phí thực phẩm tại nhà hàng',
    repairProblem: 'Minh bạch sửa chữa cho người thuê nhà',
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
    problemRequired: 'Hãy chọn Vấn đề chính.',
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaInputId = useId();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [primaryProblem, setPrimaryProblem] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [openToHiring, setOpenToHiring] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [formError, setFormError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setPrimaryProblem('');
    setBountyAmount('');
    setOpenToHiring(false);
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
  const primaryProblemError =
    submitted && type === 'idea' && !primaryProblem ? t.problemRequired : '';
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
    setSubmitted(true);
    setFormError('');
    if (
      !type ||
      !title.trim() ||
      !description.trim() ||
      (type === 'idea' && !primaryProblem) ||
      !bountyIsValid
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const post = await createLocalKnowledgePost({
        kind: type,
        title,
        summary: description,
        primaryProblemSlug: primaryProblem || null,
        bountyAmount,
        openToHiring,
        files,
      });
      const destination = `/${locale}/${type === 'idea' ? 'ideas' : 'problems'}#post-${post.id}`;
      dismiss();
      router.push(destination);
    } catch (error) {
      setFormError(mediaErrorMessage(locale, error));
      setSubmitting(false);
    }
  };

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
              rows={5}
              maxLength={600}
              placeholder={t.descriptionExample}
              aria-invalid={Boolean(descriptionError)}
              aria-describedby={descriptionError ? 'post-description-error' : undefined}
              onChange={(event) => setDescription(event.target.value)}
            />
            <small>{description.length}/600</small>
            {descriptionError && (
              <span id="post-description-error" className="composer-field-error">
                {descriptionError}
              </span>
            )}
          </div>

          {type === 'idea' && (
            <div className="composer-field">
              <label htmlFor="post-primary-problem">{t.primaryProblem}</label>
              <select
                id="post-primary-problem"
                value={primaryProblem}
                aria-invalid={Boolean(primaryProblemError)}
                aria-describedby={primaryProblemError ? 'post-primary-problem-error' : undefined}
                onChange={(event) => setPrimaryProblem(event.target.value)}
              >
                <option value="">{t.chooseProblem}</option>
                <option value="restaurant-food-waste">{t.restaurantProblem}</option>
                <option value="tenant-repair-visibility">{t.repairProblem}</option>
              </select>
              {primaryProblemError && (
                <span id="post-primary-problem-error" className="composer-field-error">
                  {primaryProblemError}
                </span>
              )}
            </div>
          )}

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
