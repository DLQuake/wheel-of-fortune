import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Trophy, Sparkles, X } from 'lucide-react'
import './WinnerEffect.sass'

export default function WinnerEffect({ winner, onClose }) {
  useEffect(() => {
    if (!winner) return

    const colors = [
      '#facc15',
      '#a78bfa',
      '#38bdf8',
      '#fb7185',
      '#4ade80',
    ]

    confetti({
      particleCount: 140,
      spread: 100,
      startVelocity: 40,
      origin: { x: 0.5, y: 0.55 },
      colors,
    })

    const end = Date.now() + 1800

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.65 },
        colors,
      })

      confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.65 },
        colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [winner])

  if (!winner) return null

  return (
    <div
      className="winner-effect"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className="winner-effect__card">
        <button
          type="button"
          className="winner-effect__close"
          onClick={onClose}
          aria-label="Close winner dialog"
        >
          <X size={20} />
        </button>

        <div className="winner-effect__icon">
          <Trophy size={32} />
        </div>

        <p className="winner-effect__eyebrow">
          <Sparkles size={16} />
          WE HAVE A WINNER!
          <Sparkles size={16} />
        </p>

        <h2 className="winner-effect__name">{winner}</h2>

        <p className="winner-effect__message">
          Congratulations!
        </p>

        <button
          type="button"
          className="winner-effect__dismiss"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}