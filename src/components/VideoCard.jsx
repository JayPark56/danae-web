import { formatDuration } from '../utils/youtubeService'

// 16:9 thumbnail with duration badge (and optional NEW badge), title below —
// mirrors the iOS VideoThumbnail + grid cell.
export default function VideoCard({ video, showsNewBadge = false, large = false, onSelect }) {
  return (
    <button className="block w-full text-left" onClick={() => onSelect(video)}>
      <div
        className={`relative aspect-video w-full overflow-hidden bg-[#1F1F1F] ${
          large ? 'rounded-[14px]' : 'rounded-[10px]'
        }`}
      >
        <img
          src={video.thumbnailURL}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {showsNewBadge && (
          <span className="absolute left-1.5 top-1.5 rounded-[5px] bg-coral px-1.5 py-[3px] font-p7 text-[10px] leading-none text-white">
            NEW
          </span>
        )}
        {video.durationSeconds > 0 && (
          <span className="absolute bottom-1.5 right-1.5 rounded-[5px] bg-black/75 px-1.5 py-[3px] font-p2 text-[11px] leading-none text-white">
            {formatDuration(video.durationSeconds)}
          </span>
        )}
      </div>
      <p
        className={`mt-1.5 line-clamp-2 text-white ${
          large ? 'font-p5 text-[17px]' : 'font-p3 text-[13px]'
        }`}
      >
        {video.title}
      </p>
    </button>
  )
}
