import type { Locale } from '@gimme-idea/contracts';
import { ApiRequestError } from './api';

/** Keep server diagnostics in the network response; show a localized recovery step. */
export function userErrorMessage(locale: Locale, error: unknown) {
  const vi = locale === 'vi';
  const message = error instanceof Error ? error.message : '';
  if (error instanceof TypeError || /failed to fetch|network|offline/i.test(message))
    return vi
      ? 'Kết nối bị gián đoạn. Kiểm tra mạng rồi thử lại.'
      : 'The connection was interrupted. Check your network and try again.';
  if (
    /session expired|session.*sign in/i.test(message) ||
    (error instanceof ApiRequestError && error.status === 401)
  )
    return vi
      ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại rồi tiếp tục.'
      : 'Your session expired. Sign in again to continue.';
  if (error instanceof ApiRequestError) {
    if (error.code === 'PAYOUT_WALLET_REQUIRED')
      return vi
        ? 'Hãy xác minh ví nhận thưởng trong tài khoản trước khi nộp bài.'
        : 'Verify your reward wallet in your account before submitting.';
    if (error.code === 'IDEMPOTENCY_CONFLICT')
      return vi
        ? 'Nội dung đã thay đổi so với lần gửi trước. Khôi phục nội dung ban đầu để thử lại cùng yêu cầu.'
        : 'The content changed after the previous attempt. Restore the original content to retry the same request.';
    if (error.code === 'INVALID_STATE')
      return vi
        ? 'Trạng thái đã thay đổi hoặc đã hết hạn. Tải lại trang để xem bước tiếp theo.'
        : 'The status changed or the deadline passed. Reload the page to see what you can do next.';
    if (error.code === 'TEAM_PAYOUT_ACK_REQUIRED')
      return vi
        ? 'Hãy xác nhận ví nhận thưởng của đội trước khi gửi.'
        : 'Confirm your team reward wallet before submitting.';
    if (error.code === 'UPLOAD_REJECTED')
      return vi
        ? 'Tệp không được hỗ trợ hoặc vượt giới hạn dung lượng. Hãy kiểm tra loại và kích thước tệp.'
        : 'The file type or size is not supported. Check the file requirements.';
    if (error.status === 403)
      return vi
        ? 'Tài khoản này không có quyền thực hiện thao tác. Hãy kiểm tra tài khoản đang đăng nhập.'
        : 'This account does not have permission for this action. Check which account you are signed into.';
    if (error.status === 404)
      return vi
        ? 'Không tìm thấy nội dung hoặc bạn không có quyền truy cập.'
        : 'The content could not be found or you do not have access.';
    if (error.status === 429)
      return vi
        ? 'Bạn thao tác quá nhanh. Đợi một chút rồi thử lại.'
        : 'Too many requests. Wait a moment and try again.';
    if (error.status === 400)
      return vi
        ? 'Nội dung chưa hợp lệ. Kiểm tra các trường bắt buộc và giới hạn ký tự.'
        : 'Some content is invalid. Check required fields and character limits.';
  }
  if (/reselect the original files/i.test(message))
    return vi
      ? 'Chọn lại các tệp ban đầu theo cùng thứ tự để tiếp tục.'
      : 'Reselect the original files in the same order to continue.';
  if (/primary.*problem.*(required|unavailable)/i.test(message))
    return vi
      ? 'Hãy chọn một Vấn đề công khai còn khả dụng.'
      : 'Choose an available public Problem.';
  if (/storage.*not configured|upload.*failed|authorize.*file/i.test(message))
    return vi
      ? 'Chưa thể tải tệp lúc này. Giữ nội dung và thử lại sau.'
      : 'Files cannot be transferred right now. Keep your content and try again later.';
  if (/could not be confirmed|did not return the published/i.test(message))
    return vi
      ? 'Chưa xác nhận được lần gửi trước. Kiểm tra bài của bạn trước khi bắt đầu lần đăng mới.'
      : 'The previous attempt could not be confirmed. Check your posts before starting a new publication.';
  return vi
    ? 'Chưa hoàn tất thao tác. Hãy thử lại; nếu lỗi tiếp diễn, liên hệ hỗ trợ.'
    : 'The action could not be completed. Try again; if it keeps failing, contact support.';
}
