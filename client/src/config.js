export const API_BASE = '';

export const FALLBACK_IMAGE = '/images/no-image.svg';

export function resolveImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return FALLBACK_IMAGE;
  }

  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return FALLBACK_IMAGE;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\.?\//, '')}`;
}