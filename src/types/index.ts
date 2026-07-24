export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CycleLog {
  id: string;
  date: string;
  phase: string;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  type: string;
  durationMinutes: number;
  notes?: string;
}

export interface MealLog {
  id: string;
  date: string;
  name: string;
  calories?: number;
  notes?: string;
}

export interface SymptomLog {
  id: string;
  date: string;
  symptom: string;
  severity: number;
  notes?: string;
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}
