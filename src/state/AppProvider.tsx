import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AppData,
  CoachMessage,
  DailyCheckIn,
  MealLog,
  ReminderSettings,
  SymptomLog,
  UserProfile,
  WorkoutLog,
} from '../types'
import { clearData, createEmptyData, loadData, saveData } from '../data/storage'
import { newId } from '../data/date'
import { AppContext } from './AppContext'
import type { CycleEntryInput } from './AppContext'

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

  function saveCycleEntry(entry: CycleEntryInput) {
    setData((current) => ({
      ...current,
      // Drop anything already logged for this date, then add the new version.
      cycleLogs: [
        ...current.cycleLogs.filter((log) => log.date !== entry.date),
        {
          id: newId(),
          date: entry.date,
          flow: entry.flow,
          notes: entry.notes?.trim() || undefined,
        },
      ],
      symptomLogs: [
        ...current.symptomLogs.filter((log) => log.date !== entry.date),
        ...entry.symptoms.map(
          (s): SymptomLog => ({
            id: newId(),
            date: entry.date,
            symptom: s.symptom,
            severity: s.severity,
          }),
        ),
      ],
    }))
  }

  function deleteCycleEntry(date: string) {
    setData((current) => ({
      ...current,
      cycleLogs: current.cycleLogs.filter((log) => log.date !== date),
      symptomLogs: current.symptomLogs.filter((log) => log.date !== date),
    }))
  }

  function saveCheckIn(checkIn: Omit<DailyCheckIn, 'id'>) {
    setData((current) => ({
      ...current,
      checkIns: [
        ...current.checkIns.filter((c) => c.date !== checkIn.date),
        { ...checkIn, id: newId() },
      ],
    }))
  }

  function addWorkoutLog(log: Omit<WorkoutLog, 'id'>) {
    setData((current) => ({
      ...current,
      workoutLogs: [...current.workoutLogs, { ...log, id: newId() }],
    }))
  }

  function addMealLog(log: Omit<MealLog, 'id'>) {
    setData((current) => ({
      ...current,
      mealLogs: [...current.mealLogs, { ...log, id: newId() }],
    }))
  }

  function deleteWorkoutLog(id: string) {
    setData((current) => ({
      ...current,
      workoutLogs: current.workoutLogs.filter((log) => log.id !== id),
    }))
  }

  function deleteMealLog(id: string) {
    setData((current) => ({
      ...current,
      mealLogs: current.mealLogs.filter((log) => log.id !== id),
    }))
  }

  function addCoachMessage(message: Omit<CoachMessage, 'id'>) {
    setData((current) => ({
      ...current,
      coachMessages: [...current.coachMessages, { ...message, id: newId() }],
    }))
  }

  function clearCoachMessages() {
    setData((current) => ({ ...current, coachMessages: [] }))
  }

  function setReminders(reminders: ReminderSettings) {
    setData((current) => ({ ...current, reminders }))
  }

  function symptomsOn(date: string) {
    return data.symptomLogs.filter((log) => log.date === date)
  }

  function replaceAllData(imported: AppData) {
    setData(imported)
  }

  function resetAll() {
    clearData()
    setData(createEmptyData())
  }

  return (
    <AppContext.Provider
      value={{
        ...data,
        saveProfile,
        saveCycleEntry,
        saveCheckIn,
        addWorkoutLog,
        addMealLog,
        deleteWorkoutLog,
        deleteMealLog,
        deleteCycleEntry,
        addCoachMessage,
        clearCoachMessages,
        setReminders,
        symptomsOn,
        replaceAllData,
        resetAll,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
