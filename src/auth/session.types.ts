import { auth } from './auth.js';

// Includes whatever the registered plugins add to the session/user shape
// (e.g. the admin plugin's role, banned, banReason, banExpires).
export type AuthSession = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Request {
      // Set by AuthGuard once a session has been resolved for the request.
      session?: AuthSession;
    }
  }
}
