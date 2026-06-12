import { useEffect, useRef, useState } from 'react'
import { splitLabel } from '../utils/descriptionParser'

// One tracklist row, led by a zero-padded track number ("01.") instead of
// the timestamp — tapping still seeks to the entry's seconds. Inactive:
// number gray 0.5, single truncated label line (artist gray 0.9, " - " gray
// 0.5, title white 0.85). Active: number and label in yellow; "Artist -
// Title" labels stay on one line when they fit and stack artist-over-title
// when they would clip — the web equivalent of iOS ViewThatFits — while
// plain labels wrap freely like iOS lineLimit(nil). A hidden measurer keeps
// the fit decision fresh across webfont swap-in and resizes.
export default function TracklistRow({ entry, number, isActive, isPlaylistTitled, onSeek }) {
  const parts = isPlaylistTitled ? splitLabel(entry.label) : null
  const hasParts = parts !== null
  const wrapperRef = useRef(null)
  const measureRef = useRef(null)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    if (!isActive || !hasParts) return undefined
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      const wrapper = wrapperRef.current
      const measurer = measureRef.current
      if (wrapper && measurer) {
        setOverflows(measurer.offsetWidth > wrapper.clientWidth + 1)
      }
    }
    measure()
    document.fonts?.ready?.then(measure)
    const observer = new ResizeObserver(measure)
    if (wrapperRef.current) observer.observe(wrapperRef.current)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [isActive, hasParts, entry.label])

  return (
    <button
      className="flex w-full items-baseline gap-3.5 py-0.5 text-left"
      onClick={() => onSeek(entry.seconds)}
    >
      <span
        className="min-w-[44px] shrink-0 font-p5 text-[15px]"
        style={{
          color: isActive ? '#FFD700' : 'rgba(142, 142, 147, 0.5)',
        }}
      >
        {number}
      </span>

      <span ref={wrapperRef} className="relative min-w-0 flex-1 font-p5 text-[15px]">
        {isActive && hasParts && (
          // Hidden single-line measurer: its natural width vs the wrapper's
          // width decides one-line vs stacked, independent of which branch
          // is currently rendered.
          <span
            ref={measureRef}
            aria-hidden
            className="invisible absolute left-0 top-0 whitespace-nowrap"
          >
            {entry.label}
          </span>
        )}

        {isActive ? (
          hasParts ? (
            overflows ? (
              <span className="block text-accent">
                <span className="block truncate">{parts.artist}</span>
                <span className="mt-0.5 block">{parts.title}</span>
              </span>
            ) : (
              <span className="block overflow-hidden whitespace-nowrap text-accent">
                {entry.label}
              </span>
            )
          ) : (
            <span className="block break-words text-accent">{entry.label}</span>
          )
        ) : (
          <span className="block truncate">
            {hasParts ? (
              <>
                <span className="text-sysgray/90">{parts.artist}</span>
                <span className="text-sysgray/50"> - </span>
                <span className="text-white/85">{parts.title}</span>
              </>
            ) : (
              // Playlist-titled rows without a separator are more likely
              // artist-only than title-only, so render those artist-gray;
              // non-playlist videos keep iOS's title-white labels.
              <span className={isPlaylistTitled ? 'text-sysgray/90' : 'text-white/85'}>
                {entry.label}
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  )
}
