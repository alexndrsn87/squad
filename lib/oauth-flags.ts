/**
 * OAuth buttons only render when these are `true` in `.env` / Vercel.
 * Otherwise the browser hits Supabase authorize and you get a raw JSON 400
 * ("provider is not enabled") before our app can show a toast.
 */
export const oauthGoogleEnabled = process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED === 'true'

export const oauthAppleEnabled = process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED === 'true'

export const showOAuthSection = oauthGoogleEnabled || oauthAppleEnabled
