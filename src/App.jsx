import { useEffect, useMemo, useRef, useState } from 'react'
import MiniPlayer from './components/MiniPlayer'
import HomePage from './pages/HomePage'
import OnboardingPage from './pages/OnboardingPage'
import PlayerPage from './pages/PlayerPage'
import { STORAGE_KEYS } from './utils/constants'
import { dailyPickIndex } from './utils/dailyPick'
import { safeStorage } from './utils/storage'
import { fetchAllVideos } from './utils/youtubeService'

export default function App() {
  const [onboarded, setOnboarded] = useState(
    () => safeStorage.get(STORAGE_KEYS.onboarded) === '1'
  )
  const [signedIn, setSignedIn] = useState(
    () => safeStorage.get(STORAGE_KEYS.signedIn) === '1'
  )
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortOrder, setSortOrder] = useState('newest')
  // { list, index, minimized } while a video is loaded; the list snapshots
  // the sort order at open time, like the iOS fullScreenCover capture.
  // (iOS mini-mode advance re-reads the live sort order with a stale index,
  // which looks accidental — the snapshot is kept for both modes here.)
  const [session, setSession] = useState(null)
  const [miniPlaying, setMiniPlaying] = useState(true)
  const [lastPlayedID, setLastPlayedID] = useState(
    () => safeStorage.get(STORAGE_KEYS.lastPlayedVideoID) ?? ''
  )
  const playerControlsRef = useRef(null)
  const loadingRef = useRef(false)

  async function load() {
    // Re-entrancy guard (mirrors the iOS `guard !isLoading`): StrictMode's
    // doubled dev effect and Retry mashing must not crawl the API twice.
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    try {
      setVideos(await fetchAllVideos())
    } catch (cause) {
      setError(String(cause?.message ?? cause))
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // `videos` keeps fetch order so the daily pick stays stable while the
  // user flips the sort.
  const sortedVideos = useMemo(() => {
    const copy = [...videos]
    if (sortOrder === 'mostViewed') copy.sort((a, b) => b.viewCount - a.viewCount)
    else
      copy.sort(
        (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
      )
    return copy
  }, [videos, sortOrder])

  // Computed every render like the iOS property, so a session left open
  // past midnight rolls over to the new day's pick on the next update.
  const pickIndex = dailyPickIndex(videos.length)
  const dailyPick = pickIndex >= 0 ? videos[pickIndex] : null

  const currentVideo = session ? session.list[session.index] : null

  const resumeVideo = useMemo(() => {
    if (!lastPlayedID) return null
    const video = videos.find((item) => item.id === lastPlayedID)
    if (!video) return null
    if (video.id === dailyPick?.id) return null
    // Don't offer to "resume" what the mini player already shows.
    if (video.id === currentVideo?.id) return null
    return video
  }, [lastPlayedID, videos, dailyPick, currentVideo])

  function recordPlayback(video) {
    setLastPlayedID(video.id)
    safeStorage.set(STORAGE_KEYS.lastPlayedVideoID, video.id)
  }

  function openVideo(video) {
    const list = sortedVideos
    const index = Math.max(0, list.findIndex((item) => item.id === video.id))
    // Optimistic only when the loaded video actually changes (which triggers
    // a load + PLAYING event); re-opening the current, possibly paused video
    // keeps the honest last-known state.
    if (list[index].id !== currentVideo?.id) setMiniPlaying(true)
    setSession({ list, index, minimized: false })
    recordPlayback(list[index])
  }

  if (!onboarded) {
    return (
      <OnboardingPage
        onComplete={(choseSignIn) => {
          safeStorage.set(STORAGE_KEYS.onboarded, '1')
          if (choseSignIn) {
            safeStorage.set(STORAGE_KEYS.signedIn, '1')
            setSignedIn(true)
          }
          setOnboarded(true)
        }}
      />
    )
  }

  return (
    <>
      <HomePage
        videos={videos}
        sortedVideos={sortedVideos}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        dailyPick={dailyPick}
        resumeVideo={resumeVideo}
        loading={loading}
        error={error}
        onRetry={load}
        onSelect={openVideo}
        miniVisible={Boolean(session?.minimized)}
        signedIn={signedIn}
        onSignIn={() => {
          safeStorage.set(STORAGE_KEYS.signedIn, '1')
          setSignedIn(true)
        }}
        onSignOut={() => {
          safeStorage.set(STORAGE_KEYS.signedIn, '0')
          window.location.reload()
        }}
      />

      {session && (
        <PlayerPage
          videos={session.list}
          index={session.index}
          minimized={session.minimized}
          controlsRef={playerControlsRef}
          onIndexChange={(index) => {
            setSession((current) => (current ? { ...current, index } : current))
            recordPlayback(session.list[index])
            setMiniPlaying(true)
          }}
          onMinimize={() => setSession((current) => ({ ...current, minimized: true }))}
          onPlayingChange={setMiniPlaying}
        />
      )}

      {session?.minimized && currentVideo && (
        <MiniPlayer
          video={currentVideo}
          playing={miniPlaying}
          onExpand={() => setSession((current) => ({ ...current, minimized: false }))}
          onTogglePlay={() => playerControlsRef.current?.toggle()}
          onClose={() => setSession(null)}
        />
      )}
    </>
  )
}
