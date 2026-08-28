const CURRENCY_OPTIONS = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

export function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', CURRENCY_OPTIONS)}`;
}

export function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return `${formatDate(isoString)}, ${date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function countDaysFromNow(isoString) {
  const target = new Date(isoString);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / msPerDay));
}
