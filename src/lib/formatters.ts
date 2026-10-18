/** Presentation helpers shared by pages and components. */

export const formatDate = (value?: string | Date): string => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (value?: string | Date): string => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** 95 -> "1h 35m". Always returns a value so layouts do not jump. */
export const formatDuration = (minutes?: number): string => {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
};

export const formatPrice = (amount?: number, currency = 'USD'): string => {
  const value = amount ?? 0;
  if (value === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

export const formatPercent = (value?: number): string => `${Math.round(value ?? 0)}%`;

export const formatCompactNumber = (value?: number): string => {
  const n = value ?? 0;
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
};

/** Trims a course/lesson blurb for card layouts. */
export const truncate = (value: string | undefined, max = 140): string => {
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
};

/** Pulls a display name out of either a bare id or a populated sub-document. */
export const nameOf = (value: { id: string; fullName: string } | string | undefined): string => {
  if (!value) return 'Unknown';
  return typeof value === 'string' ? value : value.fullName;
};

export const idOf = (value: { id: string } | string | undefined): string => {
  if (!value) return '';
  return typeof value === 'string' ? value : value.id;
};

export const errorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const candidate = error as { message?: string; data?: { message?: string } };
    if (candidate.data?.message) return candidate.data.message;
    if (candidate.message) return candidate.message;
  }
  return fallback;
};

export const fieldError = (
  error: unknown,
  field: string,
): string | undefined => apiErrors(error)?.find((item) => item.field === field)?.message;

/**
 * Extracts the API's `errors[]` array from a rejected RTK Query mutation, so
 * forms can map server-side validation messages onto individual inputs.
 */
export const apiErrors = (
  error: unknown,
): Array<{ field: string; message: string }> | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  return (error as { data?: { errors?: Array<{ field: string; message: string }> } }).data?.errors;
};

/** Field-level validation messages keyed by field name, ready for form inputs. */
export const apiFieldErrors = (
  error: unknown,
): Record<string, string> | undefined => {
  const list = apiErrors(error);
  if (!list?.length) return undefined;

  const mapped: Record<string, string> = {};
  list.forEach((item) => {
    if (!mapped[item.field]) mapped[item.field] = item.message;
  });
  return mapped;
};

/** Top-level message for a rejected mutation, falling back to a generic string. */
export const apiErrorMessage = (error: unknown, fallback = 'Something went wrong'): string =>
  errorMessage(error, fallback);

/** 1536 -> "1.5 KB". */
export const formatFileSize = (bytes?: number): string => {
  const value = bytes ?? 0;
  if (value <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const scaled = value / 1024 ** exponent;

  return `${exponent === 0 ? scaled : scaled.toFixed(1)} ${units[exponent]}`;
};

