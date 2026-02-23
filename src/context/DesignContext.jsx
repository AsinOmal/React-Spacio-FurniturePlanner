import { createContext, useContext, useState, useEffect } from 'react'

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

  useEffect(() => {
    localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns))
  }, [savedDesigns])

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
  }

  const deleteDesign = (id) => {
    setSavedDesigns(prev => prev.filter(d => d.id !== id))
  }

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
    setFurniture(prev => [...prev, newItem])
    setSelectedId(newItem.id)
  }

  const updateFurniture = (id, updates) => {
    setFurniture(prev =>
      prev.map(f => f.id === id ? { ...f, ...updates } : f)
    )
  }

  const deleteFurniture = (id) => {
    setFurniture(prev => prev.filter(f => f.id !== id))
    setSelectedId(null)
  }

  return (
    <DesignContext.Provider value={{
      room, setRoom,
      furniture, setFurniture,
      selectedId, setSelectedId,
      savedDesigns,
      saveDesign, loadDesign, deleteDesign,
      addFurniture, updateFurniture, deleteFurniture
    }}>
      {children}
    </DesignContext.Provider>
  )
}

export function useDesign() {
  return useContext(DesignContext)
}