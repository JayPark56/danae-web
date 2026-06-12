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
}
