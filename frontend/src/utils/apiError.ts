export function getApiErrorDetail(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { detail?: string } } }).response;
    return res?.data?.detail ?? '';
  }
  return '';
}
