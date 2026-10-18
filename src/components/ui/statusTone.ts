import type { Tone } from './Badge';

/**
 * Maps a domain status onto a badge tone so the same status is always the same
 * colour across every table and card.
 */
export const statusTone = (status: string): Tone => {
  switch (status) {
    case 'published':
    case 'active':
    case 'completed':
    case 'graded':
      return 'success';
    case 'draft':
    case 'submitted':
    case 'pending':
      return 'warning';
    case 'archived':
    case 'cancelled':
    case 'suspended':
      return 'danger';
    case 'returned':
    case 'info':
      return 'info';
    default:
      return 'neutral';
  }
};