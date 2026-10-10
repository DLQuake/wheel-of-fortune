
import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'wheel-of-fortune-settings'

const DEFAULT_ITEMS = [
  { id: '1', label: 'Prize', color: '#8b5cf6' },
  { id: '2', label: 'Try again', color: '#ec4899' },
  { id: '3', label: '10 points', color: '#f59e0b' },
  { id: '4', label: 'Bonus', color: '#10b981' },
  { id: '5', label: '20 points', color: '#3b82f6' },
  { id: '6', label: 'Surprise', color: '#f97316' },
  { id: '7', label: '50 points', color: '#06b6d4' },
  { id: '8', label: 'Try again', color: '#ef4444' },
]

function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      const parsed = JSON.parse(saved)

      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every(
          (item) =>
            typeof item.id === 'string' &&
            typeof item.label === 'string' &&
            typeof item.color === 'string' &&
            /^#[0-9a-fA-F]{6}$/.test(item.color),
        )
      ) {
        return parsed
      }
    }
  } catch {
    // W razie błędu użyj domyślnych ustawień.
  }

  return DEFAULT_ITEMS
}

export default function useWheel() {
  const [items, setItems] = useState(loadItems)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)

  const pendingWinner = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Aplikacja nadal działa, jeśli zapis jest niedostępny.
    }
  }, [items])

  const addItem = () => {
    if (spinning || items.length >= 20) return false

    const item = {
      id: crypto.randomUUID(),
      label: `Option ${items.length + 1}`,
      color: DEFAULT_ITEMS[items.length % DEFAULT_ITEMS.length].color,
    }

    setItems((current) => [...current, item])
    return true
  }

  const updateItem = (id, changes) => {
    if (spinning) return

    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    )
  }

  const removeItem = (id) => {
    if (spinning || items.length <= 2) return

    setItems((current) =>
      current.filter((item) => item.id !== id),
    )
  }

  const resetItems = () => {
    if (spinning) return

    setItems(DEFAULT_ITEMS.map((item) => ({ ...item })))
    setWinner(null)
    setRotation(0)
  }

  const spin = () => {
    if (spinning || items.length < 2) return

    const index = Math.floor(Math.random() * items.length)
    const sliceAngle = 360 / items.length

    const targetAngle =
      (360 - (index + 0.5) * sliceAngle) % 360

    const currentAngle = ((rotation % 360) + 360) % 360

    const delta =
      (targetAngle - currentAngle + 360) % 360

    const extraTurns = 5 + Math.floor(Math.random() * 3)

    pendingWinner.current = items[index]
    setWinner(null)
    setSpinning(true)

    setRotation(
      rotation + extraTurns * 360 + delta,
    )
  }

  const finishSpin = () => {
    if (!spinning || !pendingWinner.current) return
  
    setWinner(pendingWinner.current.label)
    pendingWinner.current = null
    setSpinning(false)
  }

  return {
    items,
    rotation,
    spinning,
    winner,
    spin,
    finishSpin,
    addItem,
    updateItem,
    removeItem,
    resetItems,
  }
}
