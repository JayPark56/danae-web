import { useEffect, useMemo, useRef, useState } from 'react'
import QuoteSection from '../components/QuoteSection'
import TracklistRow from '../components/TracklistRow'
import { isPlaylistTitled, parseQuote, parseTimestamps } from '../utils/descriptionParser'
import { fetchCommentTimestamps, formatDuration } from '../utils/youtubeService'

// Singleton loader for the YouTube IFrame API.
let apiPromise = null
function loadYouTubeAPI() {
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiPromise
}

// Full player: fixed overlay that stays mounted while minimized so audio
// keeps playing behind the home screen's mini bar. Walks `videos` on
// end-of-video (sequential, or random with shuffle on; repeat-one loops the
// current video and outranks shuffle while both are on).
export default function PlayerPage({
  videos,
  index,
  minimized,
  controlsRef,
  onIndexChange,
  onMinimize,
  onPlayingChange,
}) {
  const video = videos[index]

  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  // Shown when the browser blocked autoplay: one tap satisfies the user
  // gesture requirement, then playback starts.
  const [showPlayOverlay, setShowPlayOverlay] = useState(false)
  const overlayTimerRef = useRef(null)

  // If the player is still unstarted/cued a moment after we asked it to
  // play, autoplay was blocked — surface the tap-to-play overlay. The delay
  // keeps the overlay from flashing during normal load transitions.
  function scheduleOverlayCheck() {
    clearTimeout(overlayTimerRef.current)
    overlayTimerRef.current = setTimeout(() => {
      const state = playerRef.current?.getPlayerState?.()
      const states = window.YT?.PlayerState
      if (state === states?.UNSTARTED || state === -1 || state === states?.CUED) {
        setShowPlayOverlay(true)
      }
    }, 1200)
  }
  // -1 keeps every row inactive until the first position tick.
  const [currentTime, setCurrentTime] = useState(-1)
  const [tracklist, setTracklist] = useState([])
  // Independent toggles owned by the page, which stays mounted across video
  // transitions — both settings persist while the full player is open and
  // reset on minimize, mirroring iOS HomeView's fullScreenCover onDismiss.
  const [repeatOne, setRepeatOne] = useState(false)
  const [shuffleOn, setShuffleOn] = useState(false)

  useEffect(() => {
    if (minimized) {
      setRepeatOne(false)
      setShuffleOn(false)
    }
  }, [minimized])

  // Refs so the single long-lived player's event handlers always see
  // current values instead of stale closures.
  const repeatRef = useRef(repeatOne)
  repeatRef.current = repeatOne
  const shuffleRef = useRef(shuffleOn)
  shuffleRef.current = shuffleOn
  const indexRef = useRef(index)
  indexRef.current = index
  const countRef = useRef(videos.length)
  countRef.current = videos.length
  const onIndexChangeRef = useRef(onIndexChange)
  onIndexChangeRef.current = onIndexChange
  const onPlayingChangeRef = useRef(onPlayingChange)
  onPlayingChangeRef.current = onPlayingChange

  function advanceFromEnd() {
    const count = countRef.current
    const current = indexRef.current
    let next = current
    if (count > 1) {
      if (shuffleRef.current) {
        while (next === current) next = Math.floor(Math.random() * count)
      } else {
        next = (current + 1) % count
      }
    }
    if (next === current) {
      // Single-video list: just restart it.
      playerRef.current?.seekTo(0, true)
      playerRef.current?.playVideo()
    } else {
      onIndexChangeRef.current?.(next)
    }
  }
  const advanceFromEndRef = useRef(advanceFromEnd)
  advanceFromEndRef.current = advanceFromEnd

  const playlistTitled = isPlaylistTitled(video.title)
  const quote = useMemo(() => parseQuote(video.description), [video.description])

  // Tracklist priority: playlist-titled videos go straight to the top
  // comment; others use description timestamps first, comments as fallback.
  useEffect(() => {
    let cancelled = false
    const fromDescription = playlistTitled ? [] : parseTimestamps(video.description)
    setTracklist(fromDescription)
    if (fromDescription.length === 0) {
      fetchCommentTimestamps(video.id).then((timestamps) => {
        if (!cancelled && timestamps.length > 0) setTracklist(timestamps)
      })
    }
    return () => {
      cancelled = true
    }
  }, [video.id, video.description, playlistTitled])

  // Create the player once; later videos load into the same instance.
  useEffect(() => {
    let disposed = false
    loadYouTubeAPI().then((YT) => {
      if (disposed || playerRef.current || !containerRef.current) return
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: video.id,
        playerVars: {
          autoplay: 1,
          mute: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 0,
        },
        events: {
          onReady: (event) => {
            setPlayerReady(true)
            // Explicit start in case the autoplay parameter alone is
            // ignored; if the browser blocks this too, the overlay check
            // catches it.
            event.target.playVideo()
            scheduleOverlayCheck()
          },
          onStateChange: (event) => {
            const states = window.YT.PlayerState
            if (event.data === states.PLAYING) {
              clearTimeout(overlayTimerRef.current)
              setShowPlayOverlay(false)
              setPlaying(true)
              onPlayingChangeRef.current?.(true)
            } else if (event.data === states.UNSTARTED || event.data === states.CUED) {
              scheduleOverlayCheck()
            } else if (event.data === states.PAUSED) {
              setPlaying(false)
              onPlayingChangeRef.current?.(false)
            } else if (event.data === states.ENDED) {
              if (repeatRef.current) {
                event.target.seekTo(0, true)
                event.target.playVideo()
              } else {
                advanceFromEndRef.current()
              }
            }
          },
        },
      })
    })
    return () => {
      disposed = true
      clearTimeout(overlayTimerRef.current)
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Video transitions reuse the same player instance.
  const lastLoadedRef = useRef(video.id)
  useEffect(() => {
    setCurrentTime(-1)
    if (!playerReady) return
    if (lastLoadedRef.current !== video.id) {
      lastLoadedRef.current = video.id
      playerRef.current?.loadVideoById(video.id)
      scheduleOverlayCheck()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id, playerReady])

  // 1s position tick for the active-track highlight.
  useEffect(() => {
    const timer = setInterval(() => {
      const player = playerRef.current
      if (player?.getCurrentTime) {
        const seconds = player.getCurrentTime()
        if (typeof seconds === 'number' && seconds >= 0) setCurrentTime(seconds)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // The mini player's play/pause reaches the live player through this ref.
  useEffect(() => {
    if (!controlsRef) return
    controlsRef.current = {
      toggle: () => {
        const player = playerRef.current
        if (!player) return
        if (player.getPlayerState?.() === window.YT?.PlayerState?.PLAYING) {
          player.pauseVideo()
        } else {
          player.playVideo()
        }
      },
    }
    return () => {
      controlsRef.current = null
    }
  }, [controlsRef])

  // The track currently playing: largest timestamp at or before now.
  const activeIndex = useMemo(() => {
    let result = -1
    for (let i = 0; i < tracklist.length; i += 1) {
      if (tracklist[i].seconds <= currentTime) result = i
    }
    return result
  }, [tracklist, currentTime])

  function seekTo(seconds) {
    playerRef.current?.seekTo(seconds, true)
    // Move the highlight immediately instead of waiting for the next tick.
    setCurrentTime(seconds)
  }

  function nextTrack() {
    if (currentTime < 0) return
    const entry = tracklist.find((item) => item.seconds > currentTime)
    if (entry) seekTo(entry.seconds)
    else advanceFromEnd()
  }

  // Within the first 3 seconds of a track, go to the previous one; later,
  // restart the current track (double-tap goes back, like a music player).
  function previousTrack() {
    if (currentTime < 0) return
    const candidates = tracklist.filter((item) => item.seconds < currentTime - 3)
    const target = candidates.length > 0 ? candidates[candidates.length - 1] : null
    seekTo(target ? target.seconds : 0)
  }

  const noTracklist = tracklist.length === 0

  return (
    <div
      className={`fixed inset-0 z-30 overflow-y-auto bg-black transition-opacity duration-300 ${
        minimized ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      // inert/aria-hidden take the invisible overlay out of the tab order
      // and accessibility tree while minimized, without pausing the iframe.
      // (React 18 needs the empty-string form for the bare inert attribute.)
      inert={minimized ? '' : undefined}
      aria-hidden={minimized || undefined}
    >
      <div className="mx-auto max-w-xl px-4 pb-10 pt-3">
        {/* Top bar: back (minimize) left, playback toggles right. */}
        <div className="mb-3 flex items-center justify-between">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Back"
            onClick={onMinimize}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 4l-8 8 8 8" />
            </svg>
          </button>
          <div className="flex gap-2">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
              style={{ color: repeatOne ? '#FFD700' : 'rgba(255,255,255,0.5)' }}
              aria-label="한 곡 반복"
              onClick={() => setRepeatOne((value) => !value)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 2l4 4-4 4" />
                <path d="M3 11v-1a4 4 0 014-4h14" />
                <path d="M7 22l-4-4 4-4" />
                <path d="M21 13v1a4 4 0 01-4 4H3" />
              </svg>
              <span className="sr-only">1</span>
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
              style={{ color: shuffleOn ? '#FFD700' : 'rgba(255,255,255,0.5)' }}
              aria-label="셔플"
              onClick={() => setShuffleOn((value) => !value)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
            </button>
          </div>
        </div>

        {/* 16:9 player card. */}
        <div className="overflow-hidden rounded-2xl bg-[#111111]">
          <div className="relative aspect-video w-full">
            <div ref={containerRef} className="absolute inset-0 h-full w-full" />
            {showPlayOverlay && (
              <button
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"
                aria-label="재생"
                onClick={() => {
                  playerRef.current?.playVideo()
                  setShowPlayOverlay(false)
                }}
              >
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="36" cy="36" r="33" fill="rgba(0,0,0,0.55)" />
                  <path d="M29 23.5v25l19.5-12.5z" fill="white" stroke="none" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Transport: prev / play-pause / next, evenly spaced. */}
        <div className="flex items-center justify-around py-6">
          <button
            className="flex flex-col items-center gap-1 text-white disabled:opacity-35"
            disabled={noTracklist}
            onClick={previousTrack}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 5v14L8 12z" />
              <rect x="4.5" y="5" width="1.8" height="14" rx="0.9" />
            </svg>
            <span className="font-p4 text-[11px] text-white/70">이전 곡</span>
          </button>

          <button
            className="-mt-1.5 text-white"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => {
              const player = playerRef.current
              if (!player) return
              if (playing) player.pauseVideo()
              else player.playVideo()
            }}
          >
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="28" cy="28" r="26" />
              {playing ? (
                <g fill="currentColor" stroke="none">
                  <rect x="22" y="19" width="4" height="18" rx="1" />
                  <rect x="30" y="19" width="4" height="18" rx="1" />
                </g>
              ) : (
                <path d="M23 18.5v19l15-9.5z" fill="currentColor" stroke="none" />
              )}
            </svg>
          </button>

          <button
            className="flex flex-col items-center gap-1 text-white disabled:opacity-35"
            disabled={noTracklist}
            onClick={nextTrack}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 5v14l11-7z" />
              <rect x="17.7" y="5" width="1.8" height="14" rx="0.9" />
            </svg>
            <span className="font-p4 text-[11px] text-white/70">다음 곡</span>
          </button>
        </div>

        <div className="flex flex-col gap-7">
          <section>
            <h2 className="font-p6 text-[20px] text-white">{video.title}</h2>
            {video.durationSeconds > 0 && (
              <p className="mt-1 font-p3 text-[13px] text-white/55">
                {formatDuration(video.durationSeconds)}
              </p>
            )}
          </section>

          <QuoteSection quote={quote} />

          {tracklist.length > 0 && (
            <section>
              <h3 className="mb-2.5 font-p5 text-[17px] text-white">Tracklist</h3>
              <div className="flex flex-col">
                {tracklist.map((entry, entryIndex) => (
                  <TracklistRow
                    key={`${entry.seconds}-${entryIndex}`}
                    entry={entry}
                    isActive={entryIndex === activeIndex}
                    isPlaylistTitled={playlistTitled}
                    onSeek={seekTo}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
