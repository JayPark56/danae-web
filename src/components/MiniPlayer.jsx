// Bottom bar shown while the player is minimized: 64px tall, thumbnail,
// one-line title, play/pause, close — tapping elsewhere reopens the player.
export default function MiniPlayer({ video, playing, onExpand, onTogglePlay, onClose }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 h-16 cursor-pointer border-t border-white/10 bg-[#1F1F1F]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onClick={onExpand}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <img
          src={video.thumbnailURL}
          alt=""
          className="h-12 w-12 rounded-md object-cover"
        />
        <p className="min-w-0 flex-1 truncate font-p4 text-[13px] text-white">
          {video.title}
        </p>
        <button
          className="flex h-9 w-9 items-center justify-center text-white"
          aria-label={playing ? '일시정지' : '재생'}
          onClick={(event) => {
            event.stopPropagation()
            onTogglePlay()
          }}
        >
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="3" y="2" width="5" height="16" rx="1" />
              <rect x="12" y="2" width="5" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 2.5v15l13-7.5z" />
            </svg>
          )}
        </button>
        <button
          className="flex h-9 w-8 items-center justify-center text-white/60"
          aria-label="닫기"
          onClick={(event) => {
            event.stopPropagation()
            onClose()
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
