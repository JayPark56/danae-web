// Port of the iOS YouTubeService: read-only YouTube Data API v3 client.
import { UPLOADS_PLAYLIST_ID, YOUTUBE_API_KEY } from './constants'
import { parseTimestamps } from './descriptionParser'

const API = 'https://www.googleapis.com/youtube/v3'

async function getJSON(url) {
  const response = await fetch(url)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.error?.message ?? `HTTP ${response.status}`
    throw new Error(`YouTube API 오류: ${message}`)
  }
  return data
}

function parseISO8601Duration(duration) {
  let seconds = 0
  let number = 0
  for (const character of duration) {
    if (character >= '0' && character <= '9') {
      number = number * 10 + Number(character)
    } else {
      if (character === 'H') seconds += number * 3600
      else if (character === 'M') seconds += number * 60
      else if (character === 'S') seconds += number
      number = 0
    }
  }
  return seconds
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function isNew(video) {
  if (!video.publishedAt) return false
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return Date.now() - new Date(video.publishedAt).getTime() < sevenDays
}

// Every public upload: playlistItems.list pages of 50, then videos.list
// batches for duration / full description / view count / publish date.
export async function fetchAllVideos() {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
    throw new Error('YouTube API 키가 없습니다. .env의 VITE_YOUTUBE_API_KEY를 설정해주세요.')
  }

  const videos = []
  let pageToken
  do {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId: UPLOADS_PLAYLIST_ID,
      maxResults: '50',
      key: YOUTUBE_API_KEY,
    })
    if (pageToken) params.set('pageToken', pageToken)
    const page = await getJSON(`${API}/playlistItems?${params}`)
    for (const item of page.items ?? []) {
      const snippet = item.snippet
      const thumbnails = snippet?.thumbnails ?? {}
      const best =
        thumbnails.maxres ?? thumbnails.standard ?? thumbnails.high ?? thumbnails.medium
      // Private/deleted videos still appear in the playlist but have no
      // thumbnails; skip them (same rule as the iOS app).
      if (!best) continue
      videos.push({
        id: snippet.resourceId.videoId,
        title: snippet.title,
        thumbnailURL: best.url,
        publishedAt: snippet.publishedAt ?? null,
        description: '',
        durationSeconds: 0,
        viewCount: 0,
      })
    }
    pageToken = page.nextPageToken
  } while (pageToken)

  for (let start = 0; start < videos.length; start += 50) {
    const batch = videos.slice(start, start + 50)
    const params = new URLSearchParams({
      part: 'contentDetails,snippet,statistics',
      id: batch.map((video) => video.id).join(','),
      key: YOUTUBE_API_KEY,
    })
    const page = await getJSON(`${API}/videos?${params}`)
    const byId = new Map((page.items ?? []).map((item) => [item.id, item]))
    for (const video of batch) {
      const item = byId.get(video.id)
      if (!item) continue
      video.durationSeconds = parseISO8601Duration(item.contentDetails?.duration ?? '')
      video.description = item.snippet?.description ?? ''
      video.viewCount = Number(item.statistics?.viewCount ?? 0)
      // playlistItems' date is when the video was ADDED to the uploads
      // playlist; videos.list has the real publish date.
      if (item.snippet?.publishedAt) video.publishedAt = item.snippet.publishedAt
    }
  }
  return videos
}

// Tracklist fallback: scan the top (relevance-ordered) comments and return
// the first one containing at least `minimumCount` parseable timestamps.
// Best-effort — comments may be disabled, so errors yield [].
export async function fetchCommentTimestamps(videoId, minimumCount = 3) {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      videoId,
      order: 'relevance',
      maxResults: '20',
      key: YOUTUBE_API_KEY,
    })
    const page = await getJSON(`${API}/commentThreads?${params}`)
    for (const thread of page.items ?? []) {
      const comment = thread.snippet?.topLevelComment?.snippet
      const text = comment?.textOriginal ?? ''
      const timestamps = parseTimestamps(text)
      if (timestamps.length >= minimumCount) return timestamps
    }
  } catch {
    // Silently tolerated, same as iOS.
  }
  return []
}
