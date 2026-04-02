/**
 * Google OAuth: shown unless you set NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED=false
 * (hides the button for local dev or if you haven’t enabled Google in Supabase yet).
 */
export const oauthGoogleEnabled = process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED !== 'false'
