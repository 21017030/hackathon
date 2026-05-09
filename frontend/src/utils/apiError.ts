/**
 * Axios 에러에서 FastAPI가 반환한 detail 메시지를 추출합니다.
 * 에러가 없거나 형식이 다르면 빈 문자열을 반환합니다.
 */
export function getApiErrorDetail(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { detail?: string } } }).response;
    return res?.data?.detail ?? '';
  }
  return '';
}
