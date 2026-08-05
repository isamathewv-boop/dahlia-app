import type {
  CoachTone,
  Equipment,
  Flow,
  Goal,
  Intensity,
  MealSlot,
  Symptom,
  TimeAvailable,
  WorkoutLevel,
} from '../types'

/** A pickable choice: the value we store, and the text the user reads. */
export interface Option<T extends string> {
  value: T
  label: string
}

/** Turns an option list into a { value: label } lookup for display. */
function toLabels<T extends string>(options: Option<T>[]): Record<T, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<
    T,
    string
  >
}

// ---------- Profile options ----------

export const GOALS: Option<Goal>[] = [
  { value: 'fat-loss', label: 'Fat loss' },
  { value: 'muscle-gain', label: 'Muscle gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'energy', label: 'More energy' },
  { value: 'hormone-support', label: 'Hormone / cycle support' },
  { value: 'overall-wellbeing', label: 'Overall well-being' },
]

export const LEVELS: Option<WorkoutLevel>[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export const TIMES: TimeAvailable[] = [15, 30, 45, 60]

export const EQUIPMENT: Option<Equipment>[] = [
  { value: 'bodyweight', label: 'Bodyweight only' },
  { value: 'bands', label: 'Resistance bands' },
  { value: 'dumbbells', label: 'Dumbbells at home' },
  { value: 'full-gym', label: 'Full gym' },
]

export const TONES: Option<CoachTone>[] = [
  { value: 'strict', label: 'Strict — no excuses' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'gentle', label: 'Gentle' },
]

export const CONDITIONS = [
  'PCOS',
  'Thyroid',
  'Anemia',
  'Endometriosis',
  'Diabetes',
  'Digestive issues',
  'Injury',
]

export const GOAL_LABELS = toLabels(GOALS)
export const LEVEL_LABELS = toLabels(LEVELS)
export const EQUIPMENT_LABELS = toLabels(EQUIPMENT)
export const TONE_LABELS = toLabels(TONES)

// ---------- Cycle options ----------

export const FLOWS: Option<Flow>[] = [
  { value: 'none', label: 'No bleeding' },
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

export const SYMPTOMS: Option<Symptom>[] = [
  { value: 'cramps', label: 'Cramps' },
  { value: 'headache', label: 'Headache' },
  { value: 'bloating', label: 'Bloating' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'nausea', label: 'Nausea' },
  { value: 'back-pain', label: 'Back pain' },
  { value: 'breast-tenderness', label: 'Breast tenderness' },
  { value: 'acne', label: 'Acne' },
]

export const FLOW_LABELS = toLabels(FLOWS)
export const SYMPTOM_LABELS = toLabels(SYMPTOMS)

// ---------- Workout options ----------

export const INTENSITIES: Option<Intensity>[] = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
]

export const WORKOUT_TYPES = [
  'Walk',
  'Mobility / stretching',
  'Yoga',
  'Strength — upper body',
  'Strength — lower body',
  'Strength — full body',
  'Cardio',
  'Rest day',
]

export const INTENSITY_LABELS = toLabels(INTENSITIES)

// ---------- Meal options ----------

export const MEAL_SLOTS: Option<MealSlot>[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

export const SLOT_LABELS = toLabels(MEAL_SLOTS)

// ---------- Shared 1-5 scale ----------

export const SCALE = [1, 2, 3, 4, 5] as const

export const SEVERITY_LABELS: Record<number, string> = {
  1: '1 — barely',
  2: '2 — mild',
  3: '3 — noticeable',
  4: '4 — bad',
  5: '5 — severe',
}

export const ENERGY_LABELS: Record<number, string> = {
  1: '1 — running on empty',
  2: '2 — low',
  3: '3 — okay',
  4: '4 — good',
  5: '5 — great',
}
