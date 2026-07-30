import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { UserProfile } from '../types'
import { clearData, emptyData, loadData, saveData } from '../data/storage'
import { AppContext } from './AppContext'

export default function AppProvider({ children }: { children: ReactNode }) {
  // Load whatever was saved last time, once, when the app starts.
  const [data, setData] = useState(loadData)

  // Any time data changes, write it back to the device.
  useEffect(() => {
    saveData(data)
  }, [data])

  function saveProfile(profile: UserProfile) {
    setData((current) => ({ ...current, profile }))
  }

  function resetAll() {
    clearData()
    setData(emptyData)
  }

  return (
    <AppContext.Provider value={{ ...data, saveProfile, resetAll }}>
      {children}
    </AppContext.Provider>
  )
}
