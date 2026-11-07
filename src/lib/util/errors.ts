export function friendlyError(e: unknown): string {
  const code = (e as { code?: unknown })?.code;
  const c = typeof code === 'string' ? code : '';
  // Sign-in and sign-up
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found'))
    return 'Email or password is incorrect.';
  if (c.includes('email-already-in-use')) return 'An account with this email already exists.';
  if (c.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (c.includes('invalid-email') || c.includes('missing-email')) return 'That email address does not look right.';
  if (c.includes('missing-password')) return 'Enter your password.';
  if (c.includes('network-request-failed')) return 'No connection. This needs the internet.';
  if (c.includes('too-many-requests')) return 'Too many attempts. Wait a minute and try again.';
  if (c.includes('operation-not-allowed') || c.includes('configuration-not-found'))
    return 'Email sign-in is not enabled for this Firebase project yet.';
  if (c.includes('user-disabled')) return 'This account has been disabled.';
  // Firestore
  if (c === 'permission-denied') return 'The server refused this. You may not have access to it.';
  if (c === 'unavailable' || c === 'deadline-exceeded') return 'The server cannot be reached. Check your connection.';
  if (c === 'failed-precondition') return 'The server is missing an index. Deploy firebase/firestore.indexes.json.';
  if (c === 'resource-exhausted') return 'The free Firebase quota for today is used up. Try again tomorrow.';
  if (c === 'unauthenticated') return 'You are signed out. Sign in again.';
  if (!c && e instanceof Error && e.name === 'UserFacingError') return e.message;
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('Unmapped error', e);
  return 'Something went wrong. Please try again.';
}

export function userError(message: string) {
  const e = new Error(message);
  e.name = 'UserFacingError';
  return e;
}
