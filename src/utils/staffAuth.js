const STAFF_SESSION_KEY = 'chef_planet_staff_session_v1';
const STAFF_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function getStaffPin() {
  return (import.meta.env.VITE_STAFF_PIN || '').trim();
}

export function getStaffSession() {
  try {
    const raw = sessionStorage.getItem(STAFF_SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || !session.expiresAt || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STAFF_SESSION_KEY);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to read staff session', error);
    return null;
  }
}

export function getAuthHeaders() {
  const session = getStaffSession();
  if (!session?.token) return {};
  return { Authorization: `Bearer ${session.token}` };
}

export function isStaffAuthenticated() {
  return Boolean(getStaffSession());
}

export async function signInStaff(pin) {
  const expectedPin = getStaffPin();
  if (!expectedPin) {
    return { ok: false, message: 'No staff PIN is configured for this environment.' };
  }

  try {
    const response = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: String(pin).trim() }),
    });

    const data = await response.json();
    if (!response.ok || !data?.ok) {
      return { ok: false, message: data?.message || 'Invalid staff PIN.' };
    }

    const session = {
      authenticatedAt: Date.now(),
      expiresAt: Number(data.expiresAt || Date.now() + STAFF_SESSION_TTL_MS),
      role: 'staff',
      token: data.token,
    };

    sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  } catch (error) {
    console.error('Staff login request failed:', error);
    return { ok: false, message: 'Unable to contact the staff authentication service.' };
  }
}

export function logoutStaff() {
  sessionStorage.removeItem(STAFF_SESSION_KEY);
}
