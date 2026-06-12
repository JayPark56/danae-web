// Port of the iOS DescriptionParser — quote extraction and timestamp
// parsing for the channel's structured description format.

const DIVIDER_RE = /^[_\-=*•·\s]+$/

function normalizedLines(text) {
  return text.replace(/\r\n/g, '\n').split('\n')
}

// "_가을방학,이브나" -> "가을방학,이브나"; null for non-source lines and
// decorative divider lines ("________", "_-_-_-") common in footers.
function sourceText(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('_')) return null
  const source = trimmed.replace(/^_+/, '').trim()
  if (!source || DIVIDER_RE.test(source)) return null
  return source
}

// Quote extraction. Preferred boundary: the "이미지 출처" (image credit)
// line — everything above it is the quote block, with the trailing _source
// line split out when present (source may be empty for quotes without an
// attribution). Descriptions without a credit line fall back to the
// original rule: the last _source line bounds the quote. Interior blank
// lines (stanza breaks) are preserved either way.
export function parseQuote(description) {
  const lines = normalizedLines(description)

  const creditIndex = lines.findIndex((line) => line.includes('이미지 출처'))
  if (creditIndex !== -1) {
    let block = lines.slice(0, creditIndex)
    let source = ''
    for (let i = block.length - 1; i >= 0; i -= 1) {
      const extracted = sourceText(block[i])
      if (extracted) {
        source = extracted
        block = block.slice(0, i)
        break
      }
    }
    const text = block.join('\n').trim()
    if (!text) return null
    return { text, source }
  }

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const source = sourceText(lines[i])
    if (!source) continue
    const text = lines.slice(0, i).join('\n').trim()
    if (!text) continue
    return { text, source }
  }
  return null
}

// Timestamp at line start (optionally bracketed) with no digit glued after
// it, then at most one separator like "-", "–", "|", ":" (or whitespace),
// then a non-empty label. "." is not a separator — labels like ".38 Special"
// start with it.
const TIMESTAMP_RE =
  /^\s*[[(]?((?:\d{1,2}:)?\d{1,2}:\d{2})(?!\d)[\])]?(?:\s*[-–—:|·]\s*|\s+)(\S.*?)\s*$/

function secondsFromTimestamp(time) {
  const parts = time.split(':').map(Number)
  if (parts.some(Number.isNaN)) return null
  if (parts.length === 2) {
    if (parts[1] > 59) return null
    return parts[0] * 60 + parts[1]
  }
  if (parts.length === 3) {
    if (parts[1] > 59 || parts[2] > 59) return null
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return null
}

export function parseTimestamps(description) {
  const entries = []
  for (const line of normalizedLines(description)) {
    const match = TIMESTAMP_RE.exec(line)
    if (!match) continue
    const seconds = secondsFromTimestamp(match[1])
    if (seconds === null) continue
    const label = match[2]
    // Drop entries with no actual text: separator-only leftovers ("0:00 ---")
    // and end/navigation markers that are pure emoji/symbols ("⏭", "▶", "→").
    if (!/[\p{L}\p{N}]/u.test(label)) continue
    entries.push({ time: match[1], seconds, label })
  }
  return entries.sort((a, b) => a.seconds - b.seconds)
}

// Titles starting with "playlist" mark curated mixes whose tracklist lives
// in the top comment, not the description. The channel styles titles with
// Unicode mathematical letters ("𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 …"), which only match after NFKC
// compatibility normalization (𝐩 -> p).
export function isPlaylistTitled(title) {
  return title.normalize('NFKC').trim().toLowerCase().startsWith('playlist')
}

function makeParts(artist, title) {
  const trimmedArtist = artist.trim()
  const trimmedTitle = title.trim()
  return trimmedArtist && trimmedTitle
    ? { artist: trimmedArtist, title: trimmedTitle }
    : null
}

// "Artist - Title" split at the FIRST separator. Spaced separators are
// tried first and accept every dash variant (-, –, —, −, －, ー). Unspaced
// separators (e.g. "あいみょん－ハルノヒ") only accept the unambiguous
// dashes — bare ASCII "-" lives inside words like K-POP and the katakana
// long-vowel mark "ー" inside words like スーパー, so those two only count
// when surrounded by spaces.
const SPACED_SEPARATOR_RE = /\s[-–—−－ー]\s/
const UNSPACED_SEPARATOR_RE = /[－–—−]/

export function splitLabel(label) {
  const spaced = SPACED_SEPARATOR_RE.exec(label)
  if (spaced) {
    const parts = makeParts(
      label.slice(0, spaced.index),
      label.slice(spaced.index + spaced[0].length)
    )
    if (parts) return parts
  }
  const unspaced = UNSPACED_SEPARATOR_RE.exec(label)
  if (unspaced) {
    const parts = makeParts(
      label.slice(0, unspaced.index),
      label.slice(unspaced.index + 1)
    )
    if (parts) return parts
  }
  return null
}
