import { useLayoutEffect, useRef, useState } from 'react'
import { splitLabel } from '../utils/descriptionParser'

// One tracklist row. Inactive: single truncated line (timestamp gray 0.5,
// artist gray 0.75, " - " gray 0.5, title white 0.85). Active: everything in
// accent yellow (timestamp at 0.75); the label stays on one line when it
// fits and only stacks artist-over-title when it would truncate — the web
// equivalent of the iOS ViewThatFits.
export default function TracklistRow({ entry, isActive, isPlaylistTitled, onSeek }) {
  const parts = isPlaylistTitled ? splitLabel(entry.label) : null
  const measureRef = useRef(null)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    if (!isActive) return
    const el = measureRef.current
    if (el) setOverflows(el.scrollWidth > el.clientWidth + 1)
  }, [isActive, entry.label])

  return (
    <button
      className="flex w-full items-baseline gap-3.5 py-0.5 text-left"
      onClick={() => onSeek(entry.seconds)}
    >
      <span
        className="min-w-[44px] shrink-0 font-p5 text-[15px]"
        style={{
          color: isActive ? 'rgba(255, 215, 0, 0.75)' : 'rgba(142, 142, 147, 0.5)',
        }}
      >
        {entry.time}
      </span>

      {isActive ? (
        parts && overflows ? (
          <span className="min-w-0 flex-1 font-p5 text-[15px] text-accent">
            <span className="block truncate">{parts.artist}</span>
            <span className="mt-0.5 block">{parts.title}</span>
          </span>
        ) : (
          <span
            ref={measureRef}
            className="min-w-0 flex-1 overflow-hidden whitespace-nowrap font-p5 text-[15px] text-accent"
          >
            {entry.label}
          </span>
        )
      ) : (
        <span className="min-w-0 flex-1 truncate font-p5 text-[15px]">
          {parts ? (
            <>
              <span className="text-sysgray/75">{parts.artist}</span>
              <span className="text-sysgray/50"> - </span>
              <span className="text-white/85">{parts.title}</span>
            </>
          ) : (
            <span className="text-white/85">{entry.label}</span>
          )}
        </span>
      )}
    </button>
  )
}
