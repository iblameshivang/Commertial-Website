export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5001`
).replace(/\/$/, '');

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
    return `${API_BASE}${trimmed}`;
  }

  return `${API_BASE}/${trimmed.replace(/^\.?\//, '')}`;
}
