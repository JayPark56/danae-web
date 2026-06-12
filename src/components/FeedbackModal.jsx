import { useState } from 'react'
import { EMAILJS } from '../utils/constants'

// "한마디 건네기" feedback sheet: textarea + EmailJS REST submission, with
// the same success/failure copy as the iOS app.
export default function FeedbackModal({ onClose }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState('')
  const [succeeded, setSucceeded] = useState(false)

  async function submit() {
    setSubmitting(true)
    setFailure('')
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS.serviceID,
          template_id: EMAILJS.templateID,
          user_id: EMAILJS.publicKey,
          template_params: {
            name: 'danae 웹 사용자',
            email: 'noreply@danae.app',
            message,
          },
        }),
      })
      if (response.ok) {
        setSucceeded(true)
      } else {
        const body = await response.text()
        setFailure(`HTTP ${response.status}: ${body}`)
      }
    } catch (error) {
      setFailure(String(error?.message ?? error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-[#111111] p-5 pb-8 sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-p7 text-[17px] text-white">의견을 남겨주세요</h2>
          <button
            className="font-p4 text-[14px] text-white/60 disabled:opacity-40"
            disabled={submitting}
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {succeeded ? (
          <div className="py-6 text-center">
            <p className="font-p5 text-[15px] text-white">
              의견이 전달됐습니다. 감사합니다!
            </p>
            <button
              className="mt-5 w-full rounded-xl bg-white py-3 font-p7 text-[15px] text-black"
              onClick={onClose}
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <textarea
              className="h-44 w-full resize-none rounded-xl bg-[#1A1A1A] p-3 font-p4 text-[15px] text-white outline-none placeholder:text-white/40"
              placeholder="자유롭게 적어주세요..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            {failure && (
              <p className="mt-2 break-all font-p4 text-[12px] text-coral">
                전송 실패: {failure}
              </p>
            )}
            <button
              className="mt-4 w-full rounded-xl bg-white py-3 font-p5 text-[15px] text-black disabled:opacity-40"
              disabled={!message.trim() || submitting}
              onClick={submit}
            >
              {submitting ? '전송 중…' : '제출하기'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
