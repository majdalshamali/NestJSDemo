import arcjet, {
  shield,
  fixedWindow,
  detectBot,
  validateEmail,
  type ArcjetDecision,
} from '@arcjet/node';

export type { ArcjetDecision };

// LIVE = rules block the request. DRY_RUN = decision is logged but always allowed.
// Set ARCJET_MODE in .env. Defaults to DRY_RUN so a missing value never
// silently blocks production traffic.
const mode = process.env.ARCJET_MODE === 'LIVE' ? 'LIVE' : 'DRY_RUN';

// Base client. Shield (the WAF) runs on every request that passes through it;
// it looks for attack patterns such as SQL injection and XSS.
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [shield({ mode })],
});

// Rules attached per route with aj.withRule(...). Keeping them out of the base
// client means one scenario cannot interfere with another during testing.

// 5 requests per 10 seconds, counted per IP.
export const rateLimitRule = fixedWindow({
  mode,
  max: 5,
  window: '10s',
});

// allow: [] blocks every automated client. To permit search engines you would
// pass allow: ['CATEGORY:SEARCH_ENGINE'].
export const botRule = detectBot({
  mode,
  allow: [],
});

// Requires an `email` value to be passed to protect().
export const emailRule = validateEmail({
  mode,
  deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
});
