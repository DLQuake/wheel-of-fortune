import { useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  Settings2,
  Moon,
  Sun,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Share2,
  Download,
  Upload,
  Trash2,
  History,
  Save,
  FolderOpen,
} from 'lucide-react'

import Wheel from './components/Wheel'
import SpinButton from './components/SpinButton'
import WheelSettings from './components/WheelSettings'
import WinnerEffect from './components/WinnerEffect'
import useWheel from './hooks/useWheel'

const THEME_KEY = 'wheel-of-fortune-theme'
const SOUND_KEY = 'wheel-of-fortune-sound'

let tickAudioContext = null

function playTone(frequency = 660, duration = 0.12) {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext

    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency

    gain.gain.setValueAtTime(0.12, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + duration,
    )

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start()
    oscillator.stop(context.currentTime + duration)

    oscillator.onended = () => context.close()
  } catch {
    // Dźwięk jest opcjonalny.
  }
}

function playTick() {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext

    if (!AudioContextClass) return

    if (
      !tickAudioContext ||
      tickAudioContext.state === 'closed'
    ) {
      tickAudioContext = new AudioContextClass()
    }

    const context = tickAudioContext

    if (context.state === 'suspended') {
      context.resume()
    }

    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'triangle'

    oscillator.frequency.setValueAtTime(1400, now)
    oscillator.frequency.exponentialRampToValueAtTime(
      650,
      now + 0.025,
    )

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(
      0.07,
      now + 0.003,
    )
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.035,
    )

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.04)
  } catch {
    // Dźwięk jest opcjonalny.
  }
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY)
      return savedTheme === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== 'false'
    } catch {
      return true
    }
  })

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [presetName, setPresetName] = useState('')

  const fileInputRef = useRef(null)
  const sharedLinkHandled = useRef(false)
  const lastTickIndex = useRef(null)

  const {
    items,
    rotation,
    spinning,
    winner,
    presets,
    history,
    wheelName,
    removeWinnerAfterSpin,
    setRemoveWinnerAfterSpin,
    addItem,
    updateItem,
    removeItem,
    resetItems,
    spin,
    finishSpin,
    clearWinner,
    savePreset,
    loadPreset,
    deletePreset,
    clearHistory,
    importItems,
    exportItems,
  } = useWheel()

  // Motyw całego dokumentu.
  useEffect(() => {
    const root = document.documentElement

    root.dataset.theme = theme
    root.style.colorScheme = theme

    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Motyw nadal działa w bieżącej sesji.
    }
  }, [theme])

  // Zapamiętywanie ustawienia dźwięku.
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, String(soundEnabled))
    } catch {
      // Ustawienie dźwięku nie jest krytyczne.
    }
  }, [soundEnabled])

  // Obsługa pełnego ekranu.
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange,
    )

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange,
      )
    }
  }, [])

  // Obsługa koła udostępnionego przez link.
  useEffect(() => {
    if (sharedLinkHandled.current) return

    sharedLinkHandled.current = true

    const params = new URLSearchParams(window.location.search)
    const sharedWheel = params.get('wheel')

    if (!sharedWheel) return

    try {
      const parsed = JSON.parse(sharedWheel)

      if (Array.isArray(parsed)) {
        importItems(parsed, 'Shared wheel')
      } else if (parsed && Array.isArray(parsed.items)) {
        importItems(parsed.items, parsed.name || 'Shared wheel')
      }
    } catch {
      console.warn('Invalid shared wheel configuration.')
    }
  }, [importItems])

  // Dźwięk startu obrotu.
  const handleSpin = () => {
    if (spinning) return

    lastTickIndex.current = null

    if (soundEnabled) {
      playTone(440, 0.18)
    }

    spin()
  }

  // Kliknięcia zsynchronizowane z przekraczaniem segmentów.
  const handleRotationChange = (angle) => {
    if (!spinning || !soundEnabled || items.length === 0) {
      return
    }

    const slice = 360 / items.length
    const currentTickIndex = Math.floor(angle / slice)

    if (lastTickIndex.current === null) {
      lastTickIndex.current = currentTickIndex
      return
    }

    if (currentTickIndex !== lastTickIndex.current) {
      lastTickIndex.current = currentTickIndex
      playTick()
    }
  }

  // Zakończenie obrotu i dźwięk zwycięstwa.
  const handleFinishSpin = () => {
    finishSpin()

    if (soundEnabled) {
      window.setTimeout(() => {
        playTone(880, 0.22)

        window.setTimeout(() => {
          playTone(1100, 0.3)
        }, 130)
      }, 50)
    }
  }

  const handleSavePreset = () => {
    if (!presetName.trim() || spinning) return

    if (savePreset(presetName.trim())) {
      setPresetName('')
    }
  }

  const handleShare = async () => {
    const payload = JSON.stringify(exportItems())
    const url = new URL(window.location.href)

    url.searchParams.set('wheel', payload)

    try {
      await navigator.clipboard.writeText(url.toString())
      window.alert('Link do koła został skopiowany.')
    } catch {
      window.prompt('Skopiuj link do koła:', url.toString())
    }
  }

  const handleExport = () => {
    downloadJson(exportItems(), 'wheel-of-fortune.json')
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      const parsed = JSON.parse(await file.text())

      const importedItems = Array.isArray(parsed)
        ? parsed
        : parsed?.items

      const name = Array.isArray(parsed)
        ? 'Imported wheel'
        : parsed?.name || 'Imported wheel'

      if (
        !Array.isArray(importedItems) ||
        !importItems(importedItems, name)
      ) {
        window.alert(
          'Nieprawidłowy plik. Wymagane są od 2 do 20 poprawnych opcji.',
        )
      }
    } catch {
      window.alert('Nie udało się odczytać pliku JSON.')
    } finally {
      event.target.value = ''
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      window.alert(
        'Pełny ekran nie jest dostępny w tej przeglądarce.',
      )
    }
  }

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === 'dark' ? 'light' : 'dark',
    )
  }

  return (
    <main className={`app app--${theme}`}>
      <header className="app__header">
        <div className="app__brand">
          <div className="app__logo">
            <Sparkles size={22} />
          </div>

          <div>
            <h1 className="app__title">Wheel of Fortune</h1>
            <p className="app__subtitle">{wheelName}</p>
          </div>
        </div>

        <div className="app__header-actions">
          <span className="app__badge">
            {items.length} options
          </span>

          <button
            type="button"
            className="app__icon-button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark'
                ? 'Włącz jasny motyw'
                : 'Włącz ciemny motyw'
            }
            title={
              theme === 'dark'
                ? 'Włącz jasny motyw'
                : 'Włącz ciemny motyw'
            }
          >
            {theme === 'dark'
              ? <Sun size={18} />
              : <Moon size={18} />}
          </button>

          <button
            type="button"
            className="app__icon-button"
            onClick={() => setSoundEnabled((value) => !value)}
            aria-label={
              soundEnabled ? 'Wyłącz dźwięk' : 'Włącz dźwięk'
            }
            title={
              soundEnabled ? 'Wyłącz dźwięk' : 'Włącz dźwięk'
            }
          >
            {soundEnabled
              ? <Volume2 size={18} />
              : <VolumeX size={18} />}
          </button>

          <button
            type="button"
            className="app__icon-button"
            onClick={toggleFullscreen}
            aria-label="Przełącz pełny ekran"
            title="Przełącz pełny ekran"
          >
            {isFullscreen
              ? <Minimize size={18} />
              : <Maximize size={18} />}
          </button>

          <button
            type="button"
            className="app__settings-button"
            onClick={() => setIsSettingsOpen(true)}
            disabled={spinning}
          >
            <Settings2 size={17} />
            Settings
          </button>
        </div>
      </header>

      <section className="app__content">
        <div className="app__wheel-section">
          <p className="app__instruction">
            {spinning
              ? 'Good luck! The wheel is spinning...'
              : 'Ready to make a decision?'}
          </p>

          <Wheel
            items={items}
            rotation={rotation}
            onRotationChange={handleRotationChange}
            onAnimationComplete={handleFinishSpin}
          />

          <SpinButton
            spinning={spinning}
            onClick={handleSpin}
          />

          <p className="app__hint">
            {spinning
              ? 'Please wait for the result'
              : 'Click the button to spin the wheel'}
          </p>
        </div>

        <div className="app__tools">
          <section className="app__tool-panel">
            <h2>
              <Save size={18} />
              Saved wheels
            </h2>

            <form
              className="app__inline-form"
              onSubmit={(event) => {
                event.preventDefault()
                handleSavePreset()
              }}
            >
              <input
                value={presetName}
                onChange={(event) =>
                  setPresetName(event.target.value)
                }
                placeholder="Preset name"
                aria-label="Preset name"
                maxLength={60}
                disabled={spinning}
              />

              <button
                type="submit"
                disabled={spinning || !presetName.trim()}
              >
                Save
              </button>
            </form>

            {presets.length === 0 ? (
              <p className="app__empty">
                No saved wheels yet.
              </p>
            ) : (
              <ul className="app__preset-list">
                {presets.map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      className="app__preset-load"
                      onClick={() => loadPreset(preset.id)}
                      disabled={spinning}
                    >
                      <FolderOpen size={16} />
                      <span>{preset.name}</span>
                    </button>

                    <button
                      type="button"
                      className="app__small-icon-button"
                      onClick={() => deletePreset(preset.id)}
                      disabled={spinning}
                      aria-label={`Delete ${preset.name}`}
                      title="Delete preset"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="app__tool-panel">
            <h2>
              <History size={18} />
              Spin history
            </h2>

            {history.length === 0 ? (
              <p className="app__empty">
                No results yet.
              </p>
            ) : (
              <>
                <ul className="app__history-list">
                  {history.slice(0, 10).map((entry) => (
                    <li key={entry.id}>
                      <span
                        className="app__history-color"
                        style={{ backgroundColor: entry.color }}
                      />

                      <span className="app__history-result">
                        <strong>{entry.label}</strong>
                        <small>
                          {entry.wheelName} ·{' '}
                          {new Date(entry.date).toLocaleString()}
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="app__text-button"
                  onClick={clearHistory}
                  disabled={spinning}
                >
                  <Trash2 size={15} />
                  Clear history
                </button>
              </>
            )}
          </section>

          <section className="app__tool-panel">
            <h2>Spin options</h2>

            <label className="app__toggle">
              <input
                type="checkbox"
                checked={removeWinnerAfterSpin}
                onChange={(event) =>
                  setRemoveWinnerAfterSpin(event.target.checked)
                }
                disabled={spinning}
              />

              <span>Remove winner from future spins</span>
            </label>

            <p className="app__empty">
              The wheel keeps at least two options.
            </p>
          </section>

          <section className="app__tool-panel">
            <h2>Share and backup</h2>

            <div className="app__action-list">
              <button
                type="button"
                onClick={handleShare}
                disabled={spinning}
              >
                <Share2 size={16} />
                Copy share link
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={spinning}
              >
                <Download size={16} />
                Export JSON
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={spinning}
              >
                <Upload size={16} />
                Import JSON
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={handleImport}
              />
            </div>
          </section>
        </div>
      </section>

      <footer className="app__footer">
        <Sparkles size={14} />
        <span>Every spin brings a new possibility</span>
      </footer>

      <WheelSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        items={items}
        onAdd={addItem}
        onUpdate={updateItem}
        onRemove={removeItem}
        onReset={resetItems}
        disabled={spinning}
      />

      <WinnerEffect
        winner={winner}
        onClose={clearWinner}
      />
    </main>
  )
}

export default App