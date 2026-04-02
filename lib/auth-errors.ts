/** User-friendly copy when OAuth isn’t configured in Supabase. */
export function formatOAuthError(error: { message?: string } | null | undefined): string {
  const raw = (error?.message ?? '').toLowerCase()
  if (
    raw.includes('not enabled') ||
    raw.includes('unsupported provider') ||
    raw.includes('validation_failed') ||
    raw.includes('provider is not enabled')
  ) {
    return 'Google sign-in isn’t enabled in your Supabase project yet. Use the email link below, or open Supabase → Authentication → Providers → Google → enable and add your OAuth client ID & secret.'
  }
  return error?.message ?? 'Something went wrong. Try email sign-in instead.'
}
