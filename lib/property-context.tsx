'use client'

import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from 'react'
import { supabase } from './supabase'

// ── Types ──────────────────────────────────────────────────────────────────
export type Property = {
  id: string
  name: string
  address: string | null
  jenis_kos: string
  fasilitas: Record<string, boolean>
}

type PropertyContextValue = {
  properties: Property[]
  selected: Property | null
  selectedId: string | null
  setSelectedId: (id: string) => void
  loading: boolean
  reload: () => Promise<void>
}

// ── Context ────────────────────────────────────────────────────────────────
const PropertyContext = createContext<PropertyContextValue>({
  properties: [],
  selected:   null,
  selectedId: null,
  setSelectedId: () => {},
  loading: true,
  reload: async () => {},
})

export function useProperty() {
  return useContext(PropertyContext)
}

// ── Provider ───────────────────────────────────────────────────────────────
export function PropertyProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedId, _setSelectedId] = useState<string | null>(null)
  const [loading,    setLoading]     = useState(true)

  const setSelectedId = useCallback((id: string) => {
    _setSelectedId(id)
    try { localStorage.setItem('kostzy_property_id', id) } catch {}
  }, [])

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('properties')
      .select('id, name, address, jenis_kos, fasilitas')
      .eq('owner_id', user.id)
      .order('name')

    const props = (data ?? []) as Property[]
    setProperties(props)

    try {
      const saved = localStorage.getItem('kostzy_property_id')
      if (saved && props.some(p => p.id === saved)) {
        _setSelectedId(saved)
      } else if (props.length > 0) {
        _setSelectedId(props[0].id)
        localStorage.setItem('kostzy_property_id', props[0].id)
      }
    } catch {
      if (props.length > 0) _setSelectedId(props[0].id)
    }

    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const selected = properties.find(p => p.id === selectedId) ?? null

  return (
    <PropertyContext.Provider value={{ properties, selected, selectedId, setSelectedId, loading, reload }}>
      {children}
    </PropertyContext.Provider>
  )
}
