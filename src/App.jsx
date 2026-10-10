import { useState } from 'react'
import { Sparkles, Settings2 } from 'lucide-react'

import Wheel from './components/Wheel'
import SpinButton from './components/SpinButton'
import WheelSettings from './components/WheelSettings'
import WinnerEffect from './components/WinnerEffect'

import useWheel from './hooks/useWheel'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const {
    items,
    rotation,
    spinning,
    winner,
    addItem,
    updateItem,
    removeItem,
    resetItems,
    spin,
    finishSpin,
    clearWinner,
  } = useWheel()

  return (
    <main className="app">
      <header className="app__header">
        <div className="app__brand">
          <div className="app__logo">
            <Sparkles size={22} />
          </div>

          <div>
            <h1 className="app__title">Wheel of Fortune</h1>
            <p className="app__subtitle">Let fate decide</p>
          </div>
        </div>

        <div className="app__header-actions">
          <span className="app__badge">
            {items.length} options
          </span>

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
            onAnimationComplete={finishSpin}
          />

          <SpinButton
            spinning={spinning}
            onClick={spin}
          />

          <p className="app__hint">
            {spinning
              ? 'Please wait for the result'
              : 'Click the button to spin the wheel'}
          </p>
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