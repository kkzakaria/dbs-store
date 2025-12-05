"use client"

import { createContext, useContext, useState, useCallback } from "react"

interface AdminHeaderContextType {
  customTitle: string | null
  setCustomTitle: (title: string | null) => void
}

const AdminHeaderContext = createContext<AdminHeaderContextType | undefined>(undefined)

export function AdminHeaderProvider({ children }: { children: React.ReactNode }) {
  const [customTitle, setCustomTitle] = useState<string | null>(null)

  return (
    <AdminHeaderContext.Provider value={{ customTitle, setCustomTitle }}>
      {children}
    </AdminHeaderContext.Provider>
  )
}

export function useAdminHeader() {
  const context = useContext(AdminHeaderContext)
  if (!context) {
    throw new Error("useAdminHeader must be used within AdminHeaderProvider")
  }
  return context
}

// Hook to set custom title on mount and clear on unmount
export function useAdminTitle(title: string) {
  const { setCustomTitle } = useAdminHeader()

  // Use useEffect-like behavior via callback
  const setTitle = useCallback(() => {
    setCustomTitle(title)
    return () => setCustomTitle(null)
  }, [title, setCustomTitle])

  return setTitle
}
