// First-launch welcome screen: trilingual app name stack, quote subtitle,
// Google sign-in (opens YouTube sign-in so the browser session carries
// Premium into the embedded player), or guest.
export default function OnboardingPage({ onComplete }) {
  return (
    <div className="flex min-h-screen flex-col bg-black px-7 pb-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="text-center font-p9 text-[52px] leading-tight text-white">
          다나에.
          <br />
          danae.
          <br />
          {/* Paperlogy has no kana — the katakana falls through to Noto
              Sans JP Black while the trailing period stays Paperlogy. */}
          <span style={{ fontFamily: "'Paperlogy-9Black', 'Noto Sans JP', sans-serif" }}>
            ダナエ.
          </span>
        </h1>
        <p className="mt-3 font-p5 text-[15px] text-white/55">
          사랑해도 혼나지 않는 꿈이었다.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <button
          className="w-full rounded-2xl bg-white py-3.5 font-p7 text-[17px] text-black"
          onClick={() => {
            window.open('https://www.youtube.com/signin', '_blank', 'noopener')
            onComplete()
          }}
        >
          Sign in with Google
        </button>
        <button
          className="w-full rounded-2xl border border-white/25 py-3.5 font-p7 text-[17px] text-white"
          onClick={onComplete}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  )
}
