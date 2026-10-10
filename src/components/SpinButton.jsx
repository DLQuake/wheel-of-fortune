
import { LoaderCircle, RotateCw } from 'lucide-react'
import './SpinButton.sass'

export default function SpinButton({ spinning, onClick }) {
  return (
    <button
      className="spin-button"
      onClick={onClick}
      disabled={spinning}
    >
      {spinning ? (
        <LoaderCircle className="spin-button__icon spin-button__loader" />
      ) : (
        <RotateCw className="spin-button__icon" />
      )}

      {spinning ? 'Spinning...' : 'Spin the wheel'}
    </button>
  )
}
