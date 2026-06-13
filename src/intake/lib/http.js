// Intake HTTP client — deliberately separate from @aviary-ui/core's apiRequest,
// which is admin-bound (admin JWT, refresh-token flow, redirect to /admin/login).
// This one carries a keeper guest token, re-exchanges it on 401, retries captcha
// once on 403, and adds X-Recaptcha-Token on writes. Decoupled by design.
import { intakeConfig } from '../config';
import { getGuestToken, invalidateGuestToken } from './guestToken';
import { executeRecaptcha } from './recaptcha';

// Mirrors @aviary-ui/core's NetworkError shape (status + message) without importing
// it, so the intake flow stays free of admin coupling.
export class IntakeError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'IntakeError';
    this.status = status;
  }
}

async function attempt(path, { method = 'GET', body, recaptchaAction }) {
  const token = await getGuestToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
  // reCAPTCHA token is regenerated per attempt (single-use; v3 tokens expire fast).
  if (recaptchaAction) headers['X-Recaptcha-Token'] = await executeRecaptcha(recaptchaAction);

  return fetch(`${intakeConfig.intakeUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function parse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new IntakeError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data; // { data, status } wrapper — callers read `.data`.
}

// intakeRequest('/public/...', { method, body, recaptchaAction })
//   - 401 → invalidate guest token, re-exchange, retry once.
//   - 403 → captcha rejected; retry once with a fresh token, then surface.
// Returns the parsed { data, status } wrapper; throws IntakeError on failure.
export async function intakeRequest(path, opts = {}) {
  let res = await attempt(path, opts);

  if (res.status === 401) {
    invalidateGuestToken();
    res = await attempt(path, opts);
  } else if (res.status === 403) {
    res = await attempt(path, opts);
  }

  return parse(res);
}
