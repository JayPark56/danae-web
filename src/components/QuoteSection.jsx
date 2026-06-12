// Quote block parsed from the description: subtle separator on top, italic
// quote text, then the "_source" attribution when present.
export default function QuoteSection({ quote }) {
  if (!quote) return null
  return (
    <section>
      <div className="mb-2.5 h-px bg-white/10" />
      <p className="whitespace-pre-line font-p5 text-[15px] italic leading-relaxed text-white/85">
        {quote.text}
      </p>
      {quote.source && (
        <p className="mt-2.5 font-p3 text-[13px] text-white/55">_{quote.source}</p>
      )}
    </section>
  )
}
