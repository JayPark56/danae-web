// Mirrors the iOS app's AppConstants.swift.
export const CHANNEL_ID = 'UCs1M00zBz7AjeOE1rNfoLZQ'
// The uploads playlist is the channel ID with the leading "UC" -> "UU".
export const UPLOADS_PLAYLIST_ID = 'UUs1M00zBz7AjeOE1rNfoLZQ'

export const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY ?? ''

export const EMAILJS = {
  serviceID: 'service_dpiptvs',
  templateID: 'template_ghxg4wa',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? '',
}

export const STORAGE_KEYS = {
  onboarded: 'danae.hasCompletedOnboarding',
  lastPlayedVideoID: 'danae.lastPlayedVideoID',
  // '1' when the user took the Google sign-in path (we can't read YouTube's
  // cross-origin auth cookie, so this flag is the app's login state).
  signedIn: 'danae.signedIn',
}
