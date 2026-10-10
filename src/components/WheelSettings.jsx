
import { useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  Settings2,
} from 'lucide-react'
import './WheelSettings.sass'

export default function WheelSettings({
  isOpen,
  onClose,
  items,
  onAdd,
  onUpdate,
  onRemove,
  onReset,
  disabled = false,
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="settings-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <header className="settings-modal__header">
          <div className="settings-modal__heading">
            <div className="settings-modal__icon">
              <Settings2 size={22} />
            </div>

            <div>
              <h2 id="settings-title">
                Wheel settings
              </h2>
              <p>Customize your wheel segments</p>
            </div>
          </div>

          <button
            type="button"
            className="settings-modal__close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </header>

        <div className="settings-modal__summary">
          <span>Wheel segments</span>
          <span className="settings-modal__count">
            {items.length} / 20
          </span>
        </div>

        <div className="settings-modal__list">
          {items.map((item, index) => (
            <div
              className="segment-row"
              key={item.id}
            >
              <span className="segment-row__number">
                {String(index + 1).padStart(2, '0')}
              </span>

              <input
                className="segment-row__name"
                type="text"
                value={item.label}
                maxLength={32}
                aria-label={`Segment ${index + 1} name`}
                disabled={disabled}
                onChange={(event) =>
                  onUpdate(item.id, {
                    label: event.target.value,
                  })
                }
              />

              <input
                className="segment-row__color"
                type="color"
                value={item.color}
                aria-label={`Segment ${index + 1} color`}
                disabled={disabled}
                onChange={(event) =>
                  onUpdate(item.id, {
                    color: event.target.value,
                  })
                }
              />

              <button
                type="button"
                className="segment-row__remove"
                onClick={() => onRemove(item.id)}
                disabled={disabled || items.length <= 2}
                aria-label={`Remove segment ${index + 1}`}
                title="Remove segment"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>

        <div className="settings-modal__actions">
          <button
            type="button"
            className="settings-modal__add"
            onClick={onAdd}
            disabled={disabled || items.length >= 20}
          >
            <Plus size={18} />
            Add segment
          </button>

          <button
            type="button"
            className="settings-modal__reset"
            onClick={onReset}
            disabled={disabled}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        <footer className="settings-modal__footer">
          <span>
            Changes are saved automatically
          </span>

          <button
            type="button"
            className="settings-modal__done"
            onClick={onClose}
          >
            Done
          </button>
        </footer>
      </section>
    </div>
  )
}
