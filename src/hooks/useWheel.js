import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'wheel-of-fortune-settings'
const PRESETS_KEY = 'wheel-of-fortune-presets'
const HISTORY_KEY = 'wheel-of-fortune-history'
const OPTIONS_KEY = 'wheel-of-fortune-options'

export const DEFAULT_ITEMS = [
  { id: '1', label: 'Prize', color: '#8b5cf6', weight: 1 },
  { id: '2', label: 'Try again', color: '#ec4899', weight: 1 },
  { id: '3', label: '10 points', color: '#f59e0b', weight: 1 },
  { id: '4', label: 'Bonus', color: '#10b981', weight: 1 },
  { id: '5', label: '20 points', color: '#3b82f6', weight: 1 },
  { id: '6', label: 'Surprise', color: '#f97316', weight: 1 },
  { id: '7', label: '50 points', color: '#06b6d4', weight: 1 },
  { id: '8', label: 'Try again', color: '#ef4444', weight: 1 },
]

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeItems(items) {
  if (
    !Array.isArray(items) ||
    items.length < 2 ||
    items.length > 20 ||
    !items.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.label === 'string' &&
        typeof item.color === 'string' &&
        /^#[0-9a-fA-F]{6}$/.test(item.color),
    )
  ) {
    return null
  }

  return items.map((item) => ({
    ...item,
    weight:
      Number.isFinite(Number(item.weight)) && Number(item.weight) > 0
        ? Number(item.weight)
        : 1,
  }))
}

function loadItems() {
  const saved = readStorage(STORAGE_KEY, null)
  return normalizeItems(saved) ?? DEFAULT_ITEMS.map((item) => ({ ...item }))
}

function pickWeightedIndex(items) {
  const weights = items.map((item) => {
    const weight = Number(item.weight)
    return Number.isFinite(weight) && weight > 0 ? weight : 1
  })

  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let random = Math.random() * total

  for (let index = 0; index < weights.length; index += 1) {
    random -= weights[index]
    if (random < 0) return index
  }

  return weights.length - 1
}

export default function useWheel() {
  const [items, setItems] = useState(loadItems)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)

  const [presets, setPresets] = useState(() =>
    readStorage(PRESETS_KEY, []),
  )
  const [history, setHistory] = useState(() =>
    readStorage(HISTORY_KEY, []),
  )
  const [wheelName, setWheelName] = useState('My wheel')
  const [removeWinnerAfterSpin, setRemoveWinnerAfterSpin] = useState(
    () => readStorage(OPTIONS_KEY, {}).removeWinnerAfterSpin ?? false,
  )

  const pendingWinner = useRef(null)
  const spinningRef = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Działaj dalej, jeśli zapis jest niedostępny.
    }
  }, [items])

  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
    } catch {
      // Pomijamy zapis, jeśli localStorage jest niedostępny.
    }
  }, [presets])

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)))
    } catch {
      // Pomijamy zapis, jeśli localStorage jest niedostępny.
    }
  }, [history])

  useEffect(() => {
    try {
      localStorage.setItem(
        OPTIONS_KEY,
        JSON.stringify({ removeWinnerAfterSpin }),
      )
    } catch {
      // Pomijamy zapis, jeśli localStorage jest niedostępny.
    }
  }, [removeWinnerAfterSpin])

  const addItem = () => {
    if (spinningRef.current || items.length >= 20) return false

    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`

    const item = {
      id,
      label: `Option ${items.length + 1}`,
      color: DEFAULT_ITEMS[items.length % DEFAULT_ITEMS.length].color,
      weight: 1,
    }

    setItems((current) => [...current, item])
    return true
  }

  const updateItem = (id, changes) => {
    if (spinningRef.current) return

    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item

        const next = { ...item, ...changes }

        if ('weight' in changes) {
          const weight = Number(changes.weight)
          next.weight = Number.isFinite(weight) && weight > 0 ? weight : 1
        }

        return next
      }),
    )
  }

  const removeItem = (id) => {
    if (spinningRef.current || items.length <= 2) return
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const resetItems = () => {
    if (spinningRef.current) return

    setItems(DEFAULT_ITEMS.map((item) => ({ ...item })))
    setWinner(null)
    pendingWinner.current = null
    setRotation(0)
    setWheelName('My wheel')
  }

  const spin = () => {
    if (spinningRef.current || items.length < 2) return

    const index = pickWeightedIndex(items)
    const sliceAngle = 360 / items.length
    const targetAngle = (360 - (index + 0.5) * sliceAngle) % 360
    const currentAngle = ((rotation % 360) + 360) % 360
    const delta = (targetAngle - currentAngle + 360) % 360
    const extraTurns = 5 + Math.floor(Math.random() * 3)

    pendingWinner.current = { ...items[index] }
    spinningRef.current = true

    setWinner(null)
    setSpinning(true)
    setRotation(rotation + extraTurns * 360 + delta)
  }

  const finishSpin = () => {
    if (!spinningRef.current || !pendingWinner.current) return

    const selected = pendingWinner.current

    setWinner(selected.label)
    setHistory((current) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        label: selected.label,
        color: selected.color,
        wheelName,
        date: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 100))

    if (removeWinnerAfterSpin) {
      setItems((current) => {
        const remaining = current.filter((item) => item.id !== selected.id)
        return remaining.length >= 2 ? remaining : current
      })
    }

    pendingWinner.current = null
    spinningRef.current = false
    setSpinning(false)
  }

  const clearWinner = () => setWinner(null)

  const savePreset = (name) => {
    if (spinningRef.current) return false

    const cleanName = name.trim()
    if (!cleanName) return false

    const preset = {
      id: `${Date.now()}-${Math.random()}`,
      name: cleanName,
      items: items.map((item) => ({ ...item })),
      createdAt: new Date().toISOString(),
    }

    setPresets((current) => [...current, preset])
    setWheelName(cleanName)
    return true
  }

  const loadPreset = (id) => {
    if (spinningRef.current) return false

    const preset = presets.find((entry) => entry.id === id)
    const validated = normalizeItems(preset?.items)

    if (!preset || !validated) return false

    setItems(validated)
    setWheelName(preset.name)
    setWinner(null)
    setRotation(0)
    return true
  }

  const deletePreset = (id) => {
    if (spinningRef.current) return
    setPresets((current) => current.filter((preset) => preset.id !== id))
  }

  const clearHistory = () => setHistory([])

  const importItems = (importedItems, name = 'Imported wheel') => {
    if (spinningRef.current) return false

    const validated = normalizeItems(importedItems)
    if (!validated) return false

    setItems(validated)
    setWheelName(name)
    setWinner(null)
    setRotation(0)
    return true
  }

  const exportItems = useCallback(() => ({
    name: wheelName,
    items: items.map((item) => ({ ...item })),
  }), [items, wheelName])

  return {
    items,
    rotation,
    spinning,
    winner,
    presets,
    history,
    wheelName,
    setWheelName,
    removeWinnerAfterSpin,
    setRemoveWinnerAfterSpin,
    spin,
    finishSpin,
    clearWinner,
    addItem,
    updateItem,
    removeItem,
    resetItems,
    savePreset,
    loadPreset,
    deletePreset,
    clearHistory,
    importItems,
    exportItems,
  }
}