import { useMemo, useState } from 'react'
import FeedbackModal from '../components/FeedbackModal'
import VideoCard from '../components/VideoCard'
import { isNew } from '../utils/youtubeService'

const TITLES = ['다나에.', 'danae.', 'ダナエ.']

// Dark confirmation dialog matching the app design: message + 예/아니요.
function ConfirmDialog({ message, onYes, onNo }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-8" onClick={onNo}>
      <div
        className="w-full max-w-[320px] rounded-2xl bg-[#111111] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-center font-p5 text-[15px] leading-relaxed text-white">{message}</p>
        <div className="mt-5 flex gap-2.5">
          <button
            className="flex-1 rounded-xl bg-white py-2.5 font-p7 text-[15px] text-black"
            onClick={onYes}
          >
            예
          </button>
          <button
            className="flex-1 rounded-xl bg-white/10 py-2.5 font-p5 text-[15px] text-white"
            onClick={onNo}
          >
            아니요
          </button>
        </div>
      </div>
    </div>
  )
}

// Person icon with a +/- badge for the login/logout button.
function PersonIcon({ minus }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="10" cy="8" r="4" />
      <path d="M3 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <path d="M16.5 8.5h5" />
      {!minus && <path d="M19 6v5" />}
    </svg>
  )
}

// iOS text-selection-style highlighted title: selection blue at 0.4, corner
// handle dots, and subtle dark fades on both edges.
function SelectionTitle({ text }) {
  return (
    <div className="flex justify-end">
      <div className="relative bg-selection/40 px-1.5 py-[3px]">
        <span
          className="absolute inset-y-0 left-0 w-2"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)' }}
        />
        <span
          className="absolute inset-y-0 right-0 w-2"
          style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)' }}
        />
        <span className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] rounded-full bg-selection" />
        <span className="absolute -bottom-[3px] -right-[3px] h-[7px] w-[7px] rounded-full bg-selection" />
        <h1 className="font-p9 text-[32px] leading-tight tracking-[4px] text-white">
          {text}
        </h1>
      </div>
    </div>
  )
}

export default function HomePage({
  videos,
  sortedVideos,
  sortOrder,
  onSortChange,
  dailyPick,
  resumeVideo,
  loading,
  error,
  onRetry,
  onSelect,
  miniVisible,
  signedIn,
  onSignIn,
  onSignOut,
}) {
  // Random per load; useState keeps the pick for the session.
  const [title] = useState(() => TITLES[Math.floor(Math.random() * TITLES.length)])
  const [showFeedback, setShowFeedback] = useState(false)
  // null | 'login' | 'logout'
  const [confirm, setConfirm] = useState(null)

  const newBadgeIDs = useMemo(
    () => new Set(videos.filter(isNew).map((video) => video.id)),
    [videos]
  )

  if (loading && videos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="font-p4 text-[15px] text-white/55">Loading videos…</p>
      </div>
    )
  }

  if (error && videos.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-8 text-center">
        <p className="font-p4 text-[15px] text-white/55">{error}</p>
        <button
          className="rounded-xl bg-white px-6 py-2.5 font-p5 text-[15px] text-black"
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div
      className="mx-auto min-h-screen max-w-xl bg-black px-4"
      style={{ paddingBottom: miniVisible ? 104 : 32 }}
    >
      <div className="flex items-start justify-between gap-3 pt-3">
        {/* Same compact circle as the player's repeat/shuffle toggles. */}
        <button
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70"
          aria-label={signedIn ? '로그아웃' : '로그인'}
          onClick={() => setConfirm(signedIn ? 'logout' : 'login')}
        >
          <PersonIcon minus={signedIn} />
        </button>
        <SelectionTitle text={title} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {dailyPick && (
          <section>
            <p className="mb-2.5 flex items-center gap-1.5 font-p8 text-[15px] text-accent">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0l1.8 4.6L14 5.3l-3.4 3 1 4.7L8 10.6 4.4 13l1-4.7L2 5.3l4.2-.7z" />
              </svg>
              Daily Pick
            </p>
            <VideoCard video={dailyPick} large onSelect={onSelect} />
          </section>
        )}

        {resumeVideo && (
          <button
            className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-2.5 text-left"
            onClick={() => onSelect(resumeVideo)}
          >
            <img
              src={resumeVideo.thumbnailURL}
              alt=""
              className="h-10 w-[60px] rounded-md object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-p3 text-[11px] text-white/60">이어서 듣기</span>
              <span className="block truncate font-p5 text-[13px] text-white">
                {resumeVideo.title}
              </span>
            </span>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="rgba(255,255,255,0.7)">
              <path d="M5 2.5v15l13-7.5z" />
            </svg>
          </button>
        )}

        <button
          className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-white py-3.5 font-p7 text-[17px] text-black"
          disabled={videos.length === 0}
          onClick={() => {
            const video = videos[Math.floor(Math.random() * videos.length)]
            if (video) onSelect(video)
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
          Surprise Me!
        </button>

        <div className="flex rounded-lg bg-white/10 p-0.5">
          {[
            { key: 'newest', label: '최신순' },
            { key: 'mostViewed', label: '인기순' },
          ].map((option) => (
            <button
              key={option.key}
              className={`flex-1 rounded-md py-1.5 font-p5 text-[13px] transition-colors ${
                sortOrder === option.key ? 'bg-[#3A3A3C] text-white' : 'text-white/60'
              }`}
              onClick={() => onSortChange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <section>
          <p className="mb-3 font-p5 text-[15px] text-white/55">All Playlists</p>
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-4">
            {sortedVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                showsNewBadge={newBadgeIDs.has(video.id)}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>

        <button
          className="w-full py-3 text-center font-p9 text-[16px] text-white/55"
          onClick={() => setShowFeedback(true)}
        >
          한마디 건네기
        </button>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      {confirm === 'login' && (
        <ConfirmDialog
          message="구글 아이디로 로그인하시겠습니까?"
          onYes={() => {
            window.open('https://www.youtube.com/signin', '_blank', 'noopener')
            onSignIn()
            setConfirm(null)
          }}
          onNo={() => setConfirm(null)}
        />
      )}
      {confirm === 'logout' && (
        <ConfirmDialog
          message="로그아웃해서 게스트 상태로 이용하시겠습니까?"
          onYes={() => {
            setConfirm(null)
            onSignOut()
          }}
          onNo={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
