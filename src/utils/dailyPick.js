// Port of ChannelViewModel's daily pick: the date (yyyyMMdd as an integer)
// runs through a SplitMix64 finalizer — deterministic, unlike a per-launch
// random seed — so the pick is stable all day and changes at midnight.
const MASK = (1n << 64n) - 1n

function splitmix64(value) {
  let z = (value + 0x9e3779b97f4a7c15n) & MASK
  z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK
  z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK
  return (z ^ (z >> 31n)) & MASK
}

export function dailyPickIndex(count) {
  if (count <= 0) return -1
  const now = new Date()
  const seed = BigInt(
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  )
  return Number(splitmix64(seed) % BigInt(count))
}
