import { createContext, useContext } from 'react'
import type { AppData, UserProfile } from '../types'
import { emptyData } from '../data/storage'

/** Everything any page can read or do with app-wide data. */
export interface AppState extends AppData {
  saveProfile: (profile: UserProfile) => void
  resetAll: () => void
}

export const AppContext = createContext<AppState>({
  ...emptyData,
  saveProfile: () => {},
  resetAll: () => {},
})

/** Use this in any page: const { profile } = useApp() */
export function useApp(): AppState {
  return useContext(AppContext)
}
