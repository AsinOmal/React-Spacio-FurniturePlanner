/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const DesignContext = createContext()

export function DesignProvider({ children }) {
  const [room, setRoom] = useState({
    width: 4,
    length: 3,
    shape: 'Rectangle',
    wallColor: '#F5F5DC',
    floorColor: '#D2B48C'
  })

  const [furniture, setFurniture] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [savedDesigns, setSavedDesigns] = useState(() => {
    const saved = localStorage.getItem('savedDesigns')
    return saved ? JSON.parse(saved) : []
  })

  // ── Undo / Redo history ──────────────────────────────────────
  const historyRef = useRef([[]])   // array of furniture snapshots
  const historyIdxRef = useRef(0)      // current position

  const pushHistory = useCallback((newFurniture) => {
    // Trim any redo entries ahead of current position
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1)
    historyRef.current.push(newFurniture.map(f => ({ ...f })))
    historyIdxRef.current = historyRef.current.length - 1
  }, [])

  const undo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current -= 1
      setFurniture(historyRef.current[historyIdxRef.current].map(f => ({ ...f })))
      setSelectedId(null)
    }
  }, [])

  const redo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current += 1
      setFurniture(historyRef.current[historyIdxRef.current].map(f => ({ ...f })))
      setSelectedId(null)
    }
  }, [])

  const canUndo = () => historyIdxRef.current > 0
  const canRedo = () => historyIdxRef.current < historyRef.current.length - 1

  // ── Persist designs ──────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns))
    } catch (e) {
      console.warn('Spacio: could not save designs to localStorage', e)
    }
  }, [savedDesigns])

  // ── Design save / load / delete ──────────────────────────────
  const saveDesign = (name) => {
    const design = {
      id: Date.now(),
      name,
      room,
      furniture,
      createdAt: new Date().toISOString()
    }
    setSavedDesigns(prev => {
      const existing = prev.findIndex(d => d.name === name)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = design
        return updated
      }
      return [...prev, design]
    })
  }

  const loadDesign = (design) => {
    setRoom(design.room)
    setFurniture(design.furniture)
    setSelectedId(null)
    // Reset history for the loaded design
    historyRef.current = [design.furniture.map(f => ({ ...f }))]
    historyIdxRef.current = 0
  }

  const deleteDesign = (id) => {
    setSavedDesigns(prev => prev.filter(d => d.id !== id))
  }

  // ── Furniture CRUD (all push to history) ─────────────────────
  const addFurniture = (item) => {
    const newItem = {
      id: Date.now(),
      ...item,
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      color: item.defaultColor
    }
    setFurniture(prev => {
      const next = [...prev, newItem]
      pushHistory(next)
      return next
    })
    setSelectedId(newItem.id)
  }

  const updateFurniture = (id, updates) => {
    setFurniture(prev => {
      const next = prev.map(f => f.id === id ? { ...f, ...updates } : f)
      return next
    })
  }

  // Called after drag / property change settles — commits to history
  const commitFurnitureHistory = () => {
    setFurniture(prev => {
      pushHistory(prev)
      return prev
    })
  }

  const deleteFurniture = (id) => {
    setFurniture(prev => {
      const next = prev.filter(f => f.id !== id)
      pushHistory(next)
      return next
    })
    setSelectedId(null)
  }

  return (
    <DesignContext.Provider value={{
      room, setRoom,
      furniture, setFurniture,
      selectedId, setSelectedId,
      savedDesigns,
      saveDesign, loadDesign, deleteDesign,
      addFurniture, updateFurniture, deleteFurniture, commitFurnitureHistory,
      undo, redo, canUndo, canRedo
    }}>
      {children}
    </DesignContext.Provider>
  )
}

export function useDesign() {
  return useContext(DesignContext)
}